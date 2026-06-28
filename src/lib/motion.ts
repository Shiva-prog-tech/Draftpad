import type { Transition, Variants } from 'framer-motion';

/**
 * Shared motion tokens. Importing these everywhere keeps every animation in the
 * app on the same physical "feel" — the thing that makes a UI read as designed
 * by one hand. Always pair with `useReducedMotion()` at the call site so motion
 * collapses to simple fades for users who ask for reduced motion.
 */

// Standard settle — buttons, panels, cards.
export const spring: Transition = { type: 'spring', stiffness: 300, damping: 28 };

// Softer, longer settle — large surfaces, modals, height reveals.
export const springSoft: Transition = { type: 'spring', stiffness: 200, damping: 26 };

// Snappy pop — status icons, badges, small confirmations.
export const springSnappy: Transition = { type: 'spring', stiffness: 500, damping: 30 };

// Plain easing for opacity-only transitions (page fades, overlays).
export const ease: Transition = { duration: 0.25, ease: [0.4, 0, 0.2, 1] };

/** Entrance for a single element: fade + rise. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: spring },
};

/** Entrance for a scaling element (modals, popovers, menus). */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show:   { opacity: 1, scale: 1, y: 0, transition: spring },
};

/**
 * Container that staggers its children. Pair with `fadeUp` (or any variant
 * exposing `hidden`/`show`) on the children, and drive with
 * `initial="hidden" animate="show"` on the container.
 */
export const stagger = (gap = 0.05, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren } },
});
