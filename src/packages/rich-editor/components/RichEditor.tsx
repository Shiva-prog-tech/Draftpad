'use client';
import {
  useState, useRef, useCallback, useEffect,
  forwardRef, useImperativeHandle,
} from 'react';
import { EditorToolbar } from './EditorToolbar';
import { FindReplaceBar } from './FindReplaceBar';
import { LinkDialog }     from './LinkDialog';
import { useEditorFormat } from '../hooks/useEditorFormat';

// ── Public API ────────────────────────────────────────────────────────

/**
 * Props for the `<RichEditor>` component.
 *
 * @example
 * ```tsx
 * <RichEditor content={html} onChange={setHtml} placeholder="Start writing…" />
 * ```
 */
export interface RichEditorProps {
  /**
   * The current HTML content of the editor.
   * Update this value from the outside to push remote changes (e.g. Yjs sync).
   * The editor will NOT re-render if the incoming value equals its current DOM state.
   */
  content: string;

  /**
   * Called every time the user edits the document.
   * Receives the full serialized `innerHTML` of the editor.
   */
  onChange: (html: string) => void;

  /**
   * When `true`, the editor is not editable and the toolbar is hidden.
   * Use this for viewers or read-only collaborators.
   * @default false
   */
  readOnly?: boolean;

  /**
   * Placeholder text shown when the editor is empty.
   * @default 'Start writing…'
   */
  placeholder?: string;

  /**
   * Called when the user clicks the AI (✦) button in the toolbar.
   * Wire this to open your AI panel or sidebar.
   */
  onAIToggle?: () => void;

  /**
   * Called on every selection change with the currently selected plain text.
   * Useful for showing context menus or feeding selected text to an AI prompt.
   */
  onTextSelect?: (text: string) => void;
}

/**
 * Imperative handle exposed via `ref` on `<RichEditor>`.
 *
 * @example
 * ```tsx
 * const editorRef = useRef<RichEditorHandle>(null);
 * editorRef.current?.insertText('Hello from AI!');
 *
 * <RichEditor ref={editorRef} content={html} onChange={setHtml} />
 * ```
 */
export interface RichEditorHandle {
  /**
   * Inserts plain text at the current cursor position and triggers `onChange`.
   * Use this to inject AI-generated text without managing selection yourself.
   */
  insertText: (text: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────
export const RichEditor = forwardRef<RichEditorHandle, RichEditorProps>(
  function RichEditor(
    {
      content,
      readOnly = false,
      onChange,
      onAIToggle,
      onTextSelect,
      placeholder = 'Start writing…',
    },
    ref
  ) {
    const editorRef      = useRef<HTMLDivElement>(null);
    const isHighlighting = useRef(false); // suppresses onChange during find highlights

    const [showFind,    setShowFind]    = useState(false);
    const [showLink,    setShowLink]    = useState(false);
    const [linkInitial, setLinkInitial] = useState('');

    // Sync parent content into DOM (Yjs remote updates, initial load)
    useEffect(() => {
      const editor = editorRef.current;
      if (!editor || editor.innerHTML === content) return;
      editor.innerHTML = content;
    }, [content]);

    // Propagate DOM changes up to parent
    const handleInput = useCallback(() => {
      if (isHighlighting.current) return;
      const editor = editorRef.current;
      if (!editor) return;
      onChange(editor.innerHTML);
    }, [onChange]);

    // All selection management + execCommand logic
    const { formatState, handleFormat, handleEditorBlur, applyLink, removeLink } =
      useEditorFormat({
        editorRef,
        onContentChange: handleInput,
        onOpenLink: (initialUrl) => {
          setLinkInitial(initialUrl);
          setShowLink(true);
        },
      });

    // Expose insertText for parent (AI panel, etc.)
    useImperativeHandle(ref, () => ({
      insertText: (text: string) => {
        const editor = editorRef.current;
        if (!editor) return;
        editor.focus();
        document.execCommand('insertText', false, text);
        handleInput();
      },
    }), [handleInput]);

    // Keyboard shortcuts
    useEffect(() => {
      const down = (e: KeyboardEvent) => {
        const ctrl = e.ctrlKey || e.metaKey;
        if (ctrl && e.key === 'f') { e.preventDefault(); setShowFind(true); }
        if (ctrl && e.key === 'k') { e.preventDefault(); handleFormat('link'); }
        if (ctrl && e.key === 'p') { e.preventDefault(); window.print(); }
      };
      window.addEventListener('keydown', down);
      return () => window.removeEventListener('keydown', down);
    }, [handleFormat]);

    return (
      <div className="flex flex-col flex-1 min-h-0">
        <EditorToolbar
          onFormat={handleFormat}
          onAI={onAIToggle ?? (() => {})}
          onFindOpen={() => setShowFind(true)}
          formatState={formatState}
          isViewer={readOnly}
        />

        {showFind && (
          <FindReplaceBar
            editorRef={editorRef}
            isHighlighting={isHighlighting}
            onClose={() => setShowFind(false)}
          />
        )}

        <div className="flex-1 overflow-auto print:overflow-visible">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-10 h-full print:max-w-none print:px-0 print:py-0">
            <div
              ref={editorRef}
              contentEditable={!readOnly}
              suppressContentEditableWarning
              onInput={handleInput}
              onBlur={handleEditorBlur}
              onSelect={() => onTextSelect?.(window.getSelection()?.toString() || '')}
              data-placeholder={readOnly ? 'This document is read-only.' : placeholder}
              className="w-full min-h-full bg-transparent focus:outline-none editor-canvas"
              style={{ minHeight: 'calc(100vh - 200px)' }}
              spellCheck
              aria-label="Document editor"
            />
          </div>
        </div>

        {showLink && (
          <LinkDialog
            initialUrl={linkInitial}
            onConfirm={url => { applyLink(url); setShowLink(false); }}
            onRemove={() => { removeLink(); setShowLink(false); }}
            onClose={() => setShowLink(false)}
          />
        )}
      </div>
    );
  }
);
