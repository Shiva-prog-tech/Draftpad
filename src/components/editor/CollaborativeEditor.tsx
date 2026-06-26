'use client';
import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Share2, Clock, WifiOff, CheckCircle2, Loader2 } from 'lucide-react';
import { useDocument, useVersionHistory } from '@/hooks/useDocument';
import { SyncBar }     from '@/components/editor/SyncBar';
import { ShareModal }  from '@/components/editor/ShareModal';
import { VersionPanel } from '@/components/editor/VersionPanel';
import { AIPanel }     from '@/components/editor/AIPanel';
import { RichEditor, RichEditorHandle } from '@/packages/rich-editor';
import { encodeState } from '@/lib/crdt/yjs-utils';
import { Document, SyncStatus } from '@/types';

interface Props { doc: Document; }

const syncIcon = (status: SyncStatus, online: boolean) => {
  if (!online || status === 'offline') return <WifiOff className="w-3.5 h-3.5 text-amber-500" />;
  if (status === 'syncing') return <Loader2 className="w-3.5 h-3.5 text-[#6366F1] animate-spin" />;
  return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
};
const syncText = (status: SyncStatus, online: boolean) =>
  !online || status === 'offline' ? 'Offline' : status === 'syncing' ? 'Syncing…' : 'Synced';

export function CollaborativeEditor({ doc }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const richEditorRef = useRef<RichEditorHandle>(null);

  const userId   = session?.user?.id || '';
  const myCollab = doc.collaborators.find(c => c.userId === userId);
  const isViewer = myCollab?.role === 'viewer';
  const online   = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const { content, wordCount, syncStatus, pendingOps, updateText, getDoc } =
    useDocument(doc._id, userId, doc.yjsState);
  const { versions, loading: versionsLoading, saveVersion, restoreVersion, refetch: refetchVersions } =
    useVersionHistory(doc._id);

  // ── App UI state ───────────────────────────────────────────────
  const [title,        setTitle]        = useState(doc.title);
  const [titleSaving,  setTitleSaving]  = useState(false);
  const [showShare,    setShowShare]    = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showAI,       setShowAI]       = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [collabList,   setCollabList]   = useState(doc.collaborators);
  const titleTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-[#0A0A0B] overflow-hidden">
      <SyncBar status={syncStatus} pendingOps={pendingOps} />

      {/* Top bar */}
      <div
        className={`flex items-center gap-3 px-4 border-b border-[#1F1F23] flex-shrink-0 ${syncStatus === 'offline' ? 'mt-8' : 'mt-0.5'}`}
        style={{ height: '48px' }}
      >
        <Link href="/dashboard" className="text-[#52525B] hover:text-white transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            value={title}
            onChange={handleTitleChange}
            disabled={isViewer}
            className="bg-transparent text-white font-medium text-sm placeholder-[#52525B] focus:outline-none truncate min-w-0 flex-1 disabled:cursor-default"
            placeholder="Untitled Document"
          />
          {titleSaving && <Loader2 className="w-3 h-3 animate-spin text-[#52525B] flex-shrink-0" />}
        </div>

        {/* Collaborator avatars */}
        <div className="hidden sm:flex items-center">
          {collabList.slice(0, 4).map((c, i) => (
            <div
              key={c.userId}
              className="w-6 h-6 rounded-full border-2 border-[#0A0A0B] flex items-center justify-center text-[10px] font-semibold text-white tooltip"
              style={{ backgroundColor: c.color, marginLeft: i > 0 ? '-6px' : '0', zIndex: collabList.length - i }}
              data-tip={`${c.name} — ${c.role}`}
            >
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

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => { setShowVersions(!showVersions); if (!showVersions) refetchVersions(); }}
            className="flex items-center gap-1.5 text-[#71717A] hover:text-white border border-transparent hover:border-[#1F1F23] hover:bg-[#111113] rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all"
          >
            <Clock className="w-3.5 h-3.5" /><span className="hidden sm:inline">History</span>
          </button>
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#5254CC] text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Editor core — no Yjs, no auth, no routing inside here */}
      <RichEditor
        ref={richEditorRef}
        content={content}
        readOnly={isViewer}
        onChange={updateText}
        onAIToggle={() => setShowAI(!showAI)}
        onTextSelect={setSelectedText}
      />

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
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  );
}
