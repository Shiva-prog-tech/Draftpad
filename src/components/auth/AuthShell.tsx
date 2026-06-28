'use client';
import { type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { FileText, Sparkles, Users, History, Zap } from 'lucide-react';
import { Button } from '@/components/ui';
import { fadeUp, stagger } from '@/lib/motion';

export const inputClass =
  'w-full rounded-lg border border-line bg-white/[0.02] px-3.5 py-2.5 text-sm text-white placeholder-txt-muted transition-all focus:border-accent focus:shadow-glow-accent-sm focus:outline-none focus:ring-1 focus:ring-accent/40';
export const labelClass = 'mb-1.5 block text-xs font-medium uppercase tracking-wider text-txt-secondary';

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const PROVIDERS = [
  { id: 'github', label: 'Continue with GitHub', Icon: GitHubIcon },
  { id: 'google', label: 'Continue with Google', Icon: GoogleIcon },
  { id: 'linkedin', label: 'Continue with LinkedIn', Icon: LinkedInIcon },
];

const FEATURES = [
  { Icon: Users, text: 'Real-time collaborative editing' },
  { Icon: History, text: 'Full version history & restore' },
  { Icon: Sparkles, text: 'AI assistant built in' },
  { Icon: Zap, text: 'Offline-first, instant sync' },
];

interface Props {
  title: string;
  subtitle: string;
  error?: string;
  oauthLoading: string | null;
  onOAuth: (provider: string) => void;
  footer: ReactNode;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, error, oauthLoading, onOAuth, footer, children }: Props) {
  const reduce = useReducedMotion();

  return (
    <div className="flex min-h-screen">
      {/* ── Left: form ── */}
      <div className="flex w-full flex-col justify-center px-6 py-10 lg:w-[55%] lg:px-20">
        <motion.div
          variants={stagger(0.06)}
          initial="hidden"
          animate="show"
          className="mx-auto w-full max-w-sm"
        >
          {/* Logo */}
          <motion.div variants={fadeUp} className="mb-8 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-grad shadow-glow-accent-sm">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">Draftpad</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-2xl font-semibold tracking-tight text-white">{title}</motion.h1>
          <motion.p variants={fadeUp} className="mb-7 mt-1 text-sm text-txt-secondary">{subtitle}</motion.p>

          {/* OAuth */}
          <motion.div variants={fadeUp} className="space-y-2">
            {PROVIDERS.map(({ id, label, Icon }) => (
              <Button
                key={id}
                variant="secondary"
                onClick={() => onOAuth(id)}
                disabled={!!oauthLoading}
                loading={oauthLoading === id}
                sheen={false}
                className="w-full"
              >
                {oauthLoading !== id && <Icon />}
                {label}
              </Button>
            ))}
          </motion.div>

          {/* Divider */}
          <motion.div variants={fadeUp} className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs text-txt-muted">or</span>
            <div className="h-px flex-1 bg-line" />
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                animate={reduce ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={fadeUp}>{children}</motion.div>

          <motion.p variants={fadeUp} className="mt-5 text-center text-sm text-txt-muted">{footer}</motion.p>
        </motion.div>
      </div>

      {/* ── Right: branded panel ── */}
      <div className="relative hidden overflow-hidden lg:flex lg:w-[45%]">
        {/* soft fade into the left side instead of a hard border */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#13132a] via-[#0E0E16] to-bg-primary" />
        <div className="absolute -right-20 top-1/4 h-96 w-96 rounded-full bg-[#6366F1]/20 blur-[120px]" />
        <div className="absolute -left-10 bottom-10 h-72 w-72 rounded-full bg-[#8B5CF6]/15 blur-[120px]" />

        <div className="relative z-10 flex flex-col justify-center px-16">
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 26 }}
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3 py-1 text-xs text-txt-secondary backdrop-blur">
              <Sparkles className="h-3 w-3 text-accent" />
              Write. Collaborate. Ship.
            </div>
            <h2 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight text-white">
              The collaborative editor your team will actually enjoy.
            </h2>
            <ul className="mt-8 space-y-3">
              {FEATURES.map(({ Icon, text }, i) => (
                <motion.li
                  key={text}
                  initial={reduce ? { opacity: 0 } : { opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.08 }}
                  className="flex items-center gap-3 text-sm text-txt-secondary"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-grad-soft">
                    <Icon className="h-3.5 w-3.5 text-accent" />
                  </span>
                  {text}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
