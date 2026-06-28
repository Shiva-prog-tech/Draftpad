'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Download, Loader2, Presentation } from 'lucide-react';
import type { Deck } from '@/lib/deck';
import { coverImageUrl, hashSeed } from '@/lib/cover-image';
import { exportDeckToPptx } from '@/lib/pptx';
import { toast } from '@/lib/toast';

interface Props {
  deck: Deck;
  onClose: () => void;
}

export function PresentationViewer({ deck, onClose }: Props) {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [exporting, setExporting] = useState(false);
  const total = deck.slides.length + 1; // +1 for the title slide

  const next = useCallback(() => setIdx((i) => Math.min(i + 1, total - 1)), [total]);
  const prev = useCallback(() => setIdx((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportDeckToPptx(deck);
      toast.success('Downloaded .pptx', 'Opens in PowerPoint, Google Slides or Keynote.');
    } catch {
      toast.error('Export failed', 'Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const isTitle = idx === 0;
  const slide = isTitle ? null : deck.slides[idx - 1];
  const heroSeed = hashSeed(deck.title + idx);
  const heroPrompt = isTitle ? deck.title : `${deck.title} — ${slide?.title}`;
  const heroUrl = (!isTitle && slide?.image) ? slide.image : coverImageUrl(heroPrompt, heroSeed, 900, 600);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#070708]">
      {/* Top bar */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-grad shadow-glow-accent-sm">
            <Presentation className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="max-w-[40vw] truncate text-sm font-semibold text-white">{deck.title}</span>
          <span className="text-xs text-txt-muted">{idx + 1} / {total}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-txt-secondary transition-colors hover:border-line-strong hover:text-white disabled:opacity-60">
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Export .pptx
          </button>
          <button onClick={onClose} aria-label="Close"
            className="rounded-lg p-2 text-txt-muted transition-all duration-200 hover:rotate-90 hover:bg-white/[0.06] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stage */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
        {/* nav arrows */}
        <button onClick={prev} disabled={idx === 0} aria-label="Previous"
          className="absolute left-4 z-20 rounded-full border border-line bg-black/40 p-2 text-white backdrop-blur transition-colors hover:bg-white/10 disabled:opacity-30">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={next} disabled={idx === total - 1} aria-label="Next"
          className="absolute right-4 z-20 rounded-full border border-line bg-black/40 p-2 text-white backdrop-blur transition-colors hover:bg-white/10 disabled:opacity-30">
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* slide (16:9) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-[#141417] to-[#0A0A0B] shadow-elev-4"
          >
            {/* AI hero image, faded into the dark background */}
            <img src={heroUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B] via-[#0A0A0B]/85 to-transparent" />
            <div className="absolute left-0 top-0 h-full w-1.5 bg-accent-grad" />

            <div className="relative z-10 flex h-full flex-col justify-center px-10 md:px-16">
              {isTitle ? (
                <>
                  <h1 className="text-3xl font-bold leading-tight tracking-tight text-white md:text-5xl">{deck.title}</h1>
                  {deck.subtitle && <p className="mt-4 max-w-2xl text-base text-txt-secondary md:text-lg">{deck.subtitle}</p>}
                  <p className="mt-8 text-xs uppercase tracking-widest text-txt-muted">Generated with AI · Draftpad</p>
                </>
              ) : (
                <>
                  <h2 className="mb-6 text-2xl font-semibold tracking-tight text-white md:text-4xl">{slide?.title}</h2>
                  <ul className="space-y-3">
                    {slide?.bullets.map((b, i) => (
                      <motion.li
                        key={i}
                        initial={reduce ? false : { opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.06 }}
                        className="flex items-start gap-3 text-sm text-txt-secondary md:text-lg"
                      >
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                        <span>{b}</span>
                      </motion.li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex flex-shrink-0 items-center justify-center gap-1.5 pb-5">
        {Array.from({ length: total }, (_, i) => (
          <button key={i} onClick={() => setIdx(i)} aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-6 bg-accent' : 'w-1.5 bg-white/15 hover:bg-white/30'}`} />
        ))}
      </div>
    </div>
  );
}
