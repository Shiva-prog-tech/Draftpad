'use client';
import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code2, Sparkles,
  Undo2, Redo2, RemoveFormatting, Link,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Superscript, Subscript, Search,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────
interface FormatState {
  fontFamily: string;
  fontSize:   string;
  textColor:  string;
  hlColor:    string;
}

interface Props {
  onFormat:    (format: string, value?: string) => void;
  onAI:        () => void;
  onFindOpen:  () => void;
  formatState: FormatState;
  isViewer?:   boolean;
}

// ── Constants ─────────────────────────────────────────────────────────
const FONTS = [
  { label: 'Inter',            value: 'Inter, system-ui, sans-serif' },
  { label: 'Georgia',          value: 'Georgia, serif' },
  { label: 'Times New Roman',  value: "'Times New Roman', Times, serif" },
  { label: 'Arial',            value: 'Arial, Helvetica, sans-serif' },
  { label: 'Courier New',      value: "'Courier New', Courier, monospace" },
  { label: 'Mono',             value: "'JetBrains Mono', 'Fira Code', monospace" },
];

const SIZES = ['10', '11', '12', '13', '14', '16', '18', '20', '24', '28', '32', '36', '48', '64', '72'];

const COLORS = [
  '#ffffff','#a1a1aa','#71717a','#52525b','#3f3f46','#27272a','#18181b','#000000',
  '#ef4444','#f97316','#eab308','#22c55e','#06b6d4','#3b82f6','#6366f1','#a855f7','#ec4899','#f43f5e',
];
const HIGHLIGHTS = [
  'transparent',
  '#fef08a','#bbf7d0','#bae6fd','#e9d5ff','#fce7f3','#fed7aa','#fecaca','#d1d5db',
];

// ── Sub-components ────────────────────────────────────────────────────
function Sep() {
  return <div className="w-px h-4 bg-[#232329] mx-0.5 flex-shrink-0" />;
}

function TBtn({
  onClick, title, children, active = false,
}: {
  onClick: () => void; title: string; children: React.ReactNode; active?: boolean;
}) {
  return (
    <button
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`w-7 h-7 flex items-center justify-center rounded transition-colors flex-shrink-0 ${
        active
          ? 'bg-[#6366F1]/20 text-[#818CF8]'
          : 'text-[#71717A] hover:text-white hover:bg-[#1F1F23]'
      }`}
    >
      {children}
    </button>
  );
}

function ColorPicker({
  value, colors, title, isHighlight = false, onChange,
}: {
  value: string; colors: string[]; title: string;
  isHighlight?: boolean; onChange: (c: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0 });
  const popRef   = useRef<HTMLDivElement>(null);
  const btnRef   = useRef<HTMLButtonElement>(null);
  const savedSel = useRef<Range | null>(null);

  const saveEditorSel = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) savedSel.current = sel.getRangeAt(0).cloneRange();
  };
  const restoreEditorSel = () => {
    if (!savedSel.current) return;
    const sel = window.getSelection();
    if (sel) { sel.removeAllRanges(); sel.addRange(savedSel.current.cloneRange()); }
  };

  // Close when clicking outside both the button and the popover
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (
        popRef.current && !popRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const icon = isHighlight ? (
    <span className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] font-bold leading-none text-[#A1A1AA]">A</span>
      <span className="w-3.5 h-1 rounded-sm" style={{ background: value && value !== 'transparent' ? value : '#FBBF24' }} />
    </span>
  ) : (
    <span className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] font-bold leading-none" style={{ color: value || '#E4E4E7' }}>A</span>
      <span className="w-3.5 h-1 rounded-sm" style={{ background: value || '#E4E4E7' }} />
    </span>
  );

  // Render the popover via a portal so overflow-x-auto on the toolbar row
  // doesn't clip it. Use fixed positioning with getBoundingClientRect coords.
  const popover = open ? createPortal(
    <div
      ref={popRef}
      style={{ position: 'fixed', top: pos.top + 4, left: pos.left, zIndex: 9999 }}
      className="bg-[#111115] border border-[#232329] rounded-lg p-2 shadow-xl"
    >
      <div className="grid grid-cols-8 gap-1" style={{ width: '164px' }}>
        {colors.map(c => (
          <button
            key={c}
            onMouseDown={e => e.preventDefault()}
            onClick={() => { restoreEditorSel(); onChange(c); setOpen(false); }}
            className="w-4 h-4 rounded-sm border border-[#2a2a30] hover:scale-110 transition-transform flex-shrink-0"
            style={{
              background: c === 'transparent'
                ? 'repeating-linear-gradient(45deg,#3f3f46 0,#3f3f46 2px,transparent 0,transparent 50%) / 6px 6px'
                : c,
            }}
            title={c}
          />
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-[#232329] flex items-center gap-1.5">
        <span className="text-[10px] text-[#52525B]">Custom</span>
        <input
          type="color"
          defaultValue={value && value !== 'transparent' ? value : '#ffffff'}
          onChange={e => onChange(e.target.value)}
          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
        />
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="flex-shrink-0">
      <button
        ref={btnRef}
        onMouseDown={e => {
          saveEditorSel(); // capture selection before anything can clear it
          e.preventDefault(); // keep editor focus + selection intact
          const rect = e.currentTarget.getBoundingClientRect();
          setPos({ top: rect.bottom, left: rect.left });
          setOpen(v => !v);
        }}
        title={title}
        className="w-7 h-7 flex items-center justify-center rounded text-[#71717A] hover:text-white hover:bg-[#1F1F23] transition-colors"
      >
        {icon}
      </button>
      {popover}
    </div>
  );
}

// ── Main toolbar ──────────────────────────────────────────────────────
export function EditorToolbar({ onFormat, onAI, onFindOpen, formatState, isViewer }: Props) {
  // Hooks must always run unconditionally — before any early return.
  const [bold,      setBold]      = useState(false);
  const [italic,    setItalic]    = useState(false);
  const [underline, setUnderline] = useState(false);

  useEffect(() => {
    if (isViewer) return;
    const update = () => {
      try {
        setBold(document.queryCommandState('bold'));
        setItalic(document.queryCommandState('italic'));
        setUnderline(document.queryCommandState('underline'));
      } catch {}
    };
    document.addEventListener('selectionchange', update);
    return () => document.removeEventListener('selectionchange', update);
  }, [isViewer]);

  if (isViewer) {
    return (
      <div className="h-10 border-b border-[#1F1F23] flex items-center px-4 flex-shrink-0">
        <span className="text-[#52525B] text-xs flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#52525B]" />
          Viewing — read-only access
        </span>
      </div>
    );
  }

  const row = 'flex items-center px-3 gap-0.5 flex-shrink-0 overflow-x-auto';
  const rowH = 'h-9 border-b border-[#1F1F23]';

  return (
    <div className="flex flex-col flex-shrink-0">
      {/* ── Row 1: History · Typography · Colors · Inline ── */}
      <div className={`${row} ${rowH}`}>
        {/* History */}
        <TBtn onClick={() => onFormat('undo')} title="Undo (Ctrl+Z)"><Undo2 className="w-3.5 h-3.5" /></TBtn>
        <TBtn onClick={() => onFormat('redo')} title="Redo (Ctrl+Y)"><Redo2 className="w-3.5 h-3.5" /></TBtn>
        <TBtn onClick={() => onFormat('clearFormat')} title="Clear formatting">
          <RemoveFormatting className="w-3.5 h-3.5" />
        </TBtn>

        <Sep />

        {/* Font family */}
        <select
          value={formatState.fontFamily}
          onChange={e => onFormat('fontName', e.target.value)}
          className="bg-transparent text-[#A1A1AA] text-xs border-0 outline-none cursor-pointer h-7 pl-1 pr-4 max-w-[96px] flex-shrink-0 rounded hover:bg-[#1F1F23] transition-colors"
          title="Font family"
        >
          {FONTS.map(f => (
            <option key={f.value} value={f.value} style={{ background: '#111113', fontFamily: f.value }}>
              {f.label}
            </option>
          ))}
        </select>

        <Sep />

        {/* Font size */}
        <select
          value={formatState.fontSize.replace('px', '')}
          onChange={e => onFormat('fontSize', e.target.value + 'px')}
          className="bg-transparent text-[#A1A1AA] text-xs border-0 outline-none cursor-pointer h-7 px-1 w-12 flex-shrink-0 rounded hover:bg-[#1F1F23] transition-colors"
          title="Font size"
        >
          {SIZES.map(s => (
            <option key={s} value={s} style={{ background: '#111113' }}>{s}</option>
          ))}
        </select>

        <Sep />

        {/* Colors */}
        <ColorPicker
          value={formatState.textColor}
          colors={COLORS}
          title="Text color"
          onChange={c => onFormat('foreColor', c)}
        />
        <ColorPicker
          value={formatState.hlColor}
          colors={HIGHLIGHTS}
          title="Highlight color"
          isHighlight
          onChange={c => onFormat('hiliteColor', c)}
        />

        <Sep />

        {/* Inline */}
        <TBtn onClick={() => onFormat('bold')}      title="Bold (Ctrl+B)"      active={bold}><Bold className="w-3.5 h-3.5" /></TBtn>
        <TBtn onClick={() => onFormat('italic')}    title="Italic (Ctrl+I)"    active={italic}><Italic className="w-3.5 h-3.5" /></TBtn>
        <TBtn onClick={() => onFormat('underline')} title="Underline (Ctrl+U)" active={underline}><Underline className="w-3.5 h-3.5" /></TBtn>
        <TBtn onClick={() => onFormat('strikethrough')} title="Strikethrough"><Strikethrough className="w-3.5 h-3.5" /></TBtn>
        <TBtn onClick={() => onFormat('superscript')} title="Superscript"><Superscript className="w-3.5 h-3.5" /></TBtn>
        <TBtn onClick={() => onFormat('subscript')}   title="Subscript"><Subscript className="w-3.5 h-3.5" /></TBtn>
      </div>

      {/* ── Row 2: Alignment · Headings · Lists · Link · Find · AI ── */}
      <div className={`${row} ${rowH}`}>
        {/* Alignment */}
        <TBtn onClick={() => onFormat('alignLeft')}    title="Align left"><AlignLeft className="w-3.5 h-3.5" /></TBtn>
        <TBtn onClick={() => onFormat('alignCenter')}  title="Align center"><AlignCenter className="w-3.5 h-3.5" /></TBtn>
        <TBtn onClick={() => onFormat('alignRight')}   title="Align right"><AlignRight className="w-3.5 h-3.5" /></TBtn>
        <TBtn onClick={() => onFormat('alignJustify')} title="Justify"><AlignJustify className="w-3.5 h-3.5" /></TBtn>

        <Sep />

        {/* Headings */}
        <TBtn onClick={() => onFormat('h1')} title="Heading 1"><Heading1 className="w-3.5 h-3.5" /></TBtn>
        <TBtn onClick={() => onFormat('h2')} title="Heading 2"><Heading2 className="w-3.5 h-3.5" /></TBtn>
        <TBtn onClick={() => onFormat('h3')} title="Heading 3"><Heading3 className="w-3.5 h-3.5" /></TBtn>

        <Sep />

        {/* Lists & blocks */}
        <TBtn onClick={() => onFormat('bullet')}  title="Bullet list"><List className="w-3.5 h-3.5" /></TBtn>
        <TBtn onClick={() => onFormat('ordered')} title="Ordered list"><ListOrdered className="w-3.5 h-3.5" /></TBtn>
        <TBtn onClick={() => onFormat('quote')}   title="Blockquote"><Quote className="w-3.5 h-3.5" /></TBtn>
        <TBtn onClick={() => onFormat('code')}    title="Code"><Code2 className="w-3.5 h-3.5" /></TBtn>

        <Sep />

        {/* Link */}
        <TBtn onClick={() => onFormat('link')} title="Insert link (Ctrl+K)"><Link className="w-3.5 h-3.5" /></TBtn>

        <Sep />

        {/* Find */}
        <TBtn onClick={onFindOpen} title="Find & Replace (Ctrl+F)"><Search className="w-3.5 h-3.5" /></TBtn>

        <Sep />

        {/* AI */}
        <button
          onMouseDown={e => e.preventDefault()}
          onClick={onAI}
          className="flex items-center gap-1.5 h-7 px-2.5 rounded text-[#6366F1] hover:bg-[#6366F1]/10 border border-transparent hover:border-[#6366F1]/20 transition-all text-xs font-medium flex-shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">AI Assist</span>
        </button>
      </div>
    </div>
  );
}
