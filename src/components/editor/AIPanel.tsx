'use client';
import { useState } from 'react';
import { Sparkles, X, Loader2, Copy, Check, ChevronDown } from 'lucide-react';

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
    <div className="fixed bottom-0 left-0 right-0 md:left-auto md:right-6 md:bottom-6 md:w-96 z-40 bg-[#111113] border border-[#1F1F23] md:rounded-xl shadow-2xl animate-[slideUp_0.2s_ease-out] max-h-[70vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1F1F23]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#6366F1]" />
          <span className="text-white font-semibold text-sm">AI Assist</span>
          {selectedText && (
            <span className="text-[10px] bg-[#6366F1]/15 text-[#6366F1] px-2 py-0.5 rounded-full">
              {selectedText.length > 30 ? selectedText.slice(0, 30) + '…' : selectedText}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-[#52525B] hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 p-4 pb-3 flex-wrap">
        {QUICK_ACTIONS.map(a => (
          <button key={a.action} onClick={() => runAction(a.action, a.label)} disabled={loading}
            className="flex items-center gap-1.5 bg-[#0A0A0B] hover:bg-[#16161A] border border-[#1F1F23] hover:border-[#2a2a30] text-[#A1A1AA] hover:text-white disabled:opacity-50 rounded-full px-3 py-1.5 text-xs font-medium transition-all">
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
            className="flex-1 bg-[#0A0A0B] border border-[#1F1F23] text-white placeholder-[#3F3F46] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#6366F1] transition-colors" />
          <button onClick={() => runAction('custom', prompt)} disabled={loading || !prompt.trim()}
            className="bg-[#6366F1] hover:bg-[#5254CC] disabled:opacity-40 text-white rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Result */}
      {(loading || result || error) && (
        <div className="px-4 pb-4 flex-1 overflow-y-auto">
          <div className="bg-[#0A0A0B] border border-[#1F1F23] rounded-lg p-3">
            {loading && (
              <div className="flex items-center gap-2 text-[#52525B]">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Generating…</span>
              </div>
            )}
            {error && <p className="text-red-400 text-xs">{error}</p>}
            {result && (
              <>
                <p className="text-[#A1A1AA] text-xs leading-relaxed whitespace-pre-wrap">{result}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { onInsert(result); onClose(); }}
                    className="flex-1 bg-[#6366F1] hover:bg-[#5254CC] text-white rounded-lg py-1.5 text-xs font-medium transition-colors">
                    Insert into document
                  </button>
                  <button onClick={copy}
                    className="border border-[#1F1F23] hover:border-[#2a2a30] text-[#A1A1AA] rounded-lg px-3 py-1.5 text-xs transition-colors">
                    {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
