import { defineConfig } from 'tsup';

export default defineConfig({
  entry:     ['index.ts'],
  format:    ['esm', 'cjs'],
  dts:       true,
  clean:     true,
  sourcemap: true,
  external:  ['react', 'react-dom', 'lucide-react'],
  // Stamp every output file with 'use client' so Next.js knows
  // all exports are client components without consumers having to add it.
  banner: { js: '"use client";' },
  esbuildOptions(opts) {
    opts.jsx = 'automatic';
  },
});
