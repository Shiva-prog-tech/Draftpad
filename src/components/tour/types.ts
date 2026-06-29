import type { ReactNode } from 'react';

export type TourSurface = 'dashboard' | 'editor';

export type Placement = 'auto' | 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TourStep {
  /** `data-tour` selector value to spotlight. Omit for a centered, target-less step. */
  target?: string;
  /** Gradient-chip icon (a lucide icon element). */
  icon?: ReactNode;
  /** Small eyebrow label above the title, e.g. "Slash menu". */
  eyebrow?: string;
  title: string;
  body: ReactNode;
  /** Preferred side of the target. Defaults to "auto" (best-fit). */
  placement?: Placement;
  /** Drop this step entirely when its target is missing (e.g. hidden on mobile). */
  optional?: boolean;
  /** Extra px of breathing room around the spotlight cutout. */
  pad?: number;
  /** Optional keyboard hint pill, e.g. "⌘K" or "/". */
  kbd?: string;
}

export interface TourDefinition {
  label: string;
  steps: TourStep[];
}
