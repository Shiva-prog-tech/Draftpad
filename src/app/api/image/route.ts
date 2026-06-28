import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { pollinationsUrl } from '@/lib/pollinations';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) return NextResponse.json({ error: 'No prompt provided' }, { status: 400 });
  if (prompt.length > 800) return NextResponse.json({ error: 'Prompt too long' }, { status: 400 });

  const width  = Math.min(Math.max(Number(body.width)  || 768, 64), 1280);
  const height = Math.min(Math.max(Number(body.height) || 512, 64), 1280);
  const seed   = Number.isFinite(Number(body.seed)) ? Number(body.seed) : Math.floor(Math.random() * 100000);

  // Identical URL to what the client warmed → instant Cloudflare cache hit.
  const url = pollinationsUrl(prompt, { width, height, seed });

  // Per-attempt timeout so one slow request can't eat the whole budget; one retry.
  const PER_ATTEMPT_MS = 12_000;
  const BACKOFF = [1200];

  const attemptFetch = async (): Promise<Response> => {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), PER_ATTEMPT_MS);
    try { return await fetch(url, { signal: ac.signal }); }
    finally { clearTimeout(t); }
  };

  let r: Response | null = null;
  let timedOut = false;
  for (let attempt = 0; attempt <= BACKOFF.length; attempt++) {
    try {
      r = await attemptFetch();
    } catch {
      r = null; timedOut = true; // this attempt timed out / network error
    }
    if (r && r.ok) break;
    const retryable = !r || r.status === 429 || r.status >= 500;
    if (!retryable || attempt === BACKOFF.length) break;
    await new Promise((res) => setTimeout(res, BACKOFF[attempt]));
  }

  if (!r || !r.ok) {
    if (!r) {
      return NextResponse.json(
        { error: timedOut ? 'Image generation is taking too long. Please try again.' : 'Image generation failed.' },
        { status: 504 },
      );
    }
    const status = r.status === 429 ? 429 : 502;
    return NextResponse.json(
      { error: status === 429 ? 'Image service is busy. Try again in a few seconds.' : `Image service error (${r.status})` },
      { status },
    );
  }

  try {
    const buf = Buffer.from(await r.arrayBuffer());
    const contentType = r.headers.get('content-type') || 'image/jpeg';
    // base64 data URI — embeds permanently in documents and .pptx (no CORS issues).
    return NextResponse.json({ dataUri: `data:${contentType};base64,${buf.toString('base64')}`, seed });
  } catch {
    return NextResponse.json({ error: 'Image generation failed' }, { status: 502 });
  }
}
