import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { connectDB } from '@/server/db/connect';
import { DeckModel } from '@/server/db/models';

export const maxDuration = 30;

async function getOwnedDeck(id: string, userId: string) {
  await connectDB();
  const deck = await DeckModel.findOne({ _id: id, status: 'active' });
  if (!deck) return { deck: null, status: 404, error: 'Not found' };
  if (deck.createdBy.toString() !== userId) return { deck: null, status: 403, error: 'Forbidden' };
  return { deck, status: 200, error: null };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { deck, status, error } = await getOwnedDeck(id, session.user.id);
  if (error) return NextResponse.json({ error }, { status });
  return NextResponse.json(deck);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { deck, status, error } = await getOwnedDeck(id, session.user.id);
  if (error) return NextResponse.json({ error }, { status });

  const body = await req.json().catch(() => ({}));
  if (typeof body.title === 'string') deck!.title = body.title.trim().slice(0, 200) || 'Untitled Deck';
  if (typeof body.subtitle === 'string') deck!.subtitle = body.subtitle.slice(0, 300);
  if (Array.isArray(body.slides)) {
    deck!.slides = body.slides.slice(0, 60).map((s: any, i: number) => ({
      id: typeof s?.id === 'string' && s.id ? s.id : `s-${i}-${Math.random().toString(36).slice(2, 9)}`,
      title: String(s?.title ?? '').slice(0, 300),
      bullets: Array.isArray(s?.bullets) ? s.bullets.map((b: unknown) => String(b).slice(0, 500)).slice(0, 12) : [],
      notes: String(s?.notes ?? '').slice(0, 2000),
      image: typeof s?.image === 'string' ? s.image : '',
    }));
  }
  await deck!.save();
  return NextResponse.json({ ok: true, updatedAt: deck!.updatedAt });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { deck, status, error } = await getOwnedDeck(id, session.user.id);
  if (error) return NextResponse.json({ error }, { status });
  deck!.status = 'deleted';
  await deck!.save();
  return NextResponse.json({ ok: true });
}
