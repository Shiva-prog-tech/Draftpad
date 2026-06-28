'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { springSoft } from '@/lib/motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Tailwind width class, e.g. "max-w-lg". Defaults to max-w-lg. */
  className?: string;
  showClose?: boolean;
}

/**
 * Accessible modal: Radix Dialog (focus trap, ESC, aria) + framer-motion
 * (scale/fade entrance, blurred backdrop). Animates out on close via
 * AnimatePresence + forceMount.
 */
export function Modal({ open, onClose, title, description, children, className, showClose = true }: ModalProps) {
  const reduce = useReducedMotion();

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild forceMount>
              <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
                transition={springSoft}
                className={cn(
                  'pointer-events-auto w-full',
                  'overflow-hidden rounded-2xl border border-line bg-surface-grad shadow-elev-4',
                  'focus:outline-none max-h-[85vh] flex flex-col',
                  className ?? 'max-w-lg',
                )}
              >
                {/* a11y title is always required by Radix; hide visually when none given */}
                {!title && <Dialog.Title className="sr-only">Dialog</Dialog.Title>}

                {(title || showClose) && (
                  <div className="flex flex-shrink-0 items-start justify-between border-b border-line px-6 py-4">
                    <div>
                      {title && <Dialog.Title className="font-semibold text-white">{title}</Dialog.Title>}
                      {description && (
                        <Dialog.Description className="mt-0.5 text-xs text-txt-muted">{description}</Dialog.Description>
                      )}
                    </div>
                    {showClose && (
                      <Dialog.Close
                        aria-label="Close"
                        className="-mr-1.5 rounded-lg p-1.5 text-txt-muted transition-all duration-200 hover:rotate-90 hover:bg-white/[0.06] hover:text-white"
                      >
                        <X className="h-5 w-5" />
                      </Dialog.Close>
                    )}
                  </div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto premium-scroll">{children}</div>
              </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
