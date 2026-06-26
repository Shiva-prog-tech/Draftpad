'use client';
import { useState, useRef, useCallback, useEffect, RefObject } from 'react';

/**
 * Snapshot of the formatting state at the current cursor position.
 * Updated on every `selectionchange` event.
 */
export interface FormatState {
  /** CSS font-family string of the text at the cursor, e.g. `'Georgia, serif'` */
  fontFamily: string;
  /** Font size at the cursor as a bare number string, e.g. `'16'` */
  fontSize:   string;
  /** Text (foreground) color at the cursor as a hex string, e.g. `'#E4E4E7'` */
  textColor:  string;
  /** Highlight (background) color at the cursor, or `'transparent'` when unset */
  hlColor:    string;
}

/**
 * Options passed to {@link useEditorFormat}.
 */
interface Options {
  /** Ref attached to the `contenteditable` div that the hook manages. */
  editorRef:       RefObject<HTMLDivElement | null>;
  /** Called after every formatting operation that mutates the DOM. Use this to push the new HTML to your state or sync layer. */
  onContentChange: () => void;
  /**
   * Called when the user triggers the link command.
   * Receives the existing href if the cursor is inside an anchor, otherwise an empty string.
   * Open your link dialog here, then call `applyLink` or `removeLink` when done.
   */
  onOpenLink:      (initialUrl: string) => void;
}

/**
 * Manages selection, format state, and all `execCommand` / Range API formatting
 * for a `contenteditable` editor div.
 *
 * Use this hook when you want full control over the editor layout but don't want
 * to rewrite selection-save/restore, color application, or link management.
 *
 * @example
 * ```tsx
 * const { formatState, handleFormat, handleEditorBlur, applyLink, removeLink } =
 *   useEditorFormat({
 *     editorRef,
 *     onContentChange: () => onChange(editorRef.current?.innerHTML ?? ''),
 *     onOpenLink: (url) => { setLinkUrl(url); setShowLink(true); },
 *   });
 * ```
 */
export function useEditorFormat({ editorRef, onContentChange, onOpenLink }: Options) {
  const savedRange = useRef<Range | null>(null);

  // ── Toolbar format state ──────────────────────────────────────────
  const [formatState, setFormatState] = useState<FormatState>({
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize:   '16',
    textColor:  '#E4E4E7',
    hlColor:    'transparent',
  });

  useEffect(() => {
    const update = () => {
      const sel = window.getSelection();
      if (!sel || !editorRef.current?.contains(sel.anchorNode)) return;
      try {
        setFormatState({
          fontFamily: document.queryCommandValue('fontName') || 'Inter, system-ui, sans-serif',
          fontSize:   document.queryCommandValue('fontSize') || '16',
          textColor:  document.queryCommandValue('foreColor') || '#E4E4E7',
          hlColor:    document.queryCommandValue('backColor') || 'transparent',
        });
      } catch {}
    };
    document.addEventListener('selectionchange', update);
    return () => document.removeEventListener('selectionchange', update);
  }, [editorRef]);

  // ── Selection save / restore ──────────────────────────────────────
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  }, [editorRef]);

  const restoreSelectionAndFocus = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    // Skip when editor already owns focus — calling focus() on an already-focused
    // contenteditable can silently collapse the selection in some Chrome paths.
    const editorHasFocus =
      document.activeElement === editor || editor.contains(document.activeElement);
    if (editorHasFocus) return;
    editor.focus();
    if (savedRange.current) {
      const sel = window.getSelection();
      if (sel) { sel.removeAllRanges(); sel.addRange(savedRange.current.cloneRange()); }
    }
  }, [editorRef]);

  const handleEditorBlur = useCallback(() => { saveSelection(); }, [saveSelection]);

  // ── Format handler ────────────────────────────────────────────────
  const handleFormat = useCallback((format: string, value?: string) => {
    restoreSelectionAndFocus();

    switch (format) {
      case 'bold':          document.execCommand('bold'); break;
      case 'italic':        document.execCommand('italic'); break;
      case 'underline':     document.execCommand('underline'); break;
      case 'strikethrough': document.execCommand('strikeThrough'); break;
      case 'superscript':   document.execCommand('superscript'); break;
      case 'subscript':     document.execCommand('subscript'); break;
      case 'clearFormat':   document.execCommand('removeFormat'); break;
      case 'undo':          document.execCommand('undo'); break;
      case 'redo':          document.execCommand('redo'); break;

      case 'h1':      document.execCommand('formatBlock', false, 'h1'); break;
      case 'h2':      document.execCommand('formatBlock', false, 'h2'); break;
      case 'h3':      document.execCommand('formatBlock', false, 'h3'); break;
      case 'bullet':  document.execCommand('insertUnorderedList'); break;
      case 'ordered': document.execCommand('insertOrderedList'); break;
      case 'quote':   document.execCommand('formatBlock', false, 'blockquote'); break;

      case 'code': {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
          const range = sel.getRangeAt(0);
          const code  = document.createElement('code');
          try { range.surroundContents(code); }
          catch { document.execCommand('insertHTML', false, `<code>${sel.toString()}</code>`); }
        } else {
          document.execCommand('insertHTML', false, '<code>​</code>');
        }
        break;
      }

      case 'alignLeft':    document.execCommand('justifyLeft'); break;
      case 'alignCenter':  document.execCommand('justifyCenter'); break;
      case 'alignRight':   document.execCommand('justifyRight'); break;
      case 'alignJustify': document.execCommand('justifyFull'); break;

      case 'foreColor': {
        if (!value) break;
        const cSel = window.getSelection();
        if (!cSel || !cSel.rangeCount) break;
        const cRange = cSel.getRangeAt(0);
        if (cRange.collapsed) { document.execCommand('foreColor', false, value); break; }
        const cFrag = cRange.extractContents();
        const cSpan = document.createElement('span');
        cSpan.style.color = value;
        cSpan.appendChild(cFrag);
        cRange.insertNode(cSpan);
        cRange.selectNodeContents(cSpan);
        cSel.removeAllRanges(); cSel.addRange(cRange);
        break;
      }

      case 'hiliteColor': {
        if (!value) break;
        const hSel = window.getSelection();
        if (!hSel || !hSel.rangeCount) break;
        const hRange = hSel.getRangeAt(0);
        if (hRange.collapsed) break;
        const hFrag = hRange.extractContents();
        const hSpan = document.createElement('span');
        if (value !== 'transparent') hSpan.style.backgroundColor = value;
        hSpan.appendChild(hFrag);
        hRange.insertNode(hSpan);
        hRange.selectNodeContents(hSpan);
        hSel.removeAllRanges(); hSel.addRange(hRange);
        break;
      }

      case 'fontName': {
        if (!value) break;
        restoreSelectionAndFocus();
        document.execCommand('fontName', false, value);
        break;
      }

      case 'fontSize': {
        if (!value) break;
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) break;
        const range = sel.getRangeAt(0);
        if (range.collapsed) break;
        const frag = range.extractContents();
        const span = document.createElement('span');
        span.style.fontSize = value;
        span.appendChild(frag);
        range.insertNode(span);
        range.selectNodeContents(span);
        sel.removeAllRanges(); sel.addRange(range);
        break;
      }

      case 'link': {
        saveSelection();
        const sel = window.getSelection();
        let initial = '';
        if (sel && sel.rangeCount > 0) {
          const node   = sel.anchorNode;
          const anchor = node instanceof HTMLAnchorElement
            ? node
            : (node?.parentElement?.closest('a') as HTMLAnchorElement | null);
          if (anchor) initial = anchor.href;
        }
        onOpenLink(initial);
        return; // early return — skip onContentChange
      }
    }

    onContentChange();
  }, [restoreSelectionAndFocus, saveSelection, onContentChange, onOpenLink]);

  // ── Link apply / remove ───────────────────────────────────────────
  const applyLink = useCallback((url: string) => {
    restoreSelectionAndFocus();
    document.execCommand('createLink', false, url);
    editorRef.current?.querySelectorAll('a:not([target])').forEach(a => {
      (a as HTMLAnchorElement).target = '_blank';
      (a as HTMLAnchorElement).rel    = 'noopener noreferrer';
    });
    onContentChange();
  }, [restoreSelectionAndFocus, editorRef, onContentChange]);

  const removeLink = useCallback(() => {
    restoreSelectionAndFocus();
    document.execCommand('unlink');
    onContentChange();
  }, [restoreSelectionAndFocus, onContentChange]);

  return { formatState, handleFormat, handleEditorBlur, applyLink, removeLink };
}
