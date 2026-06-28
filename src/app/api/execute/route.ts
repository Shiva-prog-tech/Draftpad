import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';

export const maxDuration = 30;

// Wandbox — free, public, no API key, no whitelist.
// Self-hosting? Set WANDBOX_URL to your own instance.
const WANDBOX = process.env.WANDBOX_URL ?? 'https://wandbox.org';

// Pick the best stable Wandbox compiler for each of our UI languages.
// The /list.json feed is newest-first, so the first match is the latest version.
const LANG_MATCH: Record<string, (c: { name: string; language: string }) => boolean> = {
  javascript: c => c.language === 'JavaScript' && c.name.startsWith('nodejs-') && !c.name.includes('head'),
  typescript: c => c.name.startsWith('typescript-'),
  python:     c => c.name.startsWith('cpython-3.') && !c.name.includes('head'),
  bash:       c => c.name === 'bash',
};

// Resolve language → compiler name once and cache (persists in a warm instance).
let compilerCache: Record<string, string> | null = null;

async function resolveCompiler(language: string): Promise<string | null> {
  if (!compilerCache) {
    const res = await fetch(`${WANDBOX}/api/list.json`);
    if (!res.ok) return null;
    const list: Array<{ name: string; language: string }> = await res.json();
    compilerCache = {};
    for (const [lang, match] of Object.entries(LANG_MATCH)) {
      const hit = list.find(match);
      if (hit) compilerCache[lang] = hit.name;
    }
  }
  return compilerCache[language] ?? null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { language, code } = body;

  if (typeof language !== 'string' || !(language in LANG_MATCH)) {
    return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
  }
  if (typeof code !== 'string' || !code.trim()) {
    return NextResponse.json({ error: 'No code provided' }, { status: 400 });
  }
  if (code.length > 10_000) {
    return NextResponse.json({ error: 'Code too long (max 10 000 chars)' }, { status: 400 });
  }

  try {
    const compiler = await resolveCompiler(language);
    if (!compiler) {
      return NextResponse.json({ error: `No runtime available for ${language}` }, { status: 502 });
    }

    // Wandbox runs synchronously and returns when execution finishes — no polling.
    const res = await fetch(`${WANDBOX}/api/compile.json`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, compiler, stdin: '' }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[execute] wandbox ${res.status}:`, text);
      if (res.status === 429) {
        return NextResponse.json({ error: 'Rate limited — wait a few seconds and try again.' }, { status: 429 });
      }
      return NextResponse.json({ error: `Code execution service error (${res.status})` }, { status: 502 });
    }

    const data = await res.json();

    // Surface compile-time errors alongside runtime stderr.
    const stderr   = [data.compiler_error, data.program_error].filter(Boolean).join('\n').trim();
    const exitCode = data.signal ? 1 : (Number.parseInt(data.status, 10) || 0);

    return NextResponse.json({ stdout: data.program_output ?? '', stderr, exitCode });

  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error('[execute]', e?.message);
    return NextResponse.json({ error: `Code execution failed: ${e?.message}` }, { status: 502 });
  }
}
