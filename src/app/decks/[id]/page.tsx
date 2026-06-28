import { redirect, notFound } from 'next/navigation';
import { auth } from '@/server/auth';
import { connectDB } from '@/server/db/connect';
import { DeckModel } from '@/server/db/models';
import { DeckEditor } from '@/components/DeckEditor';

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;
  await connectDB();
  const deck = await DeckModel.findOne({ _id: id, status: 'active' }).lean() as any;
  if (!deck) notFound();
  if (deck.createdBy.toString() !== session.user.id) redirect('/dashboard');

  const serialized = JSON.parse(JSON.stringify({
    _id: String(deck._id),
    title: deck.title,
    subtitle: deck.subtitle ?? '',
    slides: (deck.slides ?? []).map((s: any) => ({
      id: s.id, title: s.title ?? '', bullets: s.bullets ?? [], notes: s.notes ?? '', image: s.image ?? '',
    })),
  }));

  return <DeckEditor initialDeck={serialized} />;
}
