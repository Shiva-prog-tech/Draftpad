'use client';
import { forwardRef, type ReactNode } from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary:   'text-white bg-accent-grad shadow-glow-accent-sm hover:shadow-glow-accent',
  secondary: 'text-txt-secondary hover:text-white bg-white/[0.03] border border-line hover:border-line-strong hover:bg-white/[0.06]',
  ghost:     'text-txt-secondary hover:text-white hover:bg-white/[0.06]',
  danger:    'text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300',
};

const SIZES: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-lg',
  md: 'text-sm px-4 py-2.5 gap-2 rounded-xl',
  lg: 'text-sm px-5 py-3 gap-2 rounded-xl',
};

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  /** Animated light sweep on hover (primary only). Defaults on. */
  sheen?: boolean;
  children?: ReactNode;
  /** Allow forwarding data-* attributes (e.g. data-tour) to the element. */
  [dataAttr: `data-${string}`]: unknown;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, sheen = true, className, children, disabled, ...props },
  ref,
) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      ref={ref}
      whileTap={reduce ? undefined : { scale: 0.97 }}
      disabled={disabled || loading}
      className={cn(
        'group/btn relative inline-flex items-center justify-center overflow-hidden font-semibold',
        'transition-shadow duration-200 disabled:opacity-60 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
      {sheen && variant === 'primary' && !reduce && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-full bg-sheen transition-transform duration-700 ease-out group-hover/btn:translate-x-full"
        />
      )}
    </motion.button>
  );
});
