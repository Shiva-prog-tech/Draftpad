'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PresentationViewer } from '@/components/PresentationViewer';
import type { Deck } from '@/lib/deck';

const DECK_KEY = 'draftpad:deck';

export default function PresentPage() {
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DECK_KEY);
      if (raw) setDeck(JSON.parse(raw) as Deck);
    } catch { /* ignore */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && !deck) router.replace('/dashboard');
  }, [ready, deck, router]);

  if (!deck) return null;
  return <PresentationViewer deck={deck} onClose={() => router.back()} />;
}
