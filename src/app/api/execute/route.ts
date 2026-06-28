import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';

export const maxDuration = 30;

// Support both CE and Extra CE — set JUDGE0_HOST in env to override
const HOST    = process.env.JUDGE0_HOST ?? 'judge0-ce.p.rapidapi.com';
const BASE    = `https://${HOST}`;

const LANG_MAP: Record<string, number> = {
  javascript: 63,
  typescript: 74,
  python:     71,
  bash:       46,
};

function rapidHeaders(apiKey: string) {
  return {
    'Content-Type':    'application/json',
    'X-RapidAPI-Key':  apiKey,
    'X-RapidAPI-Host': HOST,
  };
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.JUDGE0_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'JUDGE0_API_KEY not configured' }, { status: 503 });

  const body = await req.json().catch(() => ({}));
  const { language, code } = body;

  const langId = LANG_MAP[language as string];
  if (typeof language !== 'string' || !langId) {
    return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
  }
  if (typeof code !== 'string' || !code.trim()) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }
  if (code.length > 10_000) {
    return NextResponse.json({ error: 'Code too long (max 10 000 chars)' }, { status: 400 });
  }

  try {
    // Step 1: submit (base64_encoded=false, wait=false → returns token immediately)
    const submitRes = await fetch(`${BASE}/submissions?base64_encoded=false`, {
      method:  'POST',
      headers: rapidHeaders(apiKey),
      body: JSON.stringify({ language_id: langId, source_code: code, stdin: '' }),
    });

    if (!submitRes.ok) {
      const text = await submitRes.text().catch(() => '');
      console.error(`[execute] submit ${submitRes.status}:`, text);
      if (submitRes.status === 401 || submitRes.status === 403) {
        return NextResponse.json({ error: 'Invalid JUDGE0_API_KEY — check your RapidAPI subscription.' }, { status: 503 });
      }
      return NextResponse.json({ error: `Judge0 submit error (${submitRes.status}): ${text}` }, { status: 502 });
    }

    const { token } = await submitRes.json();
    if (!token) return NextResponse.json({ error: 'Judge0 did not return a token' }, { status: 502 });

    // Step 2: poll until status.id >= 3 (1 = In Queue, 2 = Processing, 3+ = done)
    const FIELDS = 'stdout,stderr,compile_output,status';
    const deadline = Date.now() + 20_000;

    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 1000));

      const pollRes = await fetch(`${BASE}/submissions/${token}?base64_encoded=false&fields=${FIELDS}`, {
        headers: rapidHeaders(apiKey),
      });

      if (!pollRes.ok) {
        const text = await pollRes.text().catch(() => '');
        console.error(`[execute] poll ${pollRes.status}:`, text);
        return NextResponse.json({ error: `Judge0 poll error (${pollRes.status})` }, { status: 502 });
      }

      const data = await pollRes.json();
      const statusId: number = data.status?.id ?? 0;

      if (statusId <= 2) continue; // still queued / running

      const exitCode = statusId === 3 ? 0 : 1;
      const stderr   = [data.stderr, data.compile_output].filter(Boolean).join('\n').trim();

      return NextResponse.json({ stdout: data.stdout ?? '', stderr, exitCode });
    }

    return NextResponse.json({ error: 'Execution timed out (>20 s)' }, { status: 504 });

  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error('[execute]', e?.message);
    return NextResponse.json({ error: `Code execution failed: ${e?.message}` }, { status: 502 });
  }
}
