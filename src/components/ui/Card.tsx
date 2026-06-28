'use client';
import { forwardRef, type ReactNode } from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLMotionProps<'div'> {
  /** Hover lift + elevation/border response. Use for clickable cards. */
  interactive?: boolean;
  /** Soft accent gradient glow that fades in on hover. */
  glow?: boolean;
  children?: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive = false, glow = false, className, children, ...props },
  ref,
) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      whileHover={interactive && !reduce ? { y: -4 } : undefined}
      className={cn(
        'group/card relative rounded-2xl border border-line bg-surface-grad shadow-elev-2',
        interactive &&
          'cursor-pointer transition-[box-shadow,border-color] duration-300 hover:border-line-strong hover:shadow-elev-3',
        className,
      )}
      {...props}
    >
      {glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-accent/[0.12] via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
        />
      )}
      {children}
    </motion.div>
  );
});
