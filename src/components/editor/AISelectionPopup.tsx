'use client';
import { useState } from 'react';
import { Sparkles, MessageSquarePlus, Loader2, Check, X, RotateCcw } from 'lucide-react';

interface Props {
  selectedText: string;
  onReplace: (text: string) => void;
  onAddComment: (quote: string) => void;
  onClose: () => void;
}

const ACTIONS = [
  { label: 'Improve',  action: 'improve',  icon: '✨' },
  { label: 'Grammar',  action: 'grammar',  icon: '✓'  },
  { label: 'Shorter',  action: 'shorten',  icon: '⚡' },
  { label: 'Formal',   action: 'formal',   icon: '🎩' },
  { label: 'Continue', action: 'continue', icon: '→'  },
];

export function AISelectionPopup({ selectedText, onReplace, onAddComment, onClose }: Props) {
  const [loading, setLoading]               = useState<string | null>(null);
  const [result, setResult]                 = useState('');
  const [currentActionLabel, setCurrentActionLabel] = useState('');
  const [error, setError]                   = useState('');

  const runAction = async (action: string, label: string) => {
    setLoading(action);
    setCurrentActionLabel(label);
    setResult('');
    setError('');
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: label, context: selectedText, action }),
      });
      const data = await res.json();
      if (res.ok) setResult(data.result);
      else setError(data.error || 'AI request failed');
    } catch {
      setError('Failed to connect to AI');
    } finally {
      setLoading(null);
    }
  };

  const handleReplace = () => {
    onReplace(result);
    onClose();
  };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {/* onMouseDown preventDefault keeps editor selection alive when clicking popup buttons */}
      <div className="pointer-events-auto flex flex-col items-center gap-2" onMouseDown={e => e.preventDefault()}>
        {/* Result card */}
        {(result || error) && (
          <div className="bg-[#111113] border border-[#1F1F23] rounded-xl shadow-2xl w-[420px] p-4 animate-[slideUp_0.15s_ease-out]">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" />
              <span className="text-[#6366F1] text-xs font-semibold">{currentActionLabel}</span>
              <button onClick={() => setResult('')} className="ml-auto text-[#52525B] hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {error ? (
              <p className="text-red-400 text-xs">{error}</p>
            ) : (
              <>
                <p className="text-[#A1A1AA] text-xs leading-relaxed mb-3 max-h-28 overflow-y-auto whitespace-pre-wrap">
                  {result}
                </p>
                <div className="flex gap-2">
                  <button onClick={handleReplace}
                    className="flex-1 bg-[#6366F1] hover:bg-[#5254CC] text-white text-xs font-medium py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                    <Check className="w-3 h-3" /> Replace selection
                  </button>
                  <button onClick={() => setResult('')}
                    className="border border-[#1F1F23] hover:border-[#2a2a30] text-[#A1A1AA] hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Retry
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-1 bg-[#111113] border border-[#1F1F23] rounded-xl px-2 py-1.5 shadow-2xl">
          <div className="flex items-center gap-1.5 text-[#6366F1] pl-1 mr-1.5">
            <Sparkles className="w-3 h-3" />
            <span className="text-[11px] font-semibold">AI</span>
          </div>

          {ACTIONS.map(a => (
            <button key={a.action}
              onClick={() => runAction(a.action, a.label)}
              disabled={!!loading}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#A1A1AA] hover:text-white hover:bg-[#1F1F23] disabled:opacity-40 transition-all whitespace-nowrap">
              {loading === a.action
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <span className="text-[10px]">{a.icon}</span>}
              {a.label}
            </button>
          ))}

          <div className="w-px h-4 bg-[#1F1F23] mx-1 flex-shrink-0" />

          <button
            onClick={() => onAddComment(selectedText)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#A1A1AA] hover:text-white hover:bg-[#1F1F23] transition-all whitespace-nowrap">
            <MessageSquarePlus className="w-3 h-3" />
            Comment
          </button>

          <button onClick={onClose} className="p-1 text-[#52525B] hover:text-white transition-colors ml-0.5">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
