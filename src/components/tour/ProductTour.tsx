'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { GuidedTour } from './GuidedTour';
import { TOURS } from './steps';
import type { TourSurface } from './types';

const doneKey = (s: TourSurface) => `dp_tour_done_${s}`;

interface Props {
  surface: TourSurface;
  /** Hide the floating launcher (e.g. while another overlay owns the screen). */
  hideLauncher?: boolean;
}

/**
 * Drop-in product tour for a surface. Auto-starts once for first-time visitors
 * (persisted in localStorage) and leaves a premium "Tour" launcher to replay it
 * anytime.
 */
export function ProductTour({ surface, hideLauncher }: Props) {
  const tour = TOURS[surface];
  const [run, setRun] = useState(false);
  const [completed, setCompleted] = useState(true); // assume done pre-hydration → no flash

  useEffect(() => {
    let cancelled = false;
    const done = localStorage.getItem(doneKey(surface)) === '1';
    setCompleted(done);
    if (!done) {
      const t = setTimeout(() => { if (!cancelled) setRun(true); }, 850);
      return () => { cancelled = true; clearTimeout(t); };
    }
  }, [surface]);

  const finish = useCallback(() => {
    try { localStorage.setItem(doneKey(surface), '1'); } catch { /* ignore */ }
    setCompleted(true);
    setRun(false);
  }, [surface]);

  return (
    <>
      <GuidedTour steps={tour.steps} label={tour.label} run={run} onClose={finish} />
      {!hideLauncher && (
        <TourLauncher
          surface={surface}
          pulse={!completed && !run}
          hidden={run}
          onClick={() => setRun(true)}
        />
      )}
    </>
  );
}

function TourLauncher({ surface, pulse, hidden, onClick }: {
  surface: TourSurface; pulse: boolean; hidden: boolean; onClick: () => void;
}) {
  const reduce = useReducedMotion();
  // Editor side-panels slide in from the right, so anchor the launcher left there.
  const side = surface === 'editor' ? 'left-4' : 'right-4';

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.button
          onClick={onClick}
          aria-label="Take the product tour"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          whileHover={reduce ? undefined : { y: -2 }}
          whileTap={reduce ? undefined : { scale: 0.96 }}
          className={`group fixed bottom-4 ${side} z-[80] flex items-center gap-2 rounded-full border border-line-strong bg-[#0E0E10]/80 py-2 pl-2.5 pr-3.5 text-xs font-medium text-txt-secondary shadow-elev-3 backdrop-blur-xl transition-colors hover:text-white`}
        >
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-accent-grad shadow-glow-accent-sm">
            {/* pulse halo for first-timers */}
            {pulse && !reduce && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-full bg-accent/50"
                style={{ animation: 'tourLauncherPulse 2.4s cubic-bezier(0.4,0,0.2,1) infinite' }}
              />
            )}
            <Sparkles className="relative h-3.5 w-3.5 text-white" />
          </span>
          <span className="relative">Tour</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
