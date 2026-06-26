import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { AIRequestSchema } from '@/server/validators';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = AIRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { prompt, context, action } = parsed.data;

  const systemPrompts: Record<string, string> = {
    improve: 'You are a professional writing assistant. Improve the clarity, flow, and impact of the provided text. Return only the improved text, no explanations.',
    summarize: 'You are a summarization expert. Provide a concise, accurate summary of the provided text. Return only the summary.',
    grammar: 'You are a grammar and style editor. Fix all grammar, spelling, and punctuation errors. Return only the corrected text.',
    shorten: 'You are a concise writing expert. Make the text significantly shorter while preserving all key information. Return only the shortened text.',
    custom: 'You are a helpful writing assistant. Follow the user\'s instructions precisely.',
  };

  const userMessage = context
    ? `Document context:\n${context}\n\nInstruction: ${prompt}`
    : prompt;

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompts[action] },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 2000,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Groq error:', err);
      return NextResponse.json({ error: 'AI service error' }, { status: 502 });
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '';
    return NextResponse.json({ result });
  } catch (err) {
    console.error('AI route error:', err);
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}
