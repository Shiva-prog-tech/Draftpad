'use client';
import {
  useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { Button } from '@/components/ui';
import type { Placement, TourStep } from './types';

interface Rect { top: number; left: number; width: number; height: number; }
interface Size { w: number; h: number; }
type Side = 'top' | 'bottom' | 'left' | 'right' | 'center';

interface GuidedTourProps {
  steps: TourStep[];
  /** A short label for the whole tour, e.g. "Editor tour". */
  label: string;
  run: boolean;
  /** Called on skip, finish, or Esc. */
  onClose: () => void;
}

const GAP = 16;       // distance between spotlight and popover
const MARGIN = 16;    // min distance from the viewport edge
const POP_W = 360;    // spotlight popover width
const POP_W_HERO = 440; // centered hero/outro card width

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// Avoid React's "useLayoutEffect does nothing on the server" warning.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function pickSide(rect: Rect, pop: Size, vw: number, vh: number, pref?: Placement): Side {
  if (pref && pref !== 'auto') return pref;
  if (rect.top + rect.height + GAP + pop.h + MARGIN <= vh) return 'bottom';
  if (rect.top - GAP - pop.h - MARGIN >= 0) return 'top';
  if (rect.left + rect.width + GAP + pop.w + MARGIN <= vw) return 'right';
  if (rect.left - GAP - pop.w - MARGIN >= 0) return 'left';
  // Whichever vertical band has more room.
  return vh - rect.top - rect.height > rect.top ? 'bottom' : 'top';
}

function coordsFor(rect: Rect, pop: Size, vw: number, vh: number, side: Side) {
  let top = 0, left = 0;
  switch (side) {
    case 'bottom': top = rect.top + rect.height + GAP; left = rect.left + rect.width / 2 - pop.w / 2; break;
    case 'top':    top = rect.top - GAP - pop.h;        left = rect.left + rect.width / 2 - pop.w / 2; break;
    case 'right':  left = rect.left + rect.width + GAP;  top = rect.top + rect.height / 2 - pop.h / 2; break;
    case 'left':   left = rect.left - GAP - pop.w;       top = rect.top + rect.height / 2 - pop.h / 2; break;
    default:       top = vh / 2 - pop.h / 2;             left = vw / 2 - pop.w / 2;
  }
  return {
    top: clamp(top, MARGIN, vh - pop.h - MARGIN),
    left: clamp(left, MARGIN, vw - pop.w - MARGIN),
  };
}

export function GuidedTour({ steps, label, run, onClose }: GuidedTourProps) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<TourStep[]>([]);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; side: Side } | null>(null);

  const rectRef = useRef<Rect | null>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const step = active[index];
  const total = active.length;
  const isHero = !step?.target; // centered hero/outro
  const popW = isHero ? POP_W_HERO : POP_W;

  // Resolve the runnable steps when the tour starts (drop optional steps whose
  // targets are absent — e.g. a sidebar hidden on mobile).
  useEffect(() => {
    if (!run) return;
    const resolved = steps.filter(
      (s) => !s.target || !s.optional || !!document.querySelector(`[data-tour="${s.target}"]`),
    );
    setActive(resolved);
    setIndex(0);
    setRect(null);
    rectRef.current = null;
  }, [run, steps]);

  // Bring the current target into view when the step changes.
  useEffect(() => {
    if (!run || !step?.target) return;
    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' });
  }, [run, step?.target]);

  // Follow the target every frame so the spotlight stays glued through scroll,
  // layout shifts and panel transitions. Only re-renders when the rect moves.
  useEffect(() => {
    if (!run) return;
    if (!step?.target) { rectRef.current = null; setRect(null); return; }
    let raf = 0;
    const loop = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        const next: Rect = { top: r.top, left: r.left, width: r.width, height: r.height };
        const p = rectRef.current;
        if (!p || Math.abs(p.top - next.top) > 0.5 || Math.abs(p.left - next.left) > 0.5 ||
            Math.abs(p.width - next.width) > 0.5 || Math.abs(p.height - next.height) > 0.5) {
          rectRef.current = next;
          setRect(next);
        }
      } else if (rectRef.current) {
        rectRef.current = null;
        setRect(null);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [run, step?.target]);

  // Position the popover relative to the (possibly moving) spotlight.
  const recompute = useCallback(() => {
    const el = popRef.current;
    if (!el) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const size: Size = { w: el.offsetWidth, h: el.offsetHeight };
    if (!rect) { setPos({ top: vh / 2 - size.h / 2, left: vw / 2 - size.w / 2, side: 'center' }); return; }
    const side = pickSide(rect, size, vw, vh, step?.placement);
    setPos({ ...coordsFor(rect, size, vw, vh, side), side });
  }, [rect, step?.placement]);

  // Reposition whenever the tour opens, the step changes, or the spotlight
  // moves. `run`/`step` are essential: on the first (centered) step neither
  // `recompute` nor `index` changes once the popover mounts, so without them
  // the popover would never get a position and stay invisible.
  useIsoLayoutEffect(() => { recompute(); }, [recompute, run, index, rect, step]);
  useEffect(() => {
    if (!run) return;
    const on = () => recompute();
    window.addEventListener('resize', on);
    window.addEventListener('scroll', on, true);
    return () => { window.removeEventListener('resize', on); window.removeEventListener('scroll', on, true); };
  }, [run, recompute]);

  const goNext = useCallback(() => {
    setIndex((i) => (i < total - 1 ? i + 1 : i));
    if (index >= total - 1) onClose();
  }, [index, total, onClose]);
  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  // Keyboard: ← back · →/Enter next · Esc skip. Capture so it wins over the app.
  useEffect(() => {
    if (!run) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); goNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); goPrev(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [run, goNext, goPrev, onClose]);

  const padded = useMemo<Rect | null>(() => {
    if (!rect) return null;
    const p = step?.pad ?? 8;
    return { top: rect.top - p, left: rect.left - p, width: rect.width + p * 2, height: rect.height + p * 2 };
  }, [rect, step?.pad]);

  if (!mounted || !run || total === 0 || !step) return null;

  const isLast = index === total - 1;
  const progress = ((index + 1) / total) * 100;

  return createPortal(
    <div className="fixed inset-0" style={{ zIndex: 2147483000 }} aria-live="polite" role="dialog" aria-modal="true" aria-label={label}>
      {/* Dimmer + spotlight. Centered hero steps get a plain blurred backdrop. */}
      {padded ? (
        <motion.div
          aria-hidden
          className="pointer-events-auto absolute rounded-2xl"
          // The huge spread shadow dims everything *except* the cutout.
          style={{ boxShadow: '0 0 0 9999px rgba(7,7,10,0.74), 0 0 0 1px rgba(99,102,241,0.55), 0 0 30px 4px rgba(99,102,241,0.40)' }}
          initial={false}
          animate={{ top: padded.top, left: padded.left, width: padded.width, height: padded.height }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 280, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          {!reduce && (
            <span
              aria-hidden
              className="absolute -inset-px rounded-2xl border border-accent/60"
              style={{ animation: 'tourRingPulse 2.1s cubic-bezier(0.4,0,0.2,1) infinite' }}
            />
          )}
        </motion.div>
      ) : (
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-[rgba(7,7,10,0.74)] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Popover */}
      <motion.div
        ref={popRef}
        key={index}
        className="pointer-events-auto absolute flex flex-col overflow-hidden rounded-2xl border border-line bg-surface-grad shadow-elev-4"
        style={{
          top: pos?.top ?? -9999,
          left: pos?.left ?? -9999,
          width: popW,
          visibility: pos ? 'visible' : 'hidden',
        }}
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={reduce ? { duration: 0.15 } : { type: 'spring', stiffness: 320, damping: 28 }}
      >
        {/* gradient edge-light */}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />

        {/* progress rail */}
        <div className="h-0.5 w-full bg-white/[0.05]">
          <motion.div
            className="h-full rounded-r-full bg-accent-grad"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 200, damping: 28 }}
          />
        </div>

        <div className={isHero ? 'p-6' : 'p-5'}>
          {/* header row */}
          <div className="mb-3 flex items-start gap-3">
            {step.icon && (
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent-grad shadow-glow-accent-sm">
                {step.icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {step.eyebrow && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-accent/90">{step.eyebrow}</p>
              )}
              <h3 className={`font-semibold tracking-tight text-white ${isHero ? 'text-lg' : 'text-[15px]'}`}>
                {step.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Close tour"
              className="-mr-1 -mt-1 flex-shrink-0 rounded-lg p-1.5 text-txt-muted transition-all duration-200 hover:rotate-90 hover:bg-white/[0.06] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-[13px] leading-relaxed text-txt-secondary">{step.body}</p>

          {step.kbd && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-line bg-white/[0.03] px-2.5 py-1">
              <span className="text-[10px] text-txt-muted">Shortcut</span>
              <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-white">{step.kbd}</kbd>
            </div>
          )}

          {/* footer */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] tabular-nums text-txt-muted">
                {String(index + 1).padStart(2, '0')}
                <span className="text-[#3F3F46]"> / {String(total).padStart(2, '0')}</span>
              </span>
              {!isLast && (
                <button onClick={onClose} className="text-[11px] text-txt-muted transition-colors hover:text-white">
                  Skip
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {index > 0 && (
                <Button variant="ghost" size="sm" onClick={goPrev}>
                  <ArrowLeft className="h-3.5 w-3.5" />Back
                </Button>
              )}
              <Button size="sm" onClick={goNext}>
                {isLast ? (<><Check className="h-3.5 w-3.5" />Finish</>)
                  : index === 0 ? (<>Start tour<ArrowRight className="h-3.5 w-3.5" /></>)
                  : (<>Next<ArrowRight className="h-3.5 w-3.5" /></>)}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
