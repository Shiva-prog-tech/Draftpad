'use client';
import { useState, useEffect } from 'react';
import { X, BookOpen, ChevronRight } from 'lucide-react';

interface Heading { level: 1 | 2 | 3; text: string; index: number; }
interface Props { content: string; onClose: () => void; }

function parseHeadings(html: string): Heading[] {
  if (typeof window === 'undefined') return [];
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(doc.querySelectorAll('h1, h2, h3')).map((el, i) => ({
    level: parseInt(el.tagName[1]) as 1 | 2 | 3,
    text:  el.textContent?.trim() || `Heading ${i + 1}`,
    index: i,
  }));
}

export function TableOfContents({ content, onClose }: Props) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    setHeadings(parseHeadings(content));
  }, [content]);

  // Track which heading is visible using IntersectionObserver
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const editor = document.querySelector('[contenteditable="true"]');
    if (!editor) return;
    const els = editor.querySelectorAll('h1, h2, h3');
    if (!els.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const i = Array.from(els).indexOf(entry.target as Element);
            if (i !== -1) setActiveIdx(i);
          }
        }
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headings]);

  const goTo = (index: number) => {
    const editor = document.querySelector('[contenteditable="true"]');
    if (!editor) return;
    const el = editor.querySelectorAll('h1, h2, h3')[index] as HTMLElement;
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveIdx(index);
  };

  return (
    <div className="w-52 flex-shrink-0 bg-[#111113] border-r border-[#1F1F23] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#1F1F23] flex-shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-[#6366F1]" />
          <span className="text-white text-xs font-semibold">Contents</span>
        </div>
        <button
          onClick={onClose}
          className="p-0.5 text-[#52525B] hover:text-white transition-colors rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2">
        {headings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center gap-2">
            <BookOpen className="w-5 h-5 text-[#2a2a2e]" />
            <p className="text-[#3F3F46] text-[10px] leading-relaxed">
              Add H1, H2, or H3 headings and they'll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-px">
            {headings.map((h, i) => (
              <button
                key={i}
                onClick={() => goTo(h.index)}
                style={{ paddingLeft: `${8 + (h.level - 1) * 12}px` }}
                className={`w-full text-left py-1.5 pr-2 flex items-center gap-1.5 transition-all ${
                  activeIdx === h.index
                    ? 'text-[#A5B4FC] bg-[#6366F1]/10'
                    : 'text-[#52525B] hover:text-[#A1A1AA] hover:bg-[#18181B]'
                }`}
              >
                {activeIdx === h.index
                  ? <ChevronRight className="w-2.5 h-2.5 flex-shrink-0 text-[#6366F1]" />
                  : <span className="w-2.5 flex-shrink-0" />
                }
                <span
                  className={`leading-snug truncate ${
                    h.level === 1 ? 'font-semibold text-[11px]' :
                    h.level === 2 ? 'font-medium text-[11px]' :
                    'text-[10px]'
                  }`}
                >
                  {h.text}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
