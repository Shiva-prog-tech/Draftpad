import {
  Sparkles, Files, Plus, LayoutTemplate, Search, Command,
  FileText, BookOpen, GitBranch, Terminal, Link2, MessageSquare,
  Clock, Maximize2, Share2, Wand2, Rocket, Compass, CircleDot,
  Download, PenLine,
} from 'lucide-react';
import type { TourDefinition, TourSurface } from './types';

const ic = 'h-4 w-4 text-white';

/**
 * Two guided tours — one per surface. Each spotlights a `data-tour` anchor and
 * explains the tool in a sentence or two. The first and last steps are
 * target-less (centered) hero/outro cards.
 */
export const TOURS: Record<TourSurface, TourDefinition> = {
  dashboard: {
    label: 'Workspace tour',
    steps: [
      {
        icon: <Compass className={ic} />,
        eyebrow: 'Welcome to Draftpad',
        title: 'Take the grand tour',
        body: (
          <>
            Draftpad is your local-first workspace for writing, AI drafting and live
            collaboration. This quick walkthrough shows where every tool lives —
            it takes about <span className="text-white">30 seconds</span>.
          </>
        ),
      },
      {
        target: 'dash-nav',
        icon: <Files className={ic} />,
        eyebrow: 'Navigation',
        title: 'Filter your workspace',
        body: 'Switch between All documents, the ones you own, and those shared with you. The indicator glides to your active view.',
        placement: 'right',
        optional: true,
      },
      {
        target: 'dash-new',
        icon: <Plus className={ic} />,
        eyebrow: 'Create',
        title: 'Start a blank document',
        body: 'Spin up a fresh document and drop straight into the editor — autosaved and ready to share.',
        placement: 'bottom',
      },
      {
        target: 'dash-templates',
        icon: <LayoutTemplate className={ic} />,
        eyebrow: 'Template Studio',
        title: 'Templates & AI generation',
        body: (
          <>
            One door to four ways to start: a <span className="text-white">curated gallery</span>,
            <span className="text-white"> AI-generated documents</span>, full
            <span className="text-white"> AI slide decks</span>, and your own
            <span className="text-white"> saved templates</span>.
          </>
        ),
        placement: 'bottom',
      },
      {
        target: 'dash-search',
        icon: <Search className={ic} />,
        eyebrow: 'Search',
        title: 'Find anything instantly',
        body: 'Full-text search runs across every title and body as you type — matches are highlighted in the results.',
        placement: 'bottom',
      },
      {
        target: 'dash-cmdk',
        icon: <Command className={ic} />,
        eyebrow: 'Power user',
        title: 'The command palette',
        body: 'Press this anywhere to jump to any document or create a new one — never lift your hands off the keyboard.',
        placement: 'bottom',
        kbd: '⌘K',
      },
      {
        target: 'dash-card',
        icon: <FileText className={ic} />,
        eyebrow: 'Your documents',
        title: 'Open, share or reuse',
        body: 'Click a card to open it. Hover and use the ⋯ menu to save it as a template, or delete it. Avatars show who else is collaborating.',
        placement: 'auto',
        optional: true,
      },
      {
        target: 'dash-account',
        icon: <CircleDot className={ic} />,
        eyebrow: 'You',
        title: 'Status & account',
        body: 'Your live online/offline status sits here — Draftpad keeps working offline and syncs when you reconnect. Sign out from the same place.',
        placement: 'right',
        optional: true,
      },
      {
        icon: <Rocket className={ic} />,
        eyebrow: "You're all set",
        title: 'Open a document to keep going',
        body: (
          <>
            Inside the editor you'll find AI writing, diagrams, version history and
            more. Replay this tour anytime from the <span className="text-white">Tour</span> button
            in the corner.
          </>
        ),
      },
    ],
  },

  editor: {
    label: 'Editor tour',
    steps: [
      {
        icon: <Compass className={ic} />,
        eyebrow: 'The editor',
        title: 'Meet your writing workspace',
        body: (
          <>
            Every tool you need to write, format, review and ship a document lives on
            this screen. Here's a one-minute pass over all of them.
          </>
        ),
      },
      {
        target: 'editor-title',
        icon: <PenLine className={ic} />,
        eyebrow: 'Title',
        title: 'Name it — it autosaves',
        body: 'Type your document title here. It saves automatically a moment after you stop typing; the little spinner confirms it.',
        placement: 'bottom',
      },
      {
        target: 'editor-canvas',
        icon: <Wand2 className={ic} />,
        eyebrow: 'The canvas',
        title: 'Write, slash & select',
        body: (
          <>
            Just start writing. Type <span className="rounded bg-white/10 px-1 font-mono text-[11px] text-white">/</span> for
            the block menu — headings, lists, tables, code, callouts, diagrams, doc links
            and <span className="text-white">AI Write</span>. Select any text to get
            inline AI rewrite, summarize and comment actions.
          </>
        ),
        placement: 'auto',
        kbd: '/',
        pad: 4,
      },
      {
        target: 'tool-contents',
        icon: <BookOpen className={ic} />,
        eyebrow: 'Outline',
        title: 'Table of contents',
        body: 'Open a live outline built from your headings, and jump between sections in long documents.',
        placement: 'bottom',
      },
      {
        target: 'tool-diagrams',
        icon: <GitBranch className={ic} />,
        eyebrow: 'Visuals',
        title: 'Render diagrams',
        body: 'Turn Mermaid code in your document into flowcharts, sequence and ER diagrams — rendered live in a panel.',
        placement: 'bottom',
      },
      {
        target: 'tool-run',
        icon: <Terminal className={ic} />,
        eyebrow: 'Execute',
        title: 'Run code blocks',
        body: 'Run the code blocks in your document and see their output inline — great for runnable docs and snippets.',
        placement: 'bottom',
      },
      {
        target: 'tool-links',
        icon: <Link2 className={ic} />,
        eyebrow: 'Knowledge graph',
        title: 'Backlinks',
        body: 'See every other document that links to this one, so your notes stay connected both ways.',
        placement: 'bottom',
      },
      {
        target: 'tool-review',
        icon: <Sparkles className={ic} />,
        eyebrow: 'AI',
        title: 'AI document review',
        body: 'Get an AI critique of clarity, structure and tone for the whole document — with concrete suggestions.',
        placement: 'bottom',
      },
      {
        target: 'tool-status',
        icon: <CircleDot className={ic} />,
        eyebrow: 'Workflow',
        title: 'Track the status',
        body: 'Move the document through Draft → In Review → Approved so collaborators always know where it stands.',
        placement: 'bottom',
      },
      {
        target: 'tool-export',
        icon: <Download className={ic} />,
        eyebrow: 'Export',
        title: 'Markdown & PDF',
        body: 'Download a clean Markdown file, or print and save the document to PDF — formatting preserved.',
        placement: 'bottom',
      },
      {
        target: 'tool-comments',
        icon: <MessageSquare className={ic} />,
        eyebrow: 'Discuss',
        title: 'Comments',
        body: 'Leave threaded comments on the document — and on specific passages by selecting text first.',
        placement: 'bottom',
      },
      {
        target: 'tool-history',
        icon: <Clock className={ic} />,
        eyebrow: 'Time travel',
        title: 'Version history',
        body: 'Snapshot the document and restore any earlier version. Nothing you write is ever truly lost.',
        placement: 'bottom',
      },
      {
        target: 'tool-focus',
        icon: <Maximize2 className={ic} />,
        eyebrow: 'Deep work',
        title: 'Focus mode',
        body: 'Hide every panel and bar for a distraction-free canvas. Press Esc to come back.',
        placement: 'bottom',
        kbd: 'Esc',
      },
      {
        target: 'tool-share',
        icon: <Share2 className={ic} />,
        eyebrow: 'Collaborate',
        title: 'Share & co-edit',
        body: 'Invite people as viewers or editors. Edits sync live and offline changes merge automatically when you reconnect.',
        placement: 'bottom',
      },
      {
        icon: <Rocket className={ic} />,
        eyebrow: 'Happy writing',
        title: "That's the whole toolkit",
        body: (
          <>
            You've seen every tool in the editor. Replay this tour anytime from the
            <span className="text-white"> Tour</span> button in the corner.
          </>
        ),
      },
    ],
  },
};
