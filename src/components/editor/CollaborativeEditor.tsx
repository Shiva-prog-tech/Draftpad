'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Share2, Clock, WifiOff, CheckCircle2, Loader2,
  MessageSquare, GitBranch, Download, ChevronDown,
  BookOpen, Maximize2, Minimize2, Sparkles,
  Printer, Terminal, Link2,
} from 'lucide-react';
import { useDocument, useVersionHistory } from '@/hooks/useDocument';
import { SyncBar }            from '@/components/editor/SyncBar';
import { ShareModal }         from '@/components/editor/ShareModal';
import { VersionPanel }       from '@/components/editor/VersionPanel';
import { AIPanel }            from '@/components/editor/AIPanel';
import { AISelectionPopup }   from '@/components/editor/AISelectionPopup';
import { SlashCommandMenu, SLASH_COMMANDS, type SlashCommand } from '@/components/editor/SlashCommandMenu';
import { CommentsPanel }      from '@/components/editor/CommentsPanel';
import { MermaidPanel }       from '@/components/editor/MermaidPanel';
import { TableOfContents }   from '@/components/editor/TableOfContents';
import { AIReviewPanel }     from '@/components/editor/AIReviewPanel';
import { CodeRunnerPanel }   from '@/components/editor/CodeRunnerPanel';
import { BacklinksPanel }    from '@/components/editor/BacklinksPanel';
import { printDocument }     from '@/lib/pdf-export';
import { RichEditor, RichEditorHandle } from '@/packages/rich-editor';
import { encodeState } from '@/lib/crdt/yjs-utils';
import { TEMPLATES } from '@/lib/templates';
import { downloadMarkdown } from '@/lib/markdown-export';
import { Document, SyncStatus, WorkflowStatus } from '@/types';

interface Props { doc: Document; templateId?: string; }

const WORKFLOW_CONFIG: Record<WorkflowStatus, { label: string; color: string; bg: string; ring: string }> = {
  draft:    { label: 'Draft',       color: '#71717A', bg: '#1F1F23', ring: '#3F3F46' },
  review:   { label: 'In Review',   color: '#F59E0B', bg: '#2D2006', ring: '#92400E' },
  approved: { label: 'Approved',    color: '#10B981', bg: '#052E1C', ring: '#065F46' },
};

const syncIcon = (status: SyncStatus, online: boolean) => {
  if (!online || status === 'offline') return <WifiOff className="w-3.5 h-3.5 text-amber-500" />;
  if (status === 'syncing') return <Loader2 className="w-3.5 h-3.5 text-[#6366F1] animate-spin" />;
  return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
};
const syncText = (status: SyncStatus, online: boolean) =>
  !online || status === 'offline' ? 'Offline' : status === 'syncing' ? 'Syncing…' : 'Synced';

export function CollaborativeEditor({ doc, templateId }: Props) {
  const { data: session } = useSession();
  const router            = useRouter();
  const richEditorRef     = useRef<RichEditorHandle>(null);
  const statusBtnRef      = useRef<HTMLButtonElement>(null);

  const userId   = session?.user?.id || '';
  const myCollab = doc.collaborators.find(c => c.userId === userId);
  const isViewer = myCollab?.role === 'viewer';
  const online   = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const { content, wordCount, syncStatus, pendingOps, updateText, getDoc } =
    useDocument(doc._id, userId, doc.yjsState);
  const { versions, loading: versionsLoading, saveVersion, restoreVersion, refetch: refetchVersions } =
    useVersionHistory(doc._id);

  // ── UI state ───────────────────────────────────────────────────
  const [title,         setTitle]         = useState(doc.title);
  const [titleSaving,   setTitleSaving]   = useState(false);
  const [showShare,     setShowShare]     = useState(false);
  const [showVersions,  setShowVersions]  = useState(false);
  const [showAI,        setShowAI]        = useState(false);
  const [showComments,     setShowComments]     = useState(false);
  const [showMermaid,      setShowMermaid]      = useState(false);
  const [selectedText,     setSelectedText]     = useState('');
  const [showAIPopup,      setShowAIPopup]      = useState(false);
  const [pendingQuote,     setPendingQuote]     = useState('');
  const [collabList,       setCollabList]       = useState(doc.collaborators);
  const [workflowStatus,   setWorkflowStatus]   = useState<WorkflowStatus>(doc.workflowStatus ?? 'draft');
  const [statusOpen,       setStatusOpen]       = useState(false);
  const [statusSaving,     setStatusSaving]     = useState(false);
  const [showTOC,          setShowTOC]          = useState(false);
  const [zenMode,          setZenMode]          = useState(false);
  const [showReview,       setShowReview]       = useState(false);
  const [showCodeRunner,   setShowCodeRunner]   = useState(false);
  const [showBacklinks,    setShowBacklinks]    = useState(false);
  // Doc-link picker (opened via /link slash command)
  const [showDocPicker,    setShowDocPicker]    = useState(false);
  const [docPickerQuery,   setDocPickerQuery]   = useState('');
  const [docPickerList,    setDocPickerList]    = useState<{ _id: string; title: string }[]>([]);
  const [docPickerLoading, setDocPickerLoading] = useState(false);
  const zenModeRef = useRef(false);
  const titleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Slash command state ────────────────────────────────────────
  const [slashVisible, setSlashVisible] = useState(false);
  const [slashQuery,   setSlashQuery]   = useState('');
  const [slashPos,     setSlashPos]     = useState({ x: 0, y: 0 });
  const [slashIndex,   setSlashIndex]   = useState(0);
  // Refs updated synchronously so keydown handler always reads the latest value
  const slashVisibleRef = useRef(false);
  const slashQueryRef   = useRef('');

  const showSlash = useCallback((pos: { x: number; y: number }) => {
    slashVisibleRef.current = true;
    slashQueryRef.current   = '';
    setSlashPos(pos);
    setSlashQuery('');
    setSlashIndex(0);
    setSlashVisible(true);
  }, []);

  const hideSlash = useCallback(() => {
    slashVisibleRef.current = false;
    slashQueryRef.current   = '';
    setSlashVisible(false);
    setSlashQuery('');
  }, []);

  const appendSlashChar = useCallback((ch: string) => {
    const next = slashQueryRef.current + ch;
    slashQueryRef.current = next;
    setSlashQuery(next);
  }, []);

  const popSlashChar = useCallback(() => {
    const next = slashQueryRef.current.slice(0, -1);
    slashQueryRef.current = next;
    setSlashQuery(next);
  }, []);

  const toggleZenMode = useCallback(() => {
    const next = !zenModeRef.current;
    zenModeRef.current = next;
    setZenMode(next);
  }, []);

  // ── Doc-link picker (opened by /link slash command) ────────────
  const openDocLinkPicker = useCallback(async () => {
    setShowDocPicker(true);
    setDocPickerQuery('');
    setDocPickerLoading(true);
    try {
      const res  = await fetch('/api/documents');
      if (res.ok) {
        const list = await res.json();
        setDocPickerList(
          (list as { _id: string; title: string }[])
            .filter(d => d._id !== doc._id)
            .map(d => ({ _id: d._id, title: d.title || 'Untitled' }))
        );
      }
    } finally { setDocPickerLoading(false); }
  }, [doc._id]);

  const insertDocLink = useCallback((id: string, docTitle: string) => {
    setShowDocPicker(false);
    richEditorRef.current?.insertHTML(
      `<a href="/docs/${id}" data-doc-link="true" style="color:#A5B4FC;text-decoration:underline;cursor:pointer">📄 ${docTitle}</a>`
    );
  }, []);

  // ── Template pre-fill (once, when doc is empty) ────────────────
  const templateApplied = useRef(false);
  useEffect(() => {
    if (templateApplied.current || !templateId || content) return;
    const tpl = TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    templateApplied.current = true;
    setTimeout(() => { updateText(tpl.html); }, 300);
  }, [content, templateId, updateText]);

  // ── AI-generated template pre-fill (HTML stashed in sessionStorage) ──
  const aiTemplateApplied = useRef(false);
  useEffect(() => {
    if (aiTemplateApplied.current || content || typeof window === 'undefined') return;
    const key  = `ai-template-${doc._id}`;
    const html = sessionStorage.getItem(key);
    if (!html) return;
    aiTemplateApplied.current = true;
    sessionStorage.removeItem(key);
    setTimeout(() => { updateText(html); }, 300);
  }, [content, doc._id, updateText]);

  // ── Title save ─────────────────────────────────────────────────
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(async () => {
      setTitleSaving(true);
      await fetch(`/api/documents/${doc._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: e.target.value }),
      });
      setTitleSaving(false);
    }, 1000);
  };

  // ── Version helpers ────────────────────────────────────────────
  const handleSaveVersion = async (label: string) => {
    const ydoc = getDoc();
    if (!ydoc) return;
    await saveVersion(label, encodeState(ydoc));
  };

  const handleRestoreVersion = async (versionId: string) => {
    const ok = await restoreVersion(versionId);
    if (ok) router.refresh();
    return ok;
  };

  const refreshCollabs = async () => {
    const res = await fetch(`/api/documents/${doc._id}`);
    if (res.ok) { const d = await res.json(); setCollabList(d.collaborators); }
  };

  // ── Text selection → show AI popup ────────────────────────────
  const handleTextSelect = useCallback((text: string) => {
    setSelectedText(text);
    setShowAIPopup(!!text && !slashVisibleRef.current);
  }, []);

  // ── Slash command: keydown on editor wrapper ───────────────────
  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!slashVisibleRef.current) {
      if (e.key === 'Escape' && zenModeRef.current) {
        e.preventDefault();
        zenModeRef.current = false;
        setZenMode(false);
        return;
      }
      if (e.key === '/' && !isViewer) {
        setTimeout(() => {
          const sel = window.getSelection();
          if (!sel?.rangeCount) return;
          const rect = sel.getRangeAt(0).getBoundingClientRect();
          showSlash({ x: rect.left || 200, y: rect.bottom || 200 });
        }, 0);
      }
      return;
    }

    if (e.key === 'Escape') { e.preventDefault(); hideSlash(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const filtered = SLASH_COMMANDS.filter(c =>
        c.label.toLowerCase().includes(slashQueryRef.current.toLowerCase()) ||
        c.description.toLowerCase().includes(slashQueryRef.current.toLowerCase())
      );
      setSlashIndex(i => Math.min(i + 1, filtered.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSlashIndex(i => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const filtered = SLASH_COMMANDS.filter(c =>
        c.label.toLowerCase().includes(slashQueryRef.current.toLowerCase()) ||
        c.description.toLowerCase().includes(slashQueryRef.current.toLowerCase())
      );
      const cmd = filtered[slashIndex];
      if (cmd) executeSlashCommand(cmd);
      return;
    }
    if (e.key === 'Backspace') {
      if (slashQueryRef.current === '') { hideSlash(); }
      else { popSlashChar(); }
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      appendSlashChar(e.key);
    }
  }, [isViewer, slashIndex, showSlash, hideSlash, appendSlashChar, popSlashChar]);

  const executeSlashCommand = useCallback((cmd: SlashCommand) => {
    const charsToDelete = slashQueryRef.current.length + 1; // capture before hideSlash resets the ref
    hideSlash();
    const editor = richEditorRef.current;
    if (!editor) return;
    editor.deleteCharsBack(charsToDelete);

    if (cmd.id === 'ai') {
      setShowAI(true);
      return;
    }

    if (cmd.id === 'link') {
      openDocLinkPicker();
      return;
    }

    const htmlCommands: Record<string, string> = {
      divider: '<hr style="border:none;border-top:1px solid #1F1F23;margin:16px 0"/>',
      table: `<table style="border-collapse:collapse;width:100%;margin:8px 0"><tbody>
        <tr><td style="border:1px solid #1F1F23;padding:8px 12px;background:#111113">Cell</td><td style="border:1px solid #1F1F23;padding:8px 12px;background:#111113">Cell</td><td style="border:1px solid #1F1F23;padding:8px 12px;background:#111113">Cell</td></tr>
        <tr><td style="border:1px solid #1F1F23;padding:8px 12px">Cell</td><td style="border:1px solid #1F1F23;padding:8px 12px">Cell</td><td style="border:1px solid #1F1F23;padding:8px 12px">Cell</td></tr>
        <tr><td style="border:1px solid #1F1F23;padding:8px 12px">Cell</td><td style="border:1px solid #1F1F23;padding:8px 12px">Cell</td><td style="border:1px solid #1F1F23;padding:8px 12px">Cell</td></tr>
      </tbody></table>`,
      callout: '<blockquote style="background:#1F1F23;border-left:3px solid #6366F1;padding:12px 16px;border-radius:6px;margin:8px 0">💡 Add your callout text here</blockquote>',
      code:    '<pre style="background:#111113;border:1px solid #1F1F23;border-radius:6px;padding:12px 16px;font-family:JetBrains Mono,monospace;font-size:13px;margin:8px 0"><code>// your code here</code></pre>',
      diagram: '<pre data-mermaid="true" style="background:#0A0A0B;border:1px solid #4F46E5;border-radius:8px;padding:16px;font-family:JetBrains Mono,monospace;font-size:12px;margin:12px 0;color:#A1A1AA"><code>graph TD\n    A[Start] --&gt; B{Decision}\n    B --&gt;|Yes| C[Action]\n    B --&gt;|No| D[End]</code></pre>',
    };

    if (htmlCommands[cmd.id]) {
      editor.insertHTML(htmlCommands[cmd.id]);
    } else {
      editor.executeBlockFormat(cmd.id);
    }
  }, []);

  // ── Workflow status ────────────────────────────────────────────
  const handleWorkflowStatus = useCallback(async (next: WorkflowStatus) => {
    setStatusOpen(false);
    setWorkflowStatus(next);
    setStatusSaving(true);
    await fetch(`/api/documents/${doc._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflowStatus: next }),
    });
    setStatusSaving(false);
  }, [doc._id]);

  // ── Export to Markdown ─────────────────────────────────────────
  const handleExportMarkdown = useCallback(() => {
    downloadMarkdown(title, content);
  }, [title, content]);

  // ── AI popup: replace selected text ───────────────────────────
  const handleAIReplace = useCallback((text: string) => {
    richEditorRef.current?.replaceSelection(text);
    setShowAIPopup(false);
    setSelectedText('');
  }, []);

  // ── Comment: open panel with the selected quote ────────────────
  const handleAddComment = useCallback((quote: string) => {
    setPendingQuote(quote);
    setShowComments(true);
    setShowAIPopup(false);
    setSelectedText('');
  }, []);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-transparent overflow-hidden">
      {!zenMode && <SyncBar status={syncStatus} pendingOps={pendingOps} />}

      {/* Top bar */}
      <div
        className={`flex items-center gap-3 px-4 border-b border-line bg-[#0E0E10]/80 backdrop-blur-xl flex-shrink-0 ${syncStatus === 'offline' ? 'mt-8' : 'mt-0.5'} ${zenMode ? 'hidden' : ''}`}
        style={{ height: '48px' }}
      >
        <Link href="/dashboard" className="text-[#52525B] hover:text-white transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="flex items-center gap-2 flex-1 min-w-0 max-sm:w-28 max-sm:flex-none">
          <input
            value={title}
            onChange={handleTitleChange}
            disabled={isViewer}
            className="bg-transparent text-white font-medium text-sm placeholder-[#52525B] focus:outline-none truncate min-w-0 flex-1 disabled:cursor-default"
            placeholder="Untitled Document"
          />
          {titleSaving && <Loader2 className="w-3 h-3 animate-spin text-[#52525B] flex-shrink-0" />}
        </div>

        {/* Actions — horizontally scrollable on mobile so every tool is reachable */}
        <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setShowTOC(v => !v)}
            title="Table of Contents"
            className={`flex items-center gap-1.5 border border-transparent hover:border-[#1F1F23] hover:bg-[#111113] rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${showTOC ? 'text-[#6366F1]' : 'text-[#71717A] hover:text-white'}`}
          >
            <BookOpen className="w-3.5 h-3.5" /><span className="hidden lg:inline">Contents</span>
          </button>
          <button
            onClick={() => setShowMermaid(v => !v)}
            title="Diagrams"
            className={`flex items-center gap-1.5 border border-transparent hover:border-[#1F1F23] hover:bg-[#111113] rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${showMermaid ? 'text-[#6366F1]' : 'text-[#71717A] hover:text-white'}`}
          >
            <GitBranch className="w-3.5 h-3.5" /><span className="hidden lg:inline">Diagrams</span>
          </button>
        
          <button
            onClick={() => setShowCodeRunner(v => !v)}
            title="Run code blocks"
            className={`flex items-center gap-1.5 border border-transparent hover:border-[#1F1F23] hover:bg-[#111113] rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${showCodeRunner ? 'text-[#6366F1]' : 'text-[#71717A] hover:text-white'}`}
          >
            <Terminal className="w-3.5 h-3.5" /><span className="hidden lg:inline">Run</span>
          </button>
          <button
            onClick={() => setShowBacklinks(v => !v)}
            title="Backlinks"
            className={`flex items-center gap-1.5 border border-transparent hover:border-[#1F1F23] hover:bg-[#111113] rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${showBacklinks ? 'text-[#6366F1]' : 'text-[#71717A] hover:text-white'}`}
          >
            <Link2 className="w-3.5 h-3.5" /><span className="hidden lg:inline">Links</span>
          </button>
          <button
            onClick={() => setShowReview(v => !v)}
            title="AI Document Review"
            className={`flex items-center gap-1.5 border border-transparent hover:border-[#1F1F23] hover:bg-[#111113] rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${showReview ? 'text-[#6366F1]' : 'text-[#71717A] hover:text-white'}`}
          >
            <Sparkles className="w-3.5 h-3.5" /><span className="hidden lg:inline">Review</span>
          </button>
         
           {/* Workflow status badge */}
          <div className="relative flex-shrink-0">
            <button
              ref={statusBtnRef}
              onClick={() => !isViewer && setStatusOpen(o => !o)}
              disabled={isViewer || statusSaving}
              style={{
                color:            WORKFLOW_CONFIG[workflowStatus].color,
                backgroundColor:  WORKFLOW_CONFIG[workflowStatus].bg,
                borderColor:      WORKFLOW_CONFIG[workflowStatus].ring,
              }}
              className="flex items-center gap-1.5 border rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-all disabled:opacity-60 hover:opacity-80"
            >
              {statusSaving
                ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                : <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: WORKFLOW_CONFIG[workflowStatus].color }} />}
              <span className="hidden sm:inline">{WORKFLOW_CONFIG[workflowStatus].label}</span>
              {!isViewer && <ChevronDown className="w-2.5 h-2.5 opacity-60" />}
            </button>

            {statusOpen && (
              <div
                style={{
                  position: 'fixed',
                  top: (statusBtnRef.current?.getBoundingClientRect().bottom ?? 0) + 4,
                  left: statusBtnRef.current?.getBoundingClientRect().left ?? 0,
                }}
                className="w-36 bg-[#111113] border border-[#1F1F23] rounded-xl shadow-2xl z-50 overflow-hidden">
                {(Object.keys(WORKFLOW_CONFIG) as WorkflowStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => handleWorkflowStatus(s)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-[#1F1F23] ${workflowStatus === s ? 'text-white' : 'text-[#71717A]'}`}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: WORKFLOW_CONFIG[s].color }} />
                    {WORKFLOW_CONFIG[s].label}
                  </button>
                ))}
              </div>
            )}
          </div>
             {/* Collaborator avatars */}
        <div className="hidden sm:flex items-center">
          {collabList.slice(0, 4).map((c, i) => (
            <div key={c.userId}
              className="w-6 h-6 rounded-full border-2 border-[#0A0A0B] flex items-center justify-center text-[10px] font-semibold text-white tooltip"
              style={{ backgroundColor: c.color, marginLeft: i > 0 ? '-6px' : '0', zIndex: collabList.length - i }}
              data-tip={`${c.name} — ${c.role}`}>
              {c.name[0].toUpperCase()}
            </div>
          ))}
          {collabList.length > 4 && (
            <div className="w-6 h-6 rounded-full border-2 border-[#0A0A0B] bg-[#1F1F23] flex items-center justify-center text-[10px] text-[#71717A] -ml-1.5">
              +{collabList.length - 4}
            </div>
          )}
        </div>

        {/* Sync status */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#71717A]">
          {syncIcon(syncStatus, online)}
          <span>{syncText(syncStatus, online)}</span>
        </div>

        {/* Word count */}
        <span className="hidden md:block text-[#52525B] text-xs flex-shrink-0">
          {wordCount.toLocaleString()} words
        </span>
          <button
            onClick={handleExportMarkdown}
            title="Export as Markdown"
            className="flex items-center gap-1.5 text-[#71717A] hover:text-white border border-transparent hover:border-[#1F1F23] hover:bg-[#111113] rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all"
          >
            <Download className="w-3.5 h-3.5" /><span className="hidden lg:inline">Markdown</span>
          </button>
          <button
            onClick={() => printDocument(title, content)}
            title="Export as PDF"
            className="flex items-center gap-1.5 text-[#71717A] hover:text-white border border-transparent hover:border-[#1F1F23] hover:bg-[#111113] rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all"
          >
            <Printer className="w-3.5 h-3.5" /><span className="hidden lg:inline">PDF</span>
          </button>
            <button
            onClick={() => setShowComments(v => !v)}
            className={`flex items-center gap-1.5 border border-transparent hover:border-[#1F1F23] hover:bg-[#111113] rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${showComments ? 'text-[#6366F1]' : 'text-[#71717A] hover:text-white'}`}
          >
            <MessageSquare className="w-3.5 h-3.5" /><span className="hidden sm:inline">Comments</span>
          </button>
          <button
            onClick={() => { setShowVersions(!showVersions); if (!showVersions) refetchVersions(); }}
            className="flex items-center gap-1.5 text-[#71717A] hover:text-white border border-transparent hover:border-[#1F1F23] hover:bg-[#111113] rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all"
          >
            <Clock className="w-3.5 h-3.5" /><span className="hidden sm:inline">History</span>
          </button>
         <button
            onClick={toggleZenMode}
            title="Focus mode (Esc to exit)"
            className="flex items-center gap-1.5 text-[#71717A] hover:text-white border border-transparent hover:border-[#1F1F23] hover:bg-[#111113] rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5" /><span className="hidden lg:inline">Focus</span>
          </button>
          <button
            onClick={() => { setShowShare(true); refreshCollabs(); }}
            className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#5254CC] text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Editor area with optional TOC sidebar */}
      <div className="flex-1 min-h-0 flex" onKeyDown={handleEditorKeyDown}>
        {showTOC && !zenMode && (
          <TableOfContents content={content} onClose={() => setShowTOC(false)} />
        )}
        <div className="flex-1 min-h-0 flex flex-col">
          <RichEditor
            ref={richEditorRef}
            content={content}
            readOnly={isViewer}
            onChange={updateText}
            onAIToggle={() => setShowAI(!showAI)}
            onTextSelect={handleTextSelect}
          />
        </div>
      </div>

      {/* Zen mode exit button */}
      {zenMode && (
        <button
          onClick={toggleZenMode}
          className="fixed top-3 right-3 z-50 flex items-center gap-1.5 bg-black/30 hover:bg-black/50 text-[#52525B] hover:text-white text-[11px] px-2.5 py-1.5 rounded-lg backdrop-blur-sm transition-all border border-white/5"
        >
          <Minimize2 className="w-3 h-3" />
          <span>Exit Focus</span>
          <kbd className="text-[9px] text-[#3F3F46] ml-1 font-mono">Esc</kbd>
        </button>
      )}

      {/* AI floating selection popup */}
      {showAIPopup && selectedText && !isViewer && (
        <AISelectionPopup
          selectedText={selectedText}
          onReplace={handleAIReplace}
          onAddComment={handleAddComment}
          onClose={() => { setShowAIPopup(false); setSelectedText(''); }}
        />
      )}

      {/* Slash command menu */}
      {slashVisible && (
        <SlashCommandMenu
          query={slashQuery}
          position={slashPos}
          selectedIndex={slashIndex}
          onSelect={executeSlashCommand}
          onIndexChange={setSlashIndex}
        />
      )}

      {/* App overlays */}
      {showShare && (
        <ShareModal
          docId={doc._id}
          collaborators={collabList}
          currentUserId={userId}
          onClose={() => setShowShare(false)}
          onUpdate={refreshCollabs}
        />
      )}
      {showVersions && (
        <VersionPanel
          versions={versions}
          loading={versionsLoading}
          onClose={() => setShowVersions(false)}
          onRestore={handleRestoreVersion}
          onSaveNow={handleSaveVersion}
        />
      )}
      {showAI && (
        <AIPanel
          selectedText={selectedText}
          onInsert={text => richEditorRef.current?.insertText(text)}
          onInsertHTML={html => richEditorRef.current?.insertHTML(html)}
          onClose={() => setShowAI(false)}
        />
      )}
      {showComments && (
        <CommentsPanel
          docId={doc._id}
          pendingQuote={pendingQuote}
          onClose={() => { setShowComments(false); setPendingQuote(''); }}
          onClearPendingQuote={() => setPendingQuote('')}
        />
      )}
      {showMermaid && (
        <MermaidPanel
          content={content}
          onClose={() => setShowMermaid(false)}
        />
      )}
      {showReview && (
        <AIReviewPanel
          content={content}
          title={title}
          onClose={() => setShowReview(false)}
        />
      )}
      {showCodeRunner && (
        <CodeRunnerPanel
          content={content}
          onClose={() => setShowCodeRunner(false)}
        />
      )}
      {showBacklinks && (
        <BacklinksPanel
          docId={doc._id}
          onClose={() => setShowBacklinks(false)}
        />
      )}

      {/* Doc-link picker — opened by /link slash command */}
      {showDocPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDocPicker(false)}
        >
          <div
            className="bg-[#111113] border border-[#1F1F23] rounded-2xl shadow-2xl w-full max-w-md mx-4 flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Picker header */}
            <div className="px-4 py-3 border-b border-[#1F1F23] flex-shrink-0">
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#52525B]" />
                <input
                  autoFocus
                  value={docPickerQuery}
                  onChange={e => setDocPickerQuery(e.target.value)}
                  placeholder="Search documents to link…"
                  className="w-full bg-[#0A0A0B] border border-[#1F1F23] text-white placeholder-[#3F3F46] rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
                />
              </div>
            </div>

            {/* Picker list */}
            <div className="max-h-72 overflow-y-auto">
              {docPickerLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-4 h-4 animate-spin text-[#6366F1]" />
                </div>
              ) : (() => {
                const filtered = docPickerList.filter(d =>
                  d.title.toLowerCase().includes(docPickerQuery.toLowerCase())
                );
                return filtered.length === 0 ? (
                  <div className="py-10 text-center text-[#52525B] text-sm">No documents found</div>
                ) : filtered.map(d => (
                  <button
                    key={d._id}
                    onClick={() => insertDocLink(d._id, d.title)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#18181B] transition-colors"
                  >
                    <span className="text-base flex-shrink-0">📄</span>
                    <span className="text-white text-sm truncate">{d.title}</span>
                  </button>
                ));
              })()}
            </div>

            <div className="px-4 py-2.5 border-t border-[#1F1F23] flex-shrink-0">
              <p className="text-[#3F3F46] text-[10px]">Click a document to insert a link at your cursor</p>
            </div>
          </div>
        </div>
      )}
      {statusOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setStatusOpen(false)} />
      )}
    </div>
  );
}
