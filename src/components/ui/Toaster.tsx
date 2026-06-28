'use client';
import * as Toast from '@radix-ui/react-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore, type ToastType } from '@/lib/toast';
import { spring } from '@/lib/motion';

const ICON: Record<ToastType, typeof Info> = { success: CheckCircle2, error: AlertCircle, info: Info };
const COLOR: Record<ToastType, string> = {
  success: 'text-emerald-400',
  error:   'text-red-400',
  info:    'text-accent',
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <Toast.Provider swipeDirection="right" duration={4000}>
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICON[t.type];
          return (
            <Toast.Root
              key={t.id}
              asChild
              forceMount
              onOpenChange={(open) => { if (!open) dismiss(t.id); }}
            >
              <motion.li
                layout
                initial={{ opacity: 0, x: 40, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40, scale: 0.9 }}
                transition={spring}
                className="flex w-[340px] items-start gap-3 rounded-xl border border-line bg-surface-grad px-4 py-3 shadow-elev-3 backdrop-blur-xl"
              >
                <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${COLOR[t.type]}`} />
                <div className="min-w-0 flex-1">
                  <Toast.Title className="text-sm font-medium text-white">{t.title}</Toast.Title>
                  {t.description && (
                    <Toast.Description className="mt-0.5 text-xs leading-relaxed text-txt-muted">
                      {t.description}
                    </Toast.Description>
                  )}
                </div>
                <Toast.Close aria-label="Dismiss" className="text-txt-muted transition-colors hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </Toast.Close>
              </motion.li>
            </Toast.Root>
          );
        })}
      </AnimatePresence>
      <Toast.Viewport className="fixed bottom-0 right-0 z-[100] m-0 flex w-auto list-none flex-col gap-2 p-6 outline-none" />
    </Toast.Provider>
  );
}
