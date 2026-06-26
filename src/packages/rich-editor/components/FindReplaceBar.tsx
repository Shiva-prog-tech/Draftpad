'use client';
import { useState, useRef, useEffect, useCallback, RefObject } from 'react';
import { X, ChevronUp, ChevronDown, Replace } from 'lucide-react';

interface Props {
  editorRef:      RefObject<HTMLDivElement | null>;
  isHighlighting: { current: boolean }; // plain object — mutable regardless of React version
  onClose: () => void;
}

const ACTIVE_COLOR = '#FBBF24';
const MATCH_COLOR  = 'rgba(251,191,36,0.25)';

export function FindReplaceBar({ editorRef, isHighlighting, onClose }: Props) {
  const [findText,    setFindText]    = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [matchCount,  setMatchCount]  = useState(0);
  const [currentIdx,  setCurrentIdx]  = useState(0);
  const findRef    = useRef<HTMLInputElement>(null);
  const matchesRef = useRef<HTMLElement[]>([]);

  useEffect(() => { findRef.current?.focus(); }, []);

  // ── helpers ──────────────────────────────────────────────────
  const clearMarks = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    isHighlighting.current = true;
    editor.querySelectorAll('mark[data-fr]').forEach(m => {
      const p = m.parentNode!;
      while (m.firstChild) p.insertBefore(m.firstChild, m);
      p.removeChild(m);
      p.normalize();
    });
    isHighlighting.current = false;
    matchesRef.current = [];
  }, [editorRef, isHighlighting]);

  const applyMarks = useCallback((text: string, activeIndex: number) => {
    const editor = editorRef.current;
    if (!editor || !text) { clearMarks(); setMatchCount(0); setCurrentIdx(0); return; }

    clearMarks();

    // Collect ranges (back-to-front to keep offsets valid as we modify DOM)
    const ranges: Range[] = [];
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex   = new RegExp(escaped, 'gi');
    const walker  = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      const content = node.textContent || '';
      let match: RegExpExecArray | null;
      while ((match = regex.exec(content)) !== null) {
        const r = document.createRange();
        r.setStart(node, match.index);
        r.setEnd(node, match.index + match[0].length);
        ranges.push(r);
      }
    }

    if (ranges.length === 0) { setMatchCount(0); setCurrentIdx(0); return; }

    const clampedIdx = ((activeIndex % ranges.length) + ranges.length) % ranges.length;

    isHighlighting.current = true;
    // Apply back-to-front so earlier offsets stay valid
    [...ranges].reverse().forEach((r, revI) => {
      const origIdx = ranges.length - 1 - revI;
      const mark = document.createElement('mark');
      mark.dataset.fr = String(origIdx);
      mark.style.background = origIdx === clampedIdx ? ACTIVE_COLOR : MATCH_COLOR;
      mark.style.color       = origIdx === clampedIdx ? '#000' : 'inherit';
      mark.style.borderRadius = '2px';
      try { r.surroundContents(mark); } catch { /* skip cross-node ranges */ }
    });
    isHighlighting.current = false;

    const allMarks = Array.from(
      editor.querySelectorAll<HTMLElement>('mark[data-fr]')
    ).sort((a, b) => Number(a.dataset.fr) - Number(b.dataset.fr));

    matchesRef.current = allMarks;
    setMatchCount(allMarks.length);
    setCurrentIdx(clampedIdx);

    allMarks[clampedIdx]?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [editorRef, isHighlighting, clearMarks]);

  // Re-run on text change
  useEffect(() => {
    applyMarks(findText, 0);
    return clearMarks;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [findText]);

  const goNext = useCallback(() => applyMarks(findText, currentIdx + 1), [applyMarks, findText, currentIdx]);
  const goPrev = useCallback(() => applyMarks(findText, currentIdx - 1), [applyMarks, findText, currentIdx]);

  const handleReplace = () => {
    const mark = matchesRef.current[currentIdx];
    if (!mark) return;
    isHighlighting.current = true;
    mark.textContent = replaceText;
    mark.removeAttribute('data-fr');
    mark.style.background = '';
    mark.style.color = '';
    isHighlighting.current = false;
    // sync editor content
    const editor = editorRef.current;
    if (editor) {
      const ev = new Event('input', { bubbles: true });
      editor.dispatchEvent(ev);
    }
    applyMarks(findText, currentIdx);
  };

  const handleReplaceAll = () => {
    isHighlighting.current = true;
    matchesRef.current.forEach(m => {
      m.textContent = replaceText;
      m.removeAttribute('data-fr');
      m.style.background = '';
      m.style.color = '';
    });
    isHighlighting.current = false;
    const editor = editorRef.current;
    if (editor) {
      const ev = new Event('input', { bubbles: true });
      editor.dispatchEvent(ev);
    }
    clearMarks();
    setMatchCount(0);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { clearMarks(); onClose(); }
      if (e.key === 'Enter' && document.activeElement === findRef.current) {
        e.preventDefault();
        e.shiftKey ? goPrev() : goNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clearMarks, onClose, goNext, goPrev]);

  const btn = 'flex items-center justify-center w-6 h-6 rounded text-[#71717A] hover:text-white hover:bg-[#1F1F23] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0';
  const inp = 'bg-[#111113] border border-[#232329] rounded-md text-sm text-[#E4E4E7] placeholder-[#52525B] px-2.5 py-1 focus:outline-none focus:border-[#6366F1] transition-colors';

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#1F1F23] bg-[#0D0D10] flex-shrink-0 flex-wrap">
      {/* Toggle replace */}
      <button
        onClick={() => setShowReplace(v => !v)}
        className={`${btn} ${showReplace ? 'text-[#6366F1]' : ''}`}
        title="Toggle replace"
      >
        <Replace className="w-3.5 h-3.5" />
      </button>

      {/* Find */}
      <div className="flex items-center gap-1.5">
        <input
          ref={findRef}
          value={findText}
          onChange={e => setFindText(e.target.value)}
          placeholder="Find…"
          className={`${inp} w-44`}
        />
        <span className="text-xs text-[#52525B] tabular-nums min-w-[40px]">
          {matchCount > 0 ? `${currentIdx + 1}/${matchCount}` : matchCount === 0 && findText ? '0/0' : ''}
        </span>
        <button onClick={goPrev} disabled={matchCount === 0} className={btn} title="Previous (Shift+Enter)">
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button onClick={goNext} disabled={matchCount === 0} className={btn} title="Next (Enter)">
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Replace */}
      {showReplace && (
        <div className="flex items-center gap-1.5">
          <div className="w-px h-4 bg-[#1F1F23]" />
          <input
            value={replaceText}
            onChange={e => setReplaceText(e.target.value)}
            placeholder="Replace with…"
            className={`${inp} w-44`}
          />
          <button
            onClick={handleReplace}
            disabled={matchCount === 0}
            className="h-6 px-2 rounded text-xs font-medium bg-[#1F1F23] text-[#A1A1AA] hover:text-white hover:bg-[#2a2a30] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            Replace
          </button>
          <button
            onClick={handleReplaceAll}
            disabled={matchCount === 0}
            className="h-6 px-2 rounded text-xs font-medium bg-[#1F1F23] text-[#A1A1AA] hover:text-white hover:bg-[#2a2a30] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            All
          </button>
        </div>
      )}

      <button onClick={() => { clearMarks(); onClose(); }} className={`${btn} ml-auto`} title="Close (Esc)">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
