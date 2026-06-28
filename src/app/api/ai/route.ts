import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { AIRequestSchema } from '@/server/validators';
import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';

// Extend serverless function timeout so Groq has time to respond
export const maxDuration = 30;

const systemPrompts: Record<string, string> = {
  improve:  'You are a professional writing assistant. Improve the clarity, flow, and impact of the provided text. Return only the improved text, no explanations.',
  summarize:'You are a summarization expert. Provide a concise, accurate summary of the provided text. Return only the summary.',
  grammar:  'You are a grammar and style editor. Fix all grammar, spelling, and punctuation errors. Return only the corrected text.',
  shorten:  'You are a concise writing expert. Make the text significantly shorter while preserving all key information. Return only the shortened text.',
  formal:   'You are a professional business writing expert. Rewrite the text in a formal, polished, professional tone. Return only the rewritten text.',
  continue: 'You are a creative writing assistant. Continue writing naturally from where the text ends. Match the existing tone and voice. Return only the continuation.',
  custom:   "You are a helpful writing assistant. Follow the user's instructions precisely.",
  review:   `You are a professional document reviewer. Analyze the document and return a review in EXACTLY this format:

SCORE: [number 1-10]
SUMMARY: [one concise paragraph]
STRENGTHS:
- [strength]
- [strength]
ISSUES:
- [issue]
- [issue]
SUGGESTIONS:
- [suggestion]
- [suggestion]
- [suggestion]

Be specific and constructive. Use only this format — no extra text.`,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = AIRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { prompt, context, action } = parsed.data;

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });

  // Hard cap context to ~1 500 input tokens to stay within Groq free-tier TPM limits.
  // Groq free tier: 6 000 tokens/min. Capping at 6 000 chars (≈1 500 tokens) leaves
  // headroom for the system prompt and output tokens.
  const safeContext = context ? context.slice(0, 6000) : undefined;
  const userMessage  = safeContext
    ? `Text to work on:\n${safeContext}\n\nInstruction: ${prompt}`
    : prompt;

  // Abort if Groq takes too long (avoids 15s+ hangs on rate-limited requests)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);

  try {
    const groq = createGroq({ apiKey: groqApiKey });

    const { text } = await generateText({
      model:       groq('llama-3.1-8b-instant'),
      system:      systemPrompts[action] ?? systemPrompts.custom,
      prompt:      userMessage,
      // Keep total tokens per request well under the 6 000 TPM limit
      maxTokens:   action === 'review' ? 1200 : 900,
      temperature: action === 'review' ? 0.4  : 0.7,
      abortSignal: controller.signal,
    });

    return NextResponse.json({ result: text });
  } catch (err: unknown) {
    const e = err as { status?: number; statusCode?: number; name?: string; message?: string };
    const status  = e?.status ?? e?.statusCode ?? 0;
    const message = e?.message ?? '';
    console.error('[ai] error:', { action, status, message: message.slice(0, 200) });

    if (e?.name === 'AbortError') {
      return NextResponse.json(
        { error: 'AI request timed out. Try with a shorter document or wait a moment.' },
        { status: 504 }
      );
    }
    if (status === 429) {
      return NextResponse.json(
        { error: 'AI rate limit reached. Please wait 10–15 seconds and try again.' },
        { status: 429 }
      );
    }
    if (status === 401 || status === 403) {
      return NextResponse.json({ error: 'AI service configuration error.' }, { status: 503 });
    }

    return NextResponse.json(
      { error: 'AI request failed. Please try again.' },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
