# @draftpad/rich-editor

A portable, headless-ready rich-text editor for React. Built on `contenteditable` + the Selection/Range API — no ProseMirror, no Quill, no heavy runtime dependency.

- Full formatting toolbar (bold, italic, headings, lists, code, alignment, colors, font)
- Find & Replace with live highlighting
- Hyperlink insert/remove dialog
- Ctrl+F / Ctrl+K / Ctrl+P keyboard shortcuts
- Imperative `insertText` handle (great for AI text injection)
- CSS custom properties for zero-friction theming
- Tree-shakeable: use `RichEditor` as a complete solution, or import individual pieces

---

## Installation

```bash
npm install @draftpad/rich-editor
# peer deps (install if not already present)
npm install react react-dom lucide-react
```

---

## Quick start

### Next.js (App Router)

Import the stylesheet once in your root layout:

```tsx
// app/layout.tsx
import '@draftpad/rich-editor/styles';
```

Then use the editor in any **client** component:

```tsx
'use client';
import { useState } from 'react';
import { RichEditor } from '@draftpad/rich-editor';

export default function MyEditor() {
  const [html, setHtml] = useState('');

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <RichEditor content={html} onChange={setHtml} />
    </div>
  );
}
```

> The package outputs `"use client"` at the top of every bundle file, so Next.js automatically treats all exports as client components.

### Plain React (Vite / CRA)

```tsx
// main.tsx
import '@draftpad/rich-editor/styles';
```

```tsx
import { useState } from 'react';
import { RichEditor } from '@draftpad/rich-editor';

function App() {
  const [html, setHtml] = useState('');
  return <RichEditor content={html} onChange={setHtml} />;
}
```

---

## API

### `<RichEditor>`

The all-in-one component: toolbar + find bar + editor canvas + link dialog.

```tsx
import { RichEditor, RichEditorHandle } from '@draftpad/rich-editor';
```

#### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `content` | `string` | — | **Required.** HTML string shown in the editor. Update this from outside to push remote changes (e.g. Yjs). |
| `onChange` | `(html: string) => void` | — | **Required.** Called whenever the user edits the content. |
| `readOnly` | `boolean` | `false` | Renders a read-only view; hides the toolbar. |
| `placeholder` | `string` | `'Start writing…'` | Placeholder shown when the editor is empty. |
| `onAIToggle` | `() => void` | — | Called when the user clicks the AI (✦) toolbar button. Wire this to open your AI panel. |
| `onTextSelect` | `(text: string) => void` | — | Called on every selection change with the currently selected plain text. |

#### Ref handle (`RichEditorHandle`)

Use `ref` to imperatively insert text at the current cursor position — useful for injecting AI-generated content.

```tsx
import { useRef } from 'react';
import { RichEditor, RichEditorHandle } from '@draftpad/rich-editor';

function Page() {
  const editorRef = useRef<RichEditorHandle>(null);

  const handleAIResult = (text: string) => {
    editorRef.current?.insertText(text);
  };

  return (
    <RichEditor
      ref={editorRef}
      content={html}
      onChange={setHtml}
      onAIToggle={() => setAIPanelOpen(true)}
    />
  );
}
```

| Method | Signature | Description |
|---|---|---|
| `insertText` | `(text: string) => void` | Inserts plain text at the current cursor position and triggers `onChange`. |

---

### Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl / Cmd + B` | Bold |
| `Ctrl / Cmd + I` | Italic |
| `Ctrl / Cmd + U` | Underline |
| `Ctrl / Cmd + K` | Insert / edit hyperlink |
| `Ctrl / Cmd + F` | Open Find & Replace bar |
| `Ctrl / Cmd + P` | Print |
| `Ctrl / Cmd + Z` | Undo |
| `Ctrl / Cmd + Y` | Redo |

---

## Theming

Import the stylesheet once and override any `--re-*` variable in `:root`:

```css
/* your-app.css */
@import '@draftpad/rich-editor/styles';   /* or import in JS/TS */

:root {
  /* Colors */
  --re-text-color:        #111827;   /* body text */
  --re-heading-color:     #111827;   /* h1 / h2 / h3 */
  --re-placeholder-color: #9ca3af;   /* placeholder hint */
  --re-link-color:        #6366f1;   /* anchor tags */
  --re-accent-color:      #6366f1;   /* blockquote border, focus rings */
  --re-blockquote-color:  #6b7280;   /* blockquote text */
  --re-code-bg:           #f3f4f6;   /* inline code & pre background */
  --re-code-color:        #4f46e5;   /* inline code text */

  /* Typography */
  --re-font-family:  Inter, system-ui, sans-serif;
  --re-mono-font:    'JetBrains Mono', 'Fira Code', monospace;
  --re-font-size:    16px;
  --re-line-height:  1.8;
}
```

### Dark theme example

```css
:root {
  --re-text-color:        #F4F4F5;
  --re-heading-color:     #F4F4F5;
  --re-placeholder-color: #52525B;
  --re-link-color:        #818CF8;
  --re-accent-color:      #6366F1;
  --re-blockquote-color:  #A1A1AA;
  --re-code-bg:           #1F1F23;
  --re-code-color:        #A5B4FC;
}
```

The defaults ship as light-theme values, so you get a working editor with zero config on any white-background app.

---

## Supported format commands

The toolbar exposes these commands via `onFormat(format, value?)`.
If you build a custom toolbar using `useEditorFormat`, these are the strings to pass:

| Command | Value | Description |
|---|---|---|
| `bold` | — | Toggle bold |
| `italic` | — | Toggle italic |
| `underline` | — | Toggle underline |
| `strikethrough` | — | Toggle strikethrough |
| `superscript` | — | Toggle superscript |
| `subscript` | — | Toggle subscript |
| `clearFormat` | — | Remove all inline formatting |
| `undo` | — | Undo |
| `redo` | — | Redo |
| `h1` | — | Format block as `<h1>` |
| `h2` | — | Format block as `<h2>` |
| `h3` | — | Format block as `<h3>` |
| `bullet` | — | Unordered list |
| `ordered` | — | Ordered list |
| `quote` | — | Blockquote |
| `code` | — | Wrap selection in `<code>` |
| `alignLeft` | — | Left-align |
| `alignCenter` | — | Center |
| `alignRight` | — | Right-align |
| `alignJustify` | — | Justify |
| `foreColor` | `'#rrggbb'` | Text color (uses Range API — reliable across browsers) |
| `hiliteColor` | `'#rrggbb'` or `'transparent'` | Highlight / background color |
| `fontName` | e.g. `'Georgia, serif'` | Change font family |
| `fontSize` | e.g. `'18px'` | Change font size |
| `link` | — | Open link dialog (requires `onOpenLink` wired up) |

---

## Using individual components

All sub-components are exported separately for custom layouts.

### `<EditorToolbar>`

```tsx
import { EditorToolbar } from '@draftpad/rich-editor';

<EditorToolbar
  onFormat={(format, value) => { /* call handleFormat */ }}
  onAI={() => { /* open AI panel */ }}
  onFindOpen={() => { /* open find bar */ }}
  formatState={formatState}   // from useEditorFormat
  isViewer={false}            // hides toolbar when true
/>
```

### `<FindReplaceBar>`

```tsx
import { FindReplaceBar } from '@draftpad/rich-editor';

<FindReplaceBar
  editorRef={editorRef}           // RefObject<HTMLDivElement | null>
  isHighlighting={isHighlighting} // { current: boolean } — mutable ref
  onClose={() => setShowFind(false)}
/>
```

### `<LinkDialog>`

```tsx
import { LinkDialog } from '@draftpad/rich-editor';

<LinkDialog
  initialUrl="https://example.com"   // pre-fills if editing an existing link
  onConfirm={(url) => applyLink(url)}
  onRemove={() => removeLink()}
  onClose={() => setShowLink(false)}
/>
```

---

## `useEditorFormat` hook

Use this when you want full control over the editor DOM and toolbar layout but don't want to rewrite selection management and `execCommand` wiring.

```tsx
import { useRef } from 'react';
import { useEditorFormat, EditorToolbar } from '@draftpad/rich-editor';

function MyCustomEditor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLink, setShowLink] = useState(false);
  const [linkInitial, setLinkInitial] = useState('');

  const { formatState, handleFormat, handleEditorBlur, applyLink, removeLink } =
    useEditorFormat({
      editorRef,
      onContentChange: () => {
        onChange(editorRef.current?.innerHTML ?? '');
      },
      onOpenLink: (initialUrl) => {
        setLinkInitial(initialUrl);
        setShowLink(true);
      },
    });

  return (
    <>
      <EditorToolbar
        onFormat={handleFormat}
        onAI={() => {}}
        onFindOpen={() => {}}
        formatState={formatState}
      />
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleEditorBlur}
        className="editor-canvas"
      />
      {showLink && (
        <LinkDialog
          initialUrl={linkInitial}
          onConfirm={(url) => { applyLink(url); setShowLink(false); }}
          onRemove={() => { removeLink(); setShowLink(false); }}
          onClose={() => setShowLink(false)}
        />
      )}
    </>
  );
}
```

#### `useEditorFormat` options

| Option | Type | Description |
|---|---|---|
| `editorRef` | `RefObject<HTMLDivElement \| null>` | Ref attached to your `contenteditable` div. |
| `onContentChange` | `() => void` | Called after every formatting operation that mutates the DOM. |
| `onOpenLink` | `(initialUrl: string) => void` | Called when the user triggers the link command. Open your link dialog here. |

#### `useEditorFormat` return value

| Value | Type | Description |
|---|---|---|
| `formatState` | `FormatState` | Current selection's font, size, text color, highlight color. |
| `handleFormat` | `(format: string, value?: string) => void` | Applies a format command. |
| `handleEditorBlur` | `() => void` | Saves selection on blur. Attach to `onBlur` of your `contenteditable`. |
| `applyLink` | `(url: string) => void` | Creates a hyperlink from the saved selection. |
| `removeLink` | `() => void` | Removes the hyperlink at the saved selection. |

#### `FormatState`

```ts
interface FormatState {
  fontFamily: string;   // current font family at cursor
  fontSize:   string;   // current font size at cursor
  textColor:  string;   // current text color at cursor
  hlColor:    string;   // current highlight color at cursor
}
```

---

## TypeScript

All types are bundled. No `@types/` package needed.

```ts
import type {
  RichEditorProps,
  RichEditorHandle,
  FormatState,
} from '@draftpad/rich-editor';
```

---

## Requirements

| Peer dependency | Version |
|---|---|
| `react` | `>= 18` |
| `react-dom` | `>= 18` |
| `lucide-react` | `>= 0.300.0` |

---

## License

MIT — © DraftPad
