'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Reorder, useDragControls } from 'framer-motion';
import {
  ArrowLeft, GripVertical, Sparkles, Image as ImageIcon, Copy, Trash2, Plus,
  Play, Download, Loader2, Check, X,
} from 'lucide-react';
import type { Deck, Slide } from '@/lib/deck';
import { generateImageDataUri } from '@/lib/ai-image';
import { exportDeckToPptx } from '@/lib/pptx';
import { Button } from '@/components/ui';
import { toast } from '@/lib/toast';

type SavedDeck = Deck & { _id: string };

const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

function withIds(deck: SavedDeck): SavedDeck {
  return { ...deck, slides: deck.slides.map((s) => ({ ...s, id: s.id || uid() })) };
}

// Lenient single-slide JSON parse (handles fences / stray prose).
function parseSlideJson(text: string): Partial<Slide> | null {
  let raw = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  if (!raw.startsWith('{')) {
    const a = raw.indexOf('{'), b = raw.lastIndexOf('}');
    if (a === -1 || b === -1) return null;
    raw = raw.slice(a, b + 1);
  }
  try { return JSON.parse(raw); } catch { return null; }
}

const cleanForOutput = (deck: SavedDeck): Deck => ({
  ...deck,
  slides: deck.slides.map((s) => ({ ...s, bullets: s.bullets.map((b) => b.trim()).filter(Boolean) })),
});

export function DeckEditor({ initialDeck }: { initialDeck: SavedDeck }) {
  const router = useRouter();
  const [deck, setDeck] = useState<SavedDeck>(() => withIds(initialDeck));
  const [save, setSave] = useState<'idle' | 'saving' | 'saved'>('saved');
  const [busy, setBusy] = useState<Record<string, 'ai' | 'img' | undefined>>({});
  const [exporting, setExporting] = useState(false);
  const firstRender = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced autosave
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    setSave('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/decks/${deck._id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: deck.title, subtitle: deck.subtitle, slides: deck.slides }),
        });
        setSave(res.ok ? 'saved' : 'idle');
        if (!res.ok) toast.error('Autosave failed');
      } catch { setSave('idle'); toast.error('Autosave failed'); }
    }, 800);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [deck]);

  const patchSlide = (id: string, patch: Partial<Slide>) =>
    setDeck((d) => ({ ...d, slides: d.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));

  const addSlide = () =>
    setDeck((d) => ({ ...d, slides: [...d.slides, { id: uid(), title: 'New slide', bullets: ['Point one'], notes: '' }] }));

  const duplicateSlide = (id: string) =>
    setDeck((d) => {
      const i = d.slides.findIndex((s) => s.id === id);
      if (i === -1) return d;
      const slides = [...d.slides];
      slides.splice(i + 1, 0, { ...d.slides[i], id: uid() });
      return { ...d, slides };
    });

  const deleteSlide = (id: string) =>
    setDeck((d) => ({ ...d, slides: d.slides.filter((s) => s.id !== id) }));

  const rewriteSlide = async (id: string) => {
    const slide = deck.slides.find((s) => s.id === id);
    if (!slide || busy[id]) return;
    setBusy((b) => ({ ...b, [id]: 'ai' }));
    try {
      const res = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'slide', prompt: `Slide topic: "${slide.title || 'this slide'}" in a presentation titled "${deck.title}". Make it sharper and more compelling.` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const parsed = parseSlideJson(String(data.result || ''));
      if (!parsed) throw new Error('parse');
      patchSlide(id, {
        title: typeof parsed.title === 'string' && parsed.title ? parsed.title : slide.title,
        bullets: Array.isArray(parsed.bullets) ? parsed.bullets.map(String) : slide.bullets,
        notes: typeof parsed.notes === 'string' ? parsed.notes : slide.notes,
      });
    } catch { toast.error('Could not rewrite slide'); }
    finally { setBusy((b) => ({ ...b, [id]: undefined })); }
  };

  const imageSlide = async (id: string) => {
    const slide = deck.slides.find((s) => s.id === id);
    if (!slide || busy[id]) return;
    setBusy((b) => ({ ...b, [id]: 'img' }));
    try {
      const dataUri = await generateImageDataUri(`${deck.title} — ${slide.title}`, { width: 768, height: 480 });
      patchSlide(id, { image: dataUri });
    } catch { toast.error('Could not generate image'); }
    finally { setBusy((b) => ({ ...b, [id]: undefined })); }
  };

  const present = () => {
    sessionStorage.setItem('draftpad:deck', JSON.stringify(cleanForOutput(deck)));
    router.push('/present');
  };

  const exportPptx = async () => {
    setExporting(true);
    try {
      await exportDeckToPptx(cleanForOutput(deck));
      toast.success('Downloaded .pptx', 'Opens in PowerPoint, Google Slides or Keynote.');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex flex-shrink-0 items-center gap-3 border-b border-line bg-[#0E0E10]/80 px-4 py-3 backdrop-blur-xl">
        <button onClick={() => router.push('/dashboard')} className="text-txt-muted transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <input
          value={deck.title}
          onChange={(e) => setDeck((d) => ({ ...d, title: e.target.value }))}
          className="min-w-0 flex-1 truncate bg-transparent text-sm font-semibold text-white placeholder-txt-muted focus:outline-none"
          placeholder="Deck title"
        />
        <span className="flex items-center gap-1 text-[11px] text-txt-muted">
          {save === 'saving' ? <><Loader2 className="h-3 w-3 animate-spin" />Saving…</>
            : save === 'saved' ? <><Check className="h-3 w-3 text-emerald-400" />Saved</> : null}
        </span>
        <Button variant="secondary" size="sm" onClick={present}><Play className="h-3.5 w-3.5" />Present</Button>
        <Button size="sm" onClick={exportPptx} loading={exporting} disabled={exporting}>
          {!exporting && <Download className="h-3.5 w-3.5" />}Export .pptx
        </Button>
      </header>

      {/* Editor body */}
      <div className="premium-scroll flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl p-6">
          <input
            value={deck.subtitle ?? ''}
            onChange={(e) => setDeck((d) => ({ ...d, subtitle: e.target.value }))}
            placeholder="Subtitle (optional)"
            className="mb-6 w-full bg-transparent text-sm text-txt-secondary placeholder-txt-muted focus:outline-none"
          />

          <Reorder.Group axis="y" values={deck.slides} onReorder={(next) => setDeck((d) => ({ ...d, slides: next as Slide[] }))} className="space-y-3">
            {deck.slides.map((slide, i) => (
              <SlideCard
                key={slide.id}
                slide={slide}
                index={i}
                busy={busy[slide.id!]}
                onChange={(patch) => patchSlide(slide.id!, patch)}
                onRewrite={() => rewriteSlide(slide.id!)}
                onImage={() => imageSlide(slide.id!)}
                onDuplicate={() => duplicateSlide(slide.id!)}
                onDelete={() => deleteSlide(slide.id!)}
              />
            ))}
          </Reorder.Group>

          <button onClick={addSlide}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-3 text-xs font-medium text-txt-secondary transition-colors hover:border-line-strong hover:text-white">
            <Plus className="h-4 w-4" />Add slide
          </button>
        </div>
      </div>
    </div>
  );
}

interface SlideCardProps {
  slide: Slide;
  index: number;
  busy?: 'ai' | 'img';
  onChange: (patch: Partial<Slide>) => void;
  onRewrite: () => void;
  onImage: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

function SlideCard({ slide, index, busy, onChange, onRewrite, onImage, onDuplicate, onDelete }: SlideCardProps) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={slide} dragListener={false} dragControls={controls}
      className="rounded-2xl border border-line bg-surface-grad shadow-elev-2">
      <div className="flex gap-2 p-3">
        <button onPointerDown={(e) => controls.start(e)} aria-label="Drag to reorder"
          className="mt-1 cursor-grab text-[#3F3F46] transition-colors hover:text-txt-secondary active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-accent-grad-soft text-[10px] font-semibold text-accent">{index + 1}</span>
            <input
              value={slide.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Slide title"
              className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-white placeholder-txt-muted focus:outline-none"
            />
          </div>

          {slide.image && (
            <div className="relative mb-2 overflow-hidden rounded-lg border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={slide.image} alt="" className="h-24 w-full object-cover" />
              <button onClick={() => onChange({ image: '' })} title="Remove image"
                className="absolute right-1.5 top-1.5 rounded-md bg-black/50 p-1 text-white backdrop-blur transition-colors hover:text-red-400">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          <textarea
            value={slide.bullets.join('\n')}
            onChange={(e) => onChange({ bullets: e.target.value.split('\n') })}
            rows={Math.min(8, Math.max(2, slide.bullets.length))}
            placeholder="One bullet per line…"
            className="premium-scroll w-full resize-none rounded-lg border border-line bg-white/[0.02] px-3 py-2 text-xs leading-relaxed text-txt-secondary placeholder-[#3F3F46] focus:border-accent focus:outline-none"
          />

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <SlideAction onClick={onRewrite} disabled={!!busy} active={busy === 'ai'} icon={<Sparkles className="h-3 w-3" />} label="Rewrite" />
            <SlideAction onClick={onImage} disabled={!!busy} active={busy === 'img'} icon={<ImageIcon className="h-3 w-3" />} label={slide.image ? 'Regenerate' : 'Image'} />
            <SlideAction onClick={onDuplicate} disabled={!!busy} icon={<Copy className="h-3 w-3" />} label="Duplicate" />
            <button onClick={onDelete} disabled={!!busy}
              className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-txt-muted transition-colors hover:text-red-400 disabled:opacity-50">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </Reorder.Item>
  );
}

function SlideAction({ onClick, disabled, active, icon, label }: {
  onClick: () => void; disabled?: boolean; active?: boolean; icon: React.ReactNode; label: string;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex items-center gap-1 rounded-md border border-line bg-white/[0.02] px-2 py-1 text-[11px] text-txt-secondary transition-colors hover:border-line-strong hover:text-white disabled:opacity-50">
      {active ? <Loader2 className="h-3 w-3 animate-spin" /> : icon}{label}
    </button>
  );
}
