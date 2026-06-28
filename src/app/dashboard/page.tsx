'use client';
import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  FileText, Plus, LogOut, Search, Wifi, WifiOff,
  MoreHorizontal, Trash2, Users, FileEdit, LayoutTemplate, Files, FolderOpen,
  Sparkles, Wand2,
} from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useDocument';
import { TEMPLATES, type DocTemplate } from '@/lib/templates';
import { Button, Card, Modal } from '@/components/ui';
import { fadeUp, stagger } from '@/lib/motion';
import { toast } from '@/lib/toast';

type WorkflowStatus = 'draft' | 'review' | 'approved';
type View = 'all' | 'mine' | 'shared';

const WORKFLOW_BADGE: Record<WorkflowStatus, { label: string; color: string }> = {
  draft:    { label: 'Draft',     color: '#52525B' },
  review:   { label: 'In Review', color: '#F59E0B' },
  approved: { label: 'Approved',  color: '#10B981' },
};

const NAV: { key: View; label: string; icon: typeof Files }[] = [
  { key: 'all',    label: 'All documents',   icon: Files },
  { key: 'mine',   label: 'My documents',    icon: FileText },
  { key: 'shared', label: 'Shared with me',  icon: Users },
];

const AI_PROMPT_IDEAS = [
  'Incident postmortem',
  'Product launch plan',
  'RFC for a new service',
  'Marketing campaign brief',
  'Sprint planning doc',
  'Case study',
];

interface DocPreview {
  _id: string;
  title: string;
  content: string;
  collaborators: { userId: string; name: string; color: string }[];
  wordCount: number;
  updatedAt: string;
  createdBy: string;
  workflowStatus?: WorkflowStatus;
}

interface SearchResult {
  _id: string;
  title: string;
  snippet: string;
  updatedAt: string;
  workflowStatus?: WorkflowStatus;
}

// Highlight a query match inside text (pure helper, module scope).
function highlight(text: string, q: string): ReactNode {
  if (!q || q.length < 2) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-accent-grad-soft not-italic text-[#A5B4FC]">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const online = useOnlineStatus();
  const reduce = useReducedMotion();

  const [docs, setDocs] = useState<DocPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState<View>('all');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateTab, setTemplateTab] = useState<'gallery' | 'ai'>('gallery');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) setDocs(await res.json());
      else toast.error('Could not load documents', 'Please refresh and try again.');
    } catch {
      toast.error('Could not load documents', 'Check your connection.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // Server-side full-text search — debounced 400 ms
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (search.length < 2) { setSearchResults([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`);
        if (res.ok) { const { results } = await res.json(); setSearchResults(results); }
      } finally { setSearchLoading(false); }
    }, 400);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
  }, [search]);

  const createDoc = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Document' }),
      });
      if (res.ok) { const doc = await res.json(); router.push(`/docs/${doc._id}`); }
      else { toast.error('Could not create document'); setCreating(false); }
    } catch { toast.error('Could not create document'); setCreating(false); }
  };

  const createFromTemplate = async (template: DocTemplate) => {
    setShowTemplates(false);
    setCreating(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: template.title }),
      });
      if (res.ok) { const doc = await res.json(); router.push(`/docs/${doc._id}?template=${template.id}`); }
      else { toast.error('Could not create document'); setCreating(false); }
    } catch { toast.error('Could not create document'); setCreating(false); }
  };

  const generateAITemplate = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt || aiGenerating) return;
    setAiGenerating(true);
    try {
      const aiRes = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'template', prompt }),
      });
      const aiData = await aiRes.json();
      if (!aiRes.ok) { toast.error('Generation failed', aiData.error); setAiGenerating(false); return; }

      const html = String(aiData.result || '').trim();
      if (!html) { toast.error('AI returned an empty template'); setAiGenerating(false); return; }

      const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, '').trim();
      const title = (h1 || prompt).slice(0, 120) || 'Untitled Document';

      const docRes = await fetch('/api/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!docRes.ok) { toast.error('Could not create document'); setAiGenerating(false); return; }
      const doc = await docRes.json();

      sessionStorage.setItem(`ai-template-${doc._id}`, html);
      setShowTemplates(false);
      setAiPrompt('');
      router.push(`/docs/${doc._id}`);
    } catch {
      toast.error('Generation failed', 'Please try again.');
      setAiGenerating(false);
    }
  };

  const deleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(id);
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      setDocs(d => d.filter(doc => doc._id !== id));
      toast.success('Document deleted');
    } catch { toast.error('Could not delete document'); }
    finally { setDeleting(null); setMenuOpen(null); }
  };

  const myDocs = docs.filter(d => d.createdBy === session?.user?.id);
  const sharedDocs = docs.filter(d => d.createdBy !== session?.user?.id);

  const renderDocCards = (items: DocPreview[]) =>
    items.map(doc => (
      <DocCard
        key={doc._id}
        doc={doc}
        isOwner={doc.createdBy === session?.user?.id}
        reduce={!!reduce}
        menuOpen={menuOpen === doc._id}
        deleting={deleting === doc._id}
        onToggleMenu={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === doc._id ? null : doc._id); }}
        onOpen={() => { setMenuOpen(null); router.push(`/docs/${doc._id}`); }}
        onDelete={(e) => deleteDoc(doc._id, e)}
      />
    ));

  return (
    <div className="flex h-screen overflow-hidden" onClick={() => setMenuOpen(null)}>
      {/* Sidebar (fixed, full height) */}
      <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-line p-4 md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-grad shadow-glow-accent-sm">
            <FileText className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white">Draftpad</span>
        </div>

        <nav className="flex-1 space-y-0.5">
          {NAV.map(item => {
            const active = view === item.key;
            return (
              <button key={item.key} onClick={() => setView(item.key)}
                className={`relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${active ? 'text-white' : 'text-[#71717A] hover:bg-white/[0.04] hover:text-white'}`}>
                {active && (
                  <motion.div layoutId="nav-active" transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-lg border-l-2 border-accent bg-accent-grad-soft" />
                )}
                <item.icon className="relative z-10 h-3.5 w-3.5" />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-line pt-4">
          <div className="mb-3 flex items-center gap-2.5 px-1">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent-grad text-xs font-semibold text-white ring-2 ring-white/10">
              {session?.user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white">{session?.user?.name}</p>
              <div className="flex items-center gap-1">
                <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-green-500 shadow-[0_0_6px] shadow-green-500/60' : 'bg-amber-500'}`} />
                <span className="text-[10px] text-txt-muted">{online ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/login' })} className="w-full justify-start">
            <LogOut className="h-3.5 w-3.5" />Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-line px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-accent-grad">
              <FileText className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Draftpad</span>
          </div>
          <div className="flex items-center gap-2">
            {online ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-amber-500" />}
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-txt-muted hover:text-white">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Fixed top region: title + actions + search */}
        <div className="flex-shrink-0 border-b border-line">
          <div className="mx-auto w-full max-w-6xl px-4 pt-4 md:px-8 md:pt-6">
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-xl font-semibold text-white md:text-2xl">Documents</h1>
                <p className="mt-0.5 text-sm text-txt-muted">{docs.length} document{docs.length !== 1 ? 's' : ''} total</p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Button variant="secondary" onClick={() => setShowTemplates(true)} disabled={creating}>
                  <LayoutTemplate className="h-4 w-4" />Templates
                </Button>
                <Button onClick={createDoc} loading={creating} disabled={creating}>
                  {!creating && <Plus className="h-4 w-4" />}New document
                </Button>
              </div>
            </div>

            <div className="group relative mb-4">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-txt-muted" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents…"
                className="w-full rounded-xl border border-line bg-white/[0.02] py-2.5 pl-10 pr-16 text-sm text-white placeholder-[#3F3F46] transition-all focus:border-accent focus:shadow-glow-accent-sm focus:outline-none focus:ring-1 focus:ring-accent/40" />
              <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-line bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-txt-muted">⌘K</kbd>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="premium-scroll flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
            {loading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : docs.length === 0 ? (
              <EmptyState onCreate={createDoc} creating={creating} reduce={!!reduce} />
            ) : search ? (
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Search className="h-4 w-4 text-txt-muted" />
                  <h2 className="text-xs font-medium uppercase tracking-widest text-[#71717A]">Results for &ldquo;{search}&rdquo;</h2>
                  {!searchLoading && <span className="text-xs text-[#3F3F46]">{searchResults.length}</span>}
                </div>
                {searchLoading ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                    <Search className="h-7 w-7 text-[#2a2a2e]" />
                    <p className="text-sm text-txt-muted">No documents matched &ldquo;{search}&rdquo;</p>
                    <p className="text-xs text-[#3F3F46]">Try different keywords or check the title and body of your docs.</p>
                  </div>
                ) : (
                  <motion.div variants={stagger(0.05)} initial="hidden" animate="show"
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {searchResults.map(r => (
                      <SearchResultCard key={r._id} result={r} query={search} onOpen={() => router.push(`/docs/${r._id}`)} />
                    ))}
                  </motion.div>
                )}
              </div>
            ) : (
              <>
                {(view === 'all' || view === 'mine') && myDocs.length > 0 && (
                  <SectionShell title="My documents" count={myDocs.length} icon={FileText}>
                    {renderDocCards(myDocs)}
                  </SectionShell>
                )}
                {(view === 'all' || view === 'shared') && sharedDocs.length > 0 && (
                  <SectionShell title="Shared with me" count={sharedDocs.length} icon={Users}>
                    {renderDocCards(sharedDocs)}
                  </SectionShell>
                )}
                {view === 'mine' && myDocs.length === 0 && <ViewEmpty label="You haven't created any documents yet." />}
                {view === 'shared' && sharedDocs.length === 0 && <ViewEmpty label="Nothing has been shared with you yet." />}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Template picker modal */}
      <Modal open={showTemplates} onClose={() => setShowTemplates(false)} title="New document"
        description="Start from a template or generate one with AI" className="max-w-2xl">
        <div className="px-6 pt-4">
          <div className="inline-flex gap-1 rounded-lg border border-line bg-white/[0.03] p-1">
            <button onClick={() => setTemplateTab('gallery')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${templateTab === 'gallery' ? 'bg-accent-grad-soft text-white' : 'text-txt-secondary hover:text-white'}`}>
              <LayoutTemplate className="h-3.5 w-3.5" />Gallery
            </button>
            <button onClick={() => setTemplateTab('ai')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${templateTab === 'ai' ? 'bg-accent-grad-soft text-white' : 'text-txt-secondary hover:text-white'}`}>
              <Sparkles className="h-3.5 w-3.5" />Generate with AI
            </button>
          </div>
        </div>

        {templateTab === 'gallery' ? (
          <div className="p-6 pt-4">
            {Array.from(new Set(TEMPLATES.map(t => t.category))).map(cat => (
              <div key={cat} className="mb-6 last:mb-0">
                <h3 className="mb-3 text-xs font-medium uppercase tracking-widest text-txt-muted">{cat}</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {TEMPLATES.filter(t => t.category === cat).map(template => (
                    <button key={template.id} onClick={() => createFromTemplate(template)}
                      className="group flex items-start gap-3 rounded-xl border border-line bg-white/[0.02] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-line-strong hover:bg-white/[0.04] hover:shadow-elev-2">
                      <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-accent-grad-soft text-xl">{template.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-white transition-colors group-hover:text-[#A5B4FC]">{template.title}</div>
                        <div className="mt-0.5 text-xs text-txt-muted">{template.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 pt-4">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-grad shadow-glow-accent-sm">
                <Wand2 className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Describe the document you need</p>
                <p className="text-xs text-txt-muted">AI drafts a full, structured template you can edit instantly.</p>
              </div>
            </div>

            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) generateAITemplate(); }}
              placeholder="e.g. Incident postmortem for a production database outage, with timeline, impact, root cause and action items"
              rows={3}
              disabled={aiGenerating}
              className="w-full resize-none rounded-xl border border-line bg-white/[0.02] px-3.5 py-3 text-sm text-white placeholder-[#3F3F46] transition-all focus:border-accent focus:shadow-glow-accent-sm focus:outline-none focus:ring-1 focus:ring-accent/40 disabled:opacity-60"
            />

            <div className="mt-3 flex flex-wrap gap-1.5">
              {AI_PROMPT_IDEAS.map(idea => (
                <button key={idea} onClick={() => setAiPrompt(idea)} disabled={aiGenerating}
                  className="rounded-full border border-line bg-white/[0.02] px-2.5 py-1 text-[11px] text-txt-secondary transition-colors hover:border-line-strong hover:text-white disabled:opacity-50">
                  {idea}
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <p className="text-[11px] text-txt-muted">⌘/Ctrl + Enter to generate</p>
              <Button onClick={generateAITemplate} loading={aiGenerating} disabled={!aiPrompt.trim() || aiGenerating}>
                {!aiGenerating && <Sparkles className="h-4 w-4" />}
                {aiGenerating ? 'Generating…' : 'Generate template'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── Module-scope components (stable identity → no remount → no entrance flicker) ──

interface DocCardProps {
  doc: DocPreview;
  isOwner: boolean;
  reduce: boolean;
  menuOpen: boolean;
  deleting: boolean;
  onToggleMenu: (e: React.MouseEvent) => void;
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

function DocCard({ doc, isOwner, reduce, menuOpen, deleting, onToggleMenu, onOpen, onDelete }: DocCardProps) {
  return (
    <Card variants={fadeUp} interactive glow onClick={onOpen} className="group p-5">
      <div className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-r-full ${isOwner ? 'bg-gradient-to-b from-[#6366F1] to-[#8B5CF6]' : 'bg-[#52525B]'}`} />

      <div className="mb-3 flex items-start justify-between">
        <div className="flex min-w-0 items-center gap-2.5">
          <FileText className="h-4 w-4 flex-shrink-0 text-txt-muted" />
          <h3 className="truncate text-sm font-medium text-white">{doc.title || 'Untitled Document'}</h3>
        </div>
        <button
          onClick={onToggleMenu}
          className="p-1 text-txt-muted opacity-0 transition-all hover:text-white group-hover/card:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-4 line-clamp-2 min-h-[2rem] text-xs leading-relaxed text-txt-muted">
        {doc.content || 'Empty document — click to start writing'}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {doc.collaborators.slice(0, 3).map((c, i) => (
            <div key={c.userId}
              className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold text-white ring-2 ring-bg-primary"
              style={{ backgroundColor: c.color, marginLeft: i > 0 ? '-6px' : '0', zIndex: 3 - i }}>
              {c.name[0].toUpperCase()}
            </div>
          ))}
          {doc.collaborators.length > 3 && <span className="ml-1.5 text-[10px] text-txt-muted">+{doc.collaborators.length - 3}</span>}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-txt-muted">
          {doc.workflowStatus && doc.workflowStatus !== 'draft' && (
            <span className="flex items-center gap-1 font-medium" style={{ color: WORKFLOW_BADGE[doc.workflowStatus].color }}>
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: WORKFLOW_BADGE[doc.workflowStatus].color }} />
              {WORKFLOW_BADGE[doc.workflowStatus].label}
            </span>
          )}
          <span>{doc.wordCount.toLocaleString()} words</span>
          <span>{formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</span>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-2 top-10 z-10 min-w-[140px] origin-top-right overflow-hidden rounded-xl border border-line bg-[#141417] py-1 shadow-elev-3"
            onClick={e => e.stopPropagation()}>
            <button onClick={onOpen}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-txt-secondary transition-colors hover:bg-white/[0.06] hover:text-white">
              <FileEdit className="h-3.5 w-3.5" />Open
            </button>
            {isOwner && (
              <button onClick={onDelete} disabled={deleting}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50">
                <Trash2 className="h-3.5 w-3.5" />Delete
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

function SearchResultCard({ result, query, onOpen }: { result: SearchResult; query: string; onOpen: () => void }) {
  return (
    <Card variants={fadeUp} interactive glow onClick={onOpen} className="group p-4">
      <div className="mb-1.5 flex items-center gap-2">
        <FileText className="h-3.5 w-3.5 flex-shrink-0 text-txt-muted" />
        <span className="truncate text-sm font-medium text-white transition-colors group-hover/card:text-[#A5B4FC]">
          {highlight(result.title, query)}
        </span>
        {result.workflowStatus && result.workflowStatus !== 'draft' && (
          <span className="flex-shrink-0 text-[10px] font-medium" style={{ color: WORKFLOW_BADGE[result.workflowStatus].color }}>
            {WORKFLOW_BADGE[result.workflowStatus].label}
          </span>
        )}
      </div>
      {result.snippet && (
        <p className="line-clamp-2 pl-5 text-xs leading-relaxed text-txt-muted">{highlight(result.snippet, query)}</p>
      )}
      <p className="mt-1.5 pl-5 text-[10px] text-[#3F3F46]">
        {formatDistanceToNow(new Date(result.updatedAt), { addSuffix: true })}
      </p>
    </Card>
  );
}

function SectionShell({ title, count, icon: Icon, children }: { title: string; count: number; icon: typeof FileText; children: ReactNode }) {
  return (
    <div className="mb-10">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-txt-muted" />
        <h2 className="text-xs font-medium uppercase tracking-widest text-[#71717A]">{title}</h2>
        <span className="text-xs text-[#3F3F46]">{count}</span>
      </div>
      <motion.div variants={stagger(0.05)} initial="hidden" animate="show"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </motion.div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="h-36 rounded-2xl border border-line bg-surface-grad p-5">
      <div className="space-y-3">
        {[60, 90, 40].map((w, i) => (
          <div key={i} style={{ width: `${w}%` }} className="relative h-2.5 overflow-hidden rounded-full bg-white/[0.04]">
            <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ViewEmpty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <FolderOpen className="h-7 w-7 text-[#2a2a2e]" />
      <p className="text-sm text-txt-muted">{label}</p>
    </div>
  );
}

function EmptyState({ onCreate, creating, reduce }: { onCreate: () => void; creating: boolean; reduce: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <motion.div
        animate={reduce ? undefined : { y: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-gradient-to-br from-[#18181B] to-[#0A0A0B] shadow-elev-2">
        <FileText className="h-8 w-8 text-[#2a2a2e]" />
      </motion.div>
      <h3 className="mb-2 font-semibold text-white">No documents yet</h3>
      <p className="mb-6 max-w-xs text-center text-sm text-txt-muted">Create your first document to start writing and collaborating</p>
      <Button onClick={onCreate} loading={creating} size="lg">
        {!creating && <Plus className="h-4 w-4" />}Create document
      </Button>
    </div>
  );
}
