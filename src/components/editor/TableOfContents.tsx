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
    <div className="flex w-52 flex-shrink-0 flex-col overflow-hidden border-r border-line bg-[#0E0E10]/60 backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-line px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-grad shadow-glow-accent-sm">
            <BookOpen className="h-3 w-3 text-white" />
          </div>
          <span className="text-xs font-semibold text-white">Contents</span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-1 text-txt-muted transition-all duration-200 hover:rotate-90 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* List */}
      <div className="premium-scroll flex-1 overflow-y-auto py-2">
        {headings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
            <BookOpen className="h-5 w-5 text-[#2a2a2e]" />
            <p className="text-[10px] leading-relaxed text-[#3F3F46]">
              Add H1, H2, or H3 headings and they&apos;ll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-px">
            {headings.map((h, i) => {
              const active = activeIdx === h.index;
              return (
                <button
                  key={i}
                  onClick={() => goTo(h.index)}
                  style={{ paddingLeft: `${8 + (h.level - 1) * 12}px` }}
                  className={`flex w-full items-center gap-1.5 py-1.5 pr-2 text-left transition-all ${
                    active ? 'bg-accent-grad-soft text-[#A5B4FC]' : 'text-txt-muted hover:bg-white/[0.04] hover:text-txt-secondary'
                  }`}
                >
                  {active
                    ? <ChevronRight className="h-2.5 w-2.5 flex-shrink-0 text-accent" />
                    : <span className="w-2.5 flex-shrink-0" />}
                  <span
                    className={`truncate leading-snug ${
                      h.level === 1 ? 'text-[11px] font-semibold' :
                      h.level === 2 ? 'text-[11px] font-medium' :
                      'text-[10px]'
                    }`}
                  >
                    {h.text}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
