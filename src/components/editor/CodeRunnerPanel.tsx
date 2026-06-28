'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Play, Loader2, Terminal, ChevronDown, AlertCircle, CheckCircle2, Copy, Check } from 'lucide-react';

const LANGUAGES = ['javascript', 'typescript', 'python', 'bash'] as const;
type Lang = typeof LANGUAGES[number];

const LANG_LABEL: Record<Lang, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python:     'Python',
  bash:       'Bash',
};
const LANG_BADGE: Record<Lang, { bg: string; color: string; dot: string }> = {
  javascript: { bg: '#2E2006', color: '#F59E0B', dot: '#F59E0B' },
  typescript: { bg: '#0D1F3B', color: '#60A5FA', dot: '#60A5FA' },
  python:     { bg: '#0C2919', color: '#34D399', dot: '#34D399' },
  bash:       { bg: '#1A1A1A', color: '#A1A1AA', dot: '#A1A1AA' },
};

// Shared spring — gives everything the same physical "settle"
const SPRING = { type: 'spring' as const, stiffness: 300, damping: 28 };

function detectLanguage(code: string): Lang {
  if (/^\s*(def |print\(|import [a-z]|from [a-z]|if __name__|class [A-Z])/m.test(code)) return 'python';
  if (/^\s*(#!\/bin\/(ba)?sh|echo |grep |sed |awk |curl )/m.test(code))               return 'bash';
  if (/^\s*(interface |type [A-Z]|:\s*(string|number|boolean))/m.test(code))          return 'typescript';
  return 'javascript';
}

interface Block {
  id:       number;
  code:     string;
  language: Lang;
  output:   string;
  error:    string;
  running:  boolean;
  exitCode: number | null;
}

function parseBlocks(html: string): Omit<Block, 'output' | 'error' | 'running' | 'exitCode'>[] {
  if (typeof window === 'undefined') return [];
  const doc  = new DOMParser().parseFromString(html, 'text/html');
  const pres = doc.querySelectorAll('pre:not([data-mermaid])');
  return Array.from(pres)
    .map((pre, i) => {
      const code     = (pre.querySelector('code')?.textContent ?? pre.textContent ?? '').trim();
      const cls      = pre.querySelector('[class*="language-"]')?.className ?? '';
      const matched  = cls.match(/language-(\w+)/)?.[1] as Lang | undefined;
      const language = (matched && LANGUAGES.includes(matched)) ? matched : detectLanguage(code);
      return { id: i, code, language };
    })
    .filter(b => b.code.length > 2);
}

interface Props { content: string; onClose: () => void; }

export function CodeRunnerPanel({ content, onClose }: Props) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(true);
  const [blocks, setBlocks] = useState<Block[]>(() =>
    parseBlocks(content).map(b => ({ ...b, output: '', error: '', running: false, exitCode: null }))
  );

  const update = useCallback((id: number, patch: Partial<Block>) =>
    setBlocks(bs => bs.map(b => b.id === id ? { ...b, ...patch } : b)), []);

  const run = useCallback(async (block: Block) => {
    update(block.id, { running: true, output: '', error: '', exitCode: null });
    try {
      const res  = await fetch('/api/execute', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ language: block.language, code: block.code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Execution failed');
      update(block.id, { running: false, output: data.stdout ?? '', error: data.stderr ?? '', exitCode: data.exitCode });
    } catch (err: unknown) {
      update(block.id, { running: false, error: err instanceof Error ? err.message : 'Failed', exitCode: -1 });
    }
  }, [update]);

  return (
    <AnimatePresence onExitComplete={onClose}>
      {open && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { x: 440, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { x: 440, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          className="fixed right-0 top-0 bottom-0 w-[440px] z-30 flex flex-col
                     bg-[#0E0E10]/95 backdrop-blur-xl border-l border-white/[0.06]
                     shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.7)]"
        >
          {/* gradient edge light */}
          <div className="absolute left-0 top-0 bottom-0 w-px pointer-events-none
                          bg-gradient-to-b from-transparent via-[#6366F1]/40 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg
                              bg-gradient-to-br from-[#6366F1] to-[#4F46E5] shadow-lg shadow-[#6366F1]/25">
                <Terminal className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-white text-sm font-semibold tracking-tight leading-tight">Code Runner</span>
                <span className="text-[#52525B] text-[10px] leading-none mt-0.5">Powered by Wandbox</span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              data-tip="Close"
              className="tooltip p-2 text-[#52525B] hover:text-white hover:bg-white/[0.06]
                         rounded-lg transition-all duration-200 hover:rotate-90"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="premium-scroll flex-1 overflow-y-auto p-4 space-y-4">
            {blocks.length === 0 ? (
              <motion.div
                initial={reduce ? false : { opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={SPRING}
                className="flex flex-col items-center justify-center py-20 gap-4 text-center"
              >
                <motion.div
                  animate={reduce ? undefined : { y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#18181B] to-[#0A0A0B]
                             border border-white/[0.06] flex items-center justify-center shadow-lg shadow-black/40"
                >
                  <Terminal className="w-6 h-6 text-[#3F3F46]" />
                </motion.div>
                <p className="text-[#52525B] text-xs leading-relaxed">
                  No code blocks in this document.<br />
                  Type <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[#A1A1AA] font-mono text-[10px]">/code</kbd> to insert one.
                </p>
              </motion.div>
            ) : (
              blocks.map((block, i) => (
                <BlockCard key={block.id} block={block} index={i} reduce={!!reduce} onUpdate={update} onRun={run} />
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface CardProps {
  block:    Block;
  index:    number;
  reduce:   boolean;
  onUpdate: (id: number, patch: Partial<Block>) => void;
  onRun:    (block: Block) => void;
}

function BlockCard({ block, index, reduce, onUpdate, onRun }: CardProps) {
  const [langOpen, setLangOpen] = useState(false);
  const gutterRef = useRef<HTMLDivElement>(null);
  const badge    = LANG_BADGE[block.language];
  const hasOut   = !!(block.output || block.error);
  const success  = block.exitCode === 0;
  const lineCount = block.code.split('\n').length;

  // keep line-number gutter scroll-synced with the textarea
  const onScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
  };

  return (
    <motion.div
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduce ? { duration: 0.15 } : { ...SPRING, delay: index * 0.06 }}
      whileHover={reduce ? undefined : { y: -2 }}
      className="group relative rounded-2xl overflow-hidden bg-[#0A0A0B]
                 border border-white/[0.06] transition-shadow duration-300
                 hover:border-white/[0.1] hover:shadow-xl hover:shadow-black/40"
    >
      {/* gradient border glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                      transition-opacity duration-300 pointer-events-none
                      bg-gradient-to-br from-[#6366F1]/[0.12] via-transparent to-transparent" />

      {/* Block header */}
      <div className="relative flex items-center justify-between px-3 py-2.5 border-b border-white/[0.05]">
        <div className="relative">
          <button
            onClick={() => setLangOpen(v => !v)}
            style={{ backgroundColor: badge.bg, color: badge.color }}
            className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full transition-transform active:scale-95"
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: badge.dot }} />
            {LANG_LABEL[block.language]}
            <ChevronDown className={`w-2.5 h-2.5 opacity-70 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {langOpen && (
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full left-0 mt-1.5 origin-top bg-[#141417] border border-white/[0.08]
                           rounded-xl shadow-2xl shadow-black/60 z-20 py-1 min-w-[130px] overflow-hidden"
              >
                {LANGUAGES.map(l => (
                  <button
                    key={l}
                    onClick={() => { onUpdate(block.id, { language: l, output: '', error: '', exitCode: null }); setLangOpen(false); }}
                    className={`w-full flex items-center gap-2 text-left px-3 py-1.5 text-xs transition-colors hover:bg-white/[0.06] ${block.language === l ? 'text-white' : 'text-[#71717A]'}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: LANG_BADGE[l].dot }} />
                    {LANG_LABEL[l]}
                    {block.language === l && <Check className="w-3 h-3 ml-auto text-[#6366F1]" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          whileHover={reduce ? undefined : { scale: 1.04 }}
          whileTap={reduce ? undefined : { scale: 0.95 }}
          onClick={() => onRun(block)}
          disabled={block.running}
          className="group/run relative flex items-center gap-1.5 overflow-hidden
                     bg-gradient-to-b from-[#6366F1] to-[#5254CC] text-white text-xs font-semibold
                     px-4 py-2 rounded-xl shadow-lg shadow-[#6366F1]/25
                     disabled:opacity-70 transition-shadow hover:shadow-[#6366F1]/40"
        >
          {block.running
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Running…</>
            : <><Play className="w-3.5 h-3.5 fill-current" />Run</>}
          {/* sheen sweep */}
          {!reduce && (
            <span className="absolute inset-0 -translate-x-full group-hover/run:translate-x-full
                            transition-transform duration-700 ease-out
                            bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          )}
        </motion.button>
      </div>

      {/* Editable code area with line-number gutter + focus ring */}
      <div className="relative group/code">
        {/* line numbers */}
        <div
          ref={gutterRef}
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-9 overflow-hidden select-none
                     py-3 text-right pr-2 text-[11px] text-[#3F3F46] bg-black/20 border-r border-white/[0.04]"
          style={{ fontFamily: 'JetBrains Mono, Fira Code, monospace', lineHeight: '18px' }}
        >
          {Array.from({ length: lineCount }, (_, n) => <div key={n}>{n + 1}</div>)}
        </div>

        <textarea
          value={block.code}
          onChange={e => onUpdate(block.id, { code: e.target.value, output: '', error: '', exitCode: null })}
          onScroll={onScroll}
          spellCheck={false}
          rows={Math.min(12, Math.max(3, lineCount))}
          className="premium-scroll w-full bg-transparent text-[#D4D4D8] font-mono text-[11px]
                     pl-11 pr-3 py-3 resize-none focus:outline-none max-h-[220px] overflow-y-auto
                     focus:bg-white/[0.01] transition-colors relative"
          style={{ fontFamily: 'JetBrains Mono, Fira Code, monospace', lineHeight: '18px' }}
        />

        {/* focus ring */}
        <div className="absolute inset-0 rounded-none ring-1 ring-inset ring-transparent
                        group-focus-within/code:ring-[#6366F1]/30 pointer-events-none transition-all duration-200" />
      </div>

      {/* Output area — animated reveal */}
      <AnimatePresence initial={false}>
        {block.running ? (
          <motion.div
            key="loading"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 28 }}
            className="overflow-hidden border-t border-white/[0.05]"
          >
            <div className="px-3 py-4 space-y-2.5">
              {[80, 62, 70, 48].map((w, n) => (
                <div key={n} style={{ width: `${w}%` }}
                  className="h-2.5 rounded-full bg-white/[0.04] relative overflow-hidden">
                  <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite]
                                   bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
              ))}
            </div>
          </motion.div>
        ) : hasOut ? (
          <motion.div
            key="output"
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 26 }}
            className="overflow-hidden border-t border-white/[0.05]"
          >
            <div className="flex items-center justify-between px-3 py-2 bg-white/[0.02]">
              <div className="flex items-center gap-1.5">
                <motion.span
                  initial={reduce ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                >
                  {success
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    : <AlertCircle  className="w-3.5 h-3.5 text-red-400" />}
                </motion.span>
                <span className={`text-[10px] font-semibold ${success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {success ? 'Success — Exit 0' : `Exit ${block.exitCode}`}
                </span>
              </div>
              <CopyButton text={block.output || block.error} />
            </div>

            {block.output && (
              <motion.pre
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="premium-scroll p-3 text-[11px] text-emerald-400/90 font-mono leading-relaxed whitespace-pre-wrap break-all max-h-[140px] overflow-y-auto"
                style={{ fontFamily: 'JetBrains Mono, Fira Code, monospace' }}>
                {block.output}
              </motion.pre>
            )}
            {block.error && (
              <motion.pre
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className={`premium-scroll p-3 text-[11px] text-red-400/90 font-mono leading-relaxed whitespace-pre-wrap break-all max-h-[140px] overflow-y-auto ${block.output ? 'border-t border-white/[0.05]' : ''}`}
                style={{ fontFamily: 'JetBrains Mono, Fira Code, monospace' }}>
                {block.error}
              </motion.pre>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      onClick={copy}
      data-tip={copied ? 'Copied!' : 'Copy output'}
      className="tooltip flex items-center justify-center w-6 h-6 rounded-md
                 text-[#52525B] hover:text-white hover:bg-white/[0.06] transition-colors"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span key="check" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.15 }}>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 0.15 }}>
            <Copy className="w-3.5 h-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
