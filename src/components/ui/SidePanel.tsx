'use client';
import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidePanelProps {
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Gradient-chip icon, e.g. <Terminal className="h-3.5 w-3.5 text-white" />. */
  icon?: ReactNode;
  width?: number;
  side?: 'left' | 'right';
  /** Extra controls rendered left of the close button. */
  headerExtra?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * The shared editor side-panel shell: spring slide-in/out, glass surface,
 * gradient edge-light, gradient-chip header, and a premium-scroll body.
 * Manages its own exit animation, then calls onClose once it finishes.
 * Adopt this in AIPanel / CommentsPanel / VersionPanel / etc. for one
 * consistent panel feel across the editor.
 */
export function SidePanel({
  onClose, title, subtitle, icon, width = 420, side = 'right', headerExtra, children, className,
}: SidePanelProps) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(true);
  const off = side === 'right' ? width : -width;

  return (
    <AnimatePresence onExitComplete={onClose}>
      {open && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { x: off, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { x: off, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          style={{ width }}
          className={cn(
            'fixed top-0 bottom-0 z-30 flex flex-col bg-[#0E0E10]/95 shadow-elev-4 backdrop-blur-xl',
            side === 'right' ? 'right-0 border-l border-line' : 'left-0 border-r border-line',
            className,
          )}
        >
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-accent/40 to-transparent',
              side === 'right' ? 'left-0' : 'right-0',
            )}
          />

          <div className="flex flex-shrink-0 items-center justify-between border-b border-line px-5 py-4">
            <div className="flex min-w-0 items-center gap-2.5">
              {icon && (
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-accent-grad shadow-glow-accent-sm">
                  {icon}
                </div>
              )}
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold leading-tight tracking-tight text-white">{title}</span>
                {subtitle && <span className="mt-0.5 text-[10px] leading-none text-txt-muted">{subtitle}</span>}
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              {headerExtra}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-lg p-2 text-txt-muted transition-all duration-200 hover:rotate-90 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="premium-scroll min-h-0 flex-1 overflow-y-auto">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
