import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { connectDB } from '@/server/db/connect';
import { DeckModel } from '@/server/db/models';

export const maxDuration = 30;

// GET /api/decks — list the current user's decks (lightweight)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await connectDB();
  const decks = await DeckModel.find({ createdBy: session.user.id, status: 'active' })
    .sort({ updatedAt: -1 })
    .select('title updatedAt slides.id') // only slide ids — avoids pulling base64 images
    .limit(50)
    .lean();
  const list = decks.map((d: any) => ({
    _id: String(d._id),
    title: d.title,
    slideCount: Array.isArray(d.slides) ? d.slides.length : 0,
    updatedAt: d.updatedAt,
  }));
  return NextResponse.json({ decks: list });
}

// POST /api/decks — create a deck
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 200) : 'Untitled Deck';
  const subtitle = typeof body.subtitle === 'string' ? body.subtitle.slice(0, 300) : '';
  const slides = Array.isArray(body.slides) ? body.slides.slice(0, 60).map(normalizeSlide) : [];

  await connectDB();
  const deck = await DeckModel.create({ title, subtitle, slides, createdBy: session.user.id });
  return NextResponse.json(deck);
}

function normalizeSlide(s: any, i: number) {
  return {
    id: typeof s?.id === 'string' && s.id ? s.id : `s-${i}-${Math.random().toString(36).slice(2, 9)}`,
    title: String(s?.title ?? '').slice(0, 300),
    bullets: Array.isArray(s?.bullets) ? s.bullets.map((b: unknown) => String(b).slice(0, 500)).slice(0, 12) : [],
    notes: String(s?.notes ?? '').slice(0, 2000),
    image: typeof s?.image === 'string' ? s.image : '',
  };
}
