'use client';
import { useState, useEffect, useRef } from 'react';
import { Link, Trash2, X } from 'lucide-react';

interface Props {
  initialUrl?: string;
  onConfirm: (url: string) => void;
  onRemove: () => void;
  onClose: () => void;
}

export function LinkDialog({ initialUrl = '', onConfirm, onRemove, onClose }: Props) {
  const [url, setUrl] = useState(initialUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') { e.preventDefault(); handleConfirm(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handleConfirm = () => {
    let href = url.trim();
    if (!href) { onClose(); return; }
    if (!/^https?:\/\//i.test(href) && !href.startsWith('mailto:') && !href.startsWith('#')) {
      href = 'https://' + href;
    }
    onConfirm(href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-[#111115] border border-[#232329] rounded-xl shadow-2xl p-4 w-[360px] flex flex-col gap-3"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <Link className="w-4 h-4 text-[#6366F1] flex-shrink-0" />
          <span className="text-sm font-medium text-[#E4E4E7]">Insert link</span>
          <button onClick={onClose} className="ml-auto text-[#52525B] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <input
          ref={inputRef}
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="bg-[#0D0D10] border border-[#232329] rounded-lg text-sm text-[#E4E4E7] placeholder-[#52525B] px-3 py-2 focus:outline-none focus:border-[#6366F1] transition-colors w-full"
        />

        <div className="flex items-center gap-2">
          <button
            onClick={handleConfirm}
            className="flex-1 bg-[#6366F1] hover:bg-[#5254CC] text-white rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
          >
            Apply
          </button>
          {initialUrl && (
            <button
              onClick={onRemove}
              className="flex items-center gap-1.5 text-[#F87171] hover:text-[#EF4444] border border-[#2a1e1e] hover:border-[#EF4444]/30 rounded-lg px-3 py-1.5 text-sm transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
