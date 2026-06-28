'use client';
import { motion } from 'framer-motion';

/**
 * Runs on every route navigation (App Router). Opacity-only fade — deliberately
 * NOT a transform, since a transformed ancestor would break the `position: fixed`
 * side panels in the editor.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
