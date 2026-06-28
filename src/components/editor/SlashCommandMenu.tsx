'use client';
import { useEffect, useRef } from 'react';
import {
  Heading1, Heading2, Heading3, List, ListOrdered,
  Code2, Quote, Minus, Table2, AlertCircle, Sparkles, GitBranch, Link2,
} from 'lucide-react';

export interface SlashCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  { id: 'h1',      label: 'Heading 1',     description: 'Large section heading',    icon: <Heading1 className="w-4 h-4" />,    category: 'Basic blocks' },
  { id: 'h2',      label: 'Heading 2',     description: 'Medium section heading',   icon: <Heading2 className="w-4 h-4" />,    category: 'Basic blocks' },
  { id: 'h3',      label: 'Heading 3',     description: 'Small section heading',    icon: <Heading3 className="w-4 h-4" />,    category: 'Basic blocks' },
  { id: 'bullet',  label: 'Bullet List',   description: 'Unordered list',           icon: <List className="w-4 h-4" />,        category: 'Basic blocks' },
  { id: 'ordered', label: 'Numbered List', description: 'Ordered numbered list',    icon: <ListOrdered className="w-4 h-4" />, category: 'Basic blocks' },
  { id: 'quote',   label: 'Quote',         description: 'Blockquote or callout',    icon: <Quote className="w-4 h-4" />,       category: 'Basic blocks' },
  { id: 'code',    label: 'Code Block',    description: 'Monospace code block',     icon: <Code2 className="w-4 h-4" />,       category: 'Basic blocks' },
  { id: 'divider', label: 'Divider',       description: 'Horizontal rule',          icon: <Minus className="w-4 h-4" />,       category: 'Basic blocks' },
  { id: 'table',   label: 'Table',         description: 'Insert a 2×3 table',       icon: <Table2 className="w-4 h-4" />,      category: 'Advanced' },
  { id: 'callout', label: 'Callout',       description: 'Highlight important info', icon: <AlertCircle className="w-4 h-4" />,   category: 'Advanced' },
  { id: 'diagram', label: 'Diagram',        description: 'Mermaid flowchart / ERD',        icon: <GitBranch className="w-4 h-4 text-[#6366F1]" />, category: 'Advanced' },
  { id: 'link',    label: 'Link Document', description: 'Insert a link to another doc',   icon: <Link2     className="w-4 h-4 text-[#6366F1]" />, category: 'Advanced' },
  { id: 'ai',      label: 'AI Write',      description: 'Generate content with AI',        icon: <Sparkles  className="w-4 h-4 text-[#6366F1]" />, category: 'AI' },
];

interface Props {
  query: string;
  position: { x: number; y: number };
  selectedIndex: number;
  onSelect: (cmd: SlashCommand) => void;
  onIndexChange: (i: number) => void;
}

export function SlashCommandMenu({ query, position, selectedIndex, onSelect, onIndexChange }: Props) {
  const filtered = SLASH_COMMANDS.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.description.toLowerCase().includes(query.toLowerCase())
  );

  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    itemRefs.current[selectedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (filtered.length === 0) return null;

  // Clamp position so menu never overflows viewport
  const left = Math.min(position.x, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 272);
  const top  = Math.min(position.y + 8, (typeof window !== 'undefined' ? window.innerHeight : 800) - 320);

  const categories = Array.from(new Set(filtered.map(c => c.category)));

  let flatIndex = 0;

  return (
    <div
      style={{ position: 'fixed', left, top, zIndex: 60 }}
      className="w-64 bg-[#111113] border border-[#1F1F23] rounded-xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto animate-[fadeIn_0.1s_ease-out]"
    >
      {query && (
        <div className="px-3 pt-2 pb-1">
          <span className="text-[#3F3F46] text-[10px]">
            Filtering: <span className="text-[#71717A]">{query}</span>
          </span>
        </div>
      )}

      {categories.map(cat => (
        <div key={cat}>
          <div className="px-3 pt-2 pb-1 text-[#3F3F46] text-[9px] font-semibold uppercase tracking-widest">
            {cat}
          </div>
          {filtered.filter(c => c.category === cat).map(cmd => {
            const idx = flatIndex++;
            return (
              <button
                key={cmd.id}
                ref={el => { itemRefs.current[idx] = el; }}
                onMouseDown={e => { e.preventDefault(); onSelect(cmd); }}
                onMouseEnter={() => onIndexChange(idx)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  selectedIndex === idx ? 'bg-[#1F1F23]' : 'hover:bg-[#18181B]'
                }`}
              >
                <div className="w-7 h-7 bg-[#1F1F23] rounded-lg flex items-center justify-center flex-shrink-0 text-[#71717A]">
                  {cmd.icon}
                </div>
                <div>
                  <div className="text-white text-xs font-medium leading-none mb-0.5">{cmd.label}</div>
                  <div className="text-[#52525B] text-[10px] leading-none">{cmd.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
