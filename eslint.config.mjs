import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

// Next.js 16 removed the built-in `next lint` command, so we run ESLint
// directly. eslint-config-next v16 ships a native ESLint 9 flat config, so we
// spread it straight in (no FlatCompat needed).
const eslintConfig = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'next-env.d.ts',
      // The in-repo rich-editor ships a prebuilt bundle + its own deps.
      'src/packages/rich-editor/dist/**',
      'src/packages/rich-editor/node_modules/**',
    ],
  },

  ...nextCoreWebVitals,

  {
    rules: {
      // Relax rules that would flag the existing codebase wholesale, so lint
      // stays a meaningful gate without a repo-wide rewrite. Tighten later.
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
      'react-hooks/exhaustive-deps': 'warn',

      // New React-Compiler rules from eslint-plugin-react-hooks v6 (shipped by
      // eslint-config-next 16). They flag legitimate non-compiler patterns
      // (setState in effects, ref writes) throughout this codebase. The classic
      // 'rules-of-hooks' (error) and 'exhaustive-deps' (warn) still apply.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
    },
  },
];

export default eslintConfig;
