'use client';
import { useState, useCallback } from 'react';
import { X, Play, Loader2, Terminal, ChevronDown, AlertCircle, CheckCircle2 } from 'lucide-react';

const LANGUAGES = ['javascript', 'typescript', 'python', 'bash'] as const;
type Lang = typeof LANGUAGES[number];

const LANG_LABEL: Record<Lang, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python:     'Python',
  bash:       'Bash',
};
const LANG_BADGE: Record<Lang, { bg: string; color: string }> = {
  javascript: { bg: '#2E2006', color: '#F59E0B' },
  typescript: { bg: '#0D1F3B', color: '#60A5FA' },
  python:     { bg: '#0C2919', color: '#34D399' },
  bash:       { bg: '#1A1A1A', color: '#A1A1AA' },
};

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
    <div className="fixed right-0 top-0 bottom-0 w-[420px] bg-[#111113] border-l border-[#1F1F23] z-30 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F23] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#6366F1]" />
          <span className="text-white text-sm font-semibold">Code Runner</span>
          <span className="text-[#3F3F46] text-[10px] ml-0.5">via Wandbox</span>
        </div>
        <button onClick={onClose} className="p-1.5 text-[#52525B] hover:text-white transition-colors rounded-lg hover:bg-[#1F1F23]">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Terminal className="w-7 h-7 text-[#2a2a2e]" />
            <p className="text-[#52525B] text-xs leading-relaxed">
              No code blocks in this document.<br />
              Use <span className="text-[#A1A1AA] font-mono">/code</span> to insert one.
            </p>
          </div>
        ) : (
          blocks.map(block => (
            <BlockCard key={block.id} block={block} onUpdate={update} onRun={run} />
          ))
        )}
      </div>
    </div>
  );
}

interface CardProps {
  block:    Block;
  onUpdate: (id: number, patch: Partial<Block>) => void;
  onRun:    (block: Block) => void;
}

function BlockCard({ block, onUpdate, onRun }: CardProps) {
  const [langOpen, setLangOpen] = useState(false);
  const badge    = LANG_BADGE[block.language];
  const hasOut   = !!(block.output || block.error);
  const success  = block.exitCode === 0;

  return (
    <div className="bg-[#0A0A0B] border border-[#1F1F23] rounded-xl overflow-hidden">
      {/* Block header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1F1F23]">
        <div className="relative">
          <button
            onClick={() => setLangOpen(v => !v)}
            style={{ backgroundColor: badge.bg, color: badge.color }}
            className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full"
          >
            {LANG_LABEL[block.language]}
            <ChevronDown className="w-2.5 h-2.5 opacity-70" />
          </button>
          {langOpen && (
            <div className="absolute top-full left-0 mt-1 bg-[#111113] border border-[#1F1F23] rounded-lg shadow-xl z-20 py-1 min-w-[120px]">
              {LANGUAGES.map(l => (
                <button
                  key={l}
                  onClick={() => { onUpdate(block.id, { language: l, output: '', error: '', exitCode: null }); setLangOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-[#1F1F23] ${block.language === l ? 'text-white' : 'text-[#71717A]'}`}
                >
                  {LANG_LABEL[l]}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onRun(block)}
          disabled={block.running}
          className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#5254CC] disabled:opacity-60 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
        >
          {block.running
            ? <><Loader2 className="w-3 h-3 animate-spin" />Running…</>
            : <><Play  className="w-3 h-3" />Run</>}
        </button>
      </div>

      {/* Editable code area */}
      <textarea
        value={block.code}
        onChange={e => onUpdate(block.id, { code: e.target.value, output: '', error: '', exitCode: null })}
        spellCheck={false}
        rows={Math.min(12, Math.max(3, block.code.split('\n').length))}
        className="w-full bg-transparent text-[#A1A1AA] font-mono text-[11px] leading-relaxed p-3 resize-none focus:outline-none max-h-[220px] overflow-y-auto"
        style={{ fontFamily: 'JetBrains Mono, Fira Code, Courier New, monospace' }}
      />

      {/* Output area */}
      {hasOut && (
        <div className="border-t border-[#1F1F23]">
          <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[#1F1F23] bg-[#0A0A0B]">
            {success
              ? <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              : <AlertCircle  className="w-3 h-3 text-red-400" />}
            <span className={`text-[10px] font-semibold ${success ? 'text-emerald-400' : 'text-red-400'}`}>
              {success ? 'Exit 0 — OK' : `Exit ${block.exitCode}`}
            </span>
          </div>
          {block.output && (
            <pre className="p-3 text-[11px] text-emerald-400 font-mono leading-relaxed whitespace-pre-wrap break-all max-h-[140px] overflow-y-auto"
              style={{ fontFamily: 'JetBrains Mono, Fira Code, Courier New, monospace' }}>
              {block.output}
            </pre>
          )}
          {block.error && (
            <pre className={`p-3 text-[11px] text-red-400 font-mono leading-relaxed whitespace-pre-wrap break-all max-h-[140px] overflow-y-auto ${block.output ? 'border-t border-[#1F1F23]' : ''}`}
              style={{ fontFamily: 'JetBrains Mono, Fira Code, Courier New, monospace' }}>
              {block.error}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
