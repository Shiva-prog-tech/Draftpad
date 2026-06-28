'use client';
import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, X, Loader2, Copy, Check } from 'lucide-react';

interface Props {
  selectedText?: string;
  onInsert: (text: string) => void;
  onClose: () => void;
}

const QUICK_ACTIONS = [
  { label: 'Improve writing', action: 'improve' as const, icon: '✨' },
  { label: 'Summarize',       action: 'summarize' as const, icon: '📝' },
  { label: 'Fix grammar',     action: 'grammar' as const,  icon: '✓' },
  { label: 'Make shorter',    action: 'shorten' as const,  icon: '⚡' },
];

export function AIPanel({ selectedText, onInsert, onClose }: Props) {
  const reduce = useReducedMotion();
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const runAction = async (action: string, customPrompt?: string) => {
    setLoading(true); setError(''); setResult('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt || prompt,
          context: selectedText,
          action,
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'AI request failed');
      else setResult(data.result);
    } catch { setError('Failed to connect to AI'); }
    finally { setLoading(false); }
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="fixed bottom-0 left-0 right-0 z-40 flex max-h-[70vh] flex-col border border-line bg-[#0E0E10]/95 shadow-elev-4 backdrop-blur-xl md:bottom-6 md:left-auto md:right-6 md:w-96 md:rounded-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-grad shadow-glow-accent-sm">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">AI Assist</span>
          {selectedText && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] text-accent">
              {selectedText.length > 30 ? selectedText.slice(0, 30) + '…' : selectedText}
            </span>
          )}
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-txt-muted transition-all duration-200 hover:rotate-90 hover:bg-white/[0.06] hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 p-4 pb-3">
        {QUICK_ACTIONS.map(a => (
          <button key={a.action} onClick={() => runAction(a.action, a.label)} disabled={loading}
            className="flex items-center gap-1.5 rounded-full border border-line bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-txt-secondary transition-all hover:border-line-strong hover:bg-white/[0.06] hover:text-white disabled:opacity-50">
            <span>{a.icon}</span>{a.label}
          </button>
        ))}
      </div>

      {/* Custom prompt */}
      <div className="px-4 pb-3">
        <div className="flex gap-2">
          <input value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder="Ask AI anything about this document…"
            onKeyDown={e => e.key === 'Enter' && prompt.trim() && runAction('custom', prompt)}
            className="flex-1 rounded-lg border border-line bg-white/[0.02] px-3 py-2 text-xs text-white placeholder-[#3F3F46] transition-colors focus:border-accent focus:outline-none" />
          <button onClick={() => runAction('custom', prompt)} disabled={loading || !prompt.trim()}
            className="flex items-center gap-1 rounded-lg bg-accent-grad px-3 py-2 text-xs font-medium text-white shadow-glow-accent-sm transition-shadow hover:shadow-glow-accent disabled:opacity-40">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Result */}
      {(loading || result || error) && (
        <div className="premium-scroll flex-1 overflow-y-auto px-4 pb-4">
          <div className="rounded-lg border border-line bg-white/[0.02] p-3">
            {loading && (
              <div className="flex items-center gap-2 text-txt-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Generating…</span>
              </div>
            )}
            {error && <p className="text-xs text-red-400">{error}</p>}
            {result && (
              <>
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-txt-secondary">{result}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { onInsert(result); onClose(); }}
                    className="flex-1 rounded-lg bg-accent-grad py-1.5 text-xs font-medium text-white shadow-glow-accent-sm transition-shadow hover:shadow-glow-accent">
                    Insert into document
                  </button>
                  <button onClick={copy}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs text-txt-secondary transition-colors hover:border-line-strong hover:text-white">
                    {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
