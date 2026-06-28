'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  FileText, Plus, LogOut, Search, Wifi, WifiOff,
  MoreHorizontal, Trash2, Users, Loader2, FileEdit, LayoutTemplate, X,
} from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useDocument';
import { TEMPLATES, type DocTemplate } from '@/lib/templates';

type WorkflowStatus = 'draft' | 'review' | 'approved';

const WORKFLOW_BADGE: Record<WorkflowStatus, { label: string; color: string }> = {
  draft:    { label: 'Draft',     color: '#52525B' },
  review:   { label: 'In Review', color: '#F59E0B' },
  approved: { label: 'Approved',  color: '#10B981' },
};

interface DocPreview {
  _id: string;
  title: string;
  content: string;
  collaborators: any[];
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

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const online = useOnlineStatus();

  const [docs, setDocs] = useState<DocPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults,  setSearchResults]  = useState<SearchResult[]>([]);
  const [searchLoading,  setSearchLoading]  = useState(false);
  const [menuOpen, setMenuOpen]           = useState<string | null>(null);
  const [deleting, setDeleting]           = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) setDocs(await res.json());
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Document' }),
      });
      if (res.ok) {
        const doc = await res.json();
        router.push(`/docs/${doc._id}`);
      }
    } catch { setCreating(false); }
  };

  const createFromTemplate = async (template: DocTemplate) => {
    setShowTemplates(false);
    setCreating(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: template.title }),
      });
      if (res.ok) {
        const doc = await res.json();
        router.push(`/docs/${doc._id}?template=${template.id}`);
      }
    } catch { setCreating(false); }
  };

  const deleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(id);
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    setDocs(d => d.filter(doc => doc._id !== id));
    setDeleting(null);
    setMenuOpen(null);
  };

  const myDocs = docs.filter(d => d.createdBy === session?.user?.id);
  const sharedDocs = docs.filter(d => d.createdBy !== session?.user?.id);

  // Highlight query match inside a text string
  const highlight = (text: string, q: string) => {
    if (!q || q.length < 2) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-[#6366F1]/30 text-[#A5B4FC] rounded-sm not-italic">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const SearchResultCard = ({ result }: { result: SearchResult }) => (
    <div
      onClick={() => router.push(`/docs/${result._id}`)}
      className="bg-[#111113] border border-[#1F1F23] hover:border-[#6366F1]/40 rounded-xl p-4 cursor-pointer transition-all group"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <FileText className="w-3.5 h-3.5 text-[#52525B] flex-shrink-0" />
        <span className="text-white text-sm font-medium truncate group-hover:text-[#A5B4FC] transition-colors">
          {highlight(result.title, search)}
        </span>
        {result.workflowStatus && result.workflowStatus !== 'draft' && (
          <span className="text-[10px] font-medium flex-shrink-0" style={{ color: WORKFLOW_BADGE[result.workflowStatus].color }}>
            {WORKFLOW_BADGE[result.workflowStatus].label}
          </span>
        )}
      </div>
      {result.snippet && (
        <p className="text-[#52525B] text-xs leading-relaxed line-clamp-2 pl-5">
          {highlight(result.snippet, search)}
        </p>
      )}
      <p className="text-[#3F3F46] text-[10px] mt-1.5 pl-5">
        {formatDistanceToNow(new Date(result.updatedAt), { addSuffix: true })}
      </p>
    </div>
  );

  const DocCard = ({ doc }: { doc: DocPreview }) => {
    const isOwner = doc.createdBy === session?.user?.id;
    return (
      <div onClick={() => router.push(`/docs/${doc._id}`)}
        className="doc-card bg-[#111113] border border-[#1F1F23] rounded-xl p-5 cursor-pointer relative group">
        {/* Status strip */}
        <div className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-r-full ${isOwner ? 'bg-[#6366F1]' : 'bg-[#52525B]'}`} />

        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className="w-4 h-4 text-[#52525B] flex-shrink-0" />
            <h3 className="text-white font-medium text-sm truncate">
              {doc.title || 'Untitled Document'}
            </h3>
          </div>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(menuOpen === doc._id ? null : doc._id); }}
            className="opacity-0 group-hover:opacity-100 text-[#52525B] hover:text-white p-1 transition-all">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Content preview */}
        <p className="text-[#52525B] text-xs leading-relaxed mb-4 line-clamp-2 min-h-[2rem]">
          {doc.content || 'Empty document — click to start writing'}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {doc.collaborators.slice(0, 3).map((c, i) => (
              <div key={c.userId} className="w-5 h-5 rounded-full border border-[#0A0A0B] text-[9px] font-semibold text-white flex items-center justify-center"
                style={{ backgroundColor: c.color, marginLeft: i > 0 ? '-4px' : '0', zIndex: 3 - i }}>
                {c.name[0].toUpperCase()}
              </div>
            ))}
            {doc.collaborators.length > 3 && (
              <span className="text-[#52525B] text-[10px] ml-1">+{doc.collaborators.length - 3}</span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[10px] text-[#52525B]">
            {doc.workflowStatus && doc.workflowStatus !== 'draft' && (
              <span
                className="flex items-center gap-1 font-medium"
                style={{ color: WORKFLOW_BADGE[doc.workflowStatus].color }}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: WORKFLOW_BADGE[doc.workflowStatus].color }} />
                {WORKFLOW_BADGE[doc.workflowStatus].label}
              </span>
            )}
            <span>{doc.wordCount.toLocaleString()} words</span>
            <span>{formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Context menu */}
        {menuOpen === doc._id && (
          <div className="absolute top-10 right-2 bg-[#18181B] border border-[#1F1F23] rounded-lg shadow-xl z-10 py-1 min-w-[140px]"
            onClick={e => e.stopPropagation()}>
            <button onClick={() => { setMenuOpen(null); router.push(`/docs/${doc._id}`); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#A1A1AA] hover:text-white hover:bg-[#1F1F23] transition-colors">
              <FileEdit className="w-3.5 h-3.5" />Open
            </button>
            {isOwner && (
              <button onClick={e => deleteDoc(doc._id, e)} disabled={deleting === doc._id}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                {deleting === doc._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const Section = ({ title, docs, icon: Icon }: { title: string; docs: DocPreview[]; icon: any }) => (
    docs.length > 0 ? (
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Icon className="w-4 h-4 text-[#52525B]" />
          <h2 className="text-[#71717A] text-xs font-medium uppercase tracking-widest">{title}</h2>
          <span className="text-[#3F3F46] text-xs">{docs.length}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {docs.map(d => <DocCard key={d._id} doc={d} />)}
        </div>
      </div>
    ) : null
  );

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex" onClick={() => setMenuOpen(null)}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-[#1F1F23] p-4 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8 px-1">
          <div className="w-7 h-7 bg-[#6366F1] rounded-lg flex items-center justify-center">
            <FileText className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">Draftpad</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5">
          {[
            { label: 'All documents', active: true },
            { label: 'My documents', active: false },
            { label: 'Shared with me', active: false },
          ].map(item => (
            <div key={item.label}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${item.active ? 'bg-[#6366F1]/10 text-white border-l-2 border-[#6366F1] pl-2.5' : 'text-[#71717A] hover:text-white hover:bg-[#111113]'}`}>
              <FileText className="w-3.5 h-3.5" />
              {item.label}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-[#1F1F23] pt-4 mt-4">
          <div className="flex items-center gap-2.5 px-1 mb-3">
            <div className="w-7 h-7 rounded-full bg-[#6366F1] flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
              {session?.user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{session?.user?.name}</p>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-500' : 'bg-amber-500'}`} />
                <span className="text-[#52525B] text-[10px]">{online ? 'Online' : 'Offline'}</span>
              </div>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-2 px-3 py-2 text-[#52525B] hover:text-white hover:bg-[#111113] rounded-lg text-xs transition-colors">
            <LogOut className="w-3.5 h-3.5" />Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[#1F1F23]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#6366F1] rounded flex items-center justify-center">
              <FileText className="w-3 h-3 text-white" />
            </div>
            <span className="text-white font-semibold text-sm">Draftpad</span>
          </div>
          <div className="flex items-center gap-2">
            {online ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-amber-500" />}
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-[#52525B] hover:text-white">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-white text-xl md:text-2xl font-semibold">Documents</h1>
              <p className="text-[#52525B] text-sm mt-0.5">
                {docs.length} document{docs.length !== 1 ? 's' : ''} total
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button onClick={() => setShowTemplates(true)} disabled={creating}
                className="flex items-center gap-2 bg-[#111113] hover:bg-[#18181B] border border-[#1F1F23] hover:border-[#2a2a30] disabled:opacity-60 text-[#A1A1AA] hover:text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors">
                <LayoutTemplate className="w-4 h-4" />
                Templates
              </button>
              <button onClick={createDoc} disabled={creating}
                className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#5254CC] disabled:opacity-60 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                New document
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search documents…"
              className="w-full bg-[#111113] border border-[#1F1F23] text-white placeholder-[#3F3F46] rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#6366F1] transition-colors" />
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-36 bg-[#111113] border border-[#1F1F23] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-16 h-16 bg-[#111113] border border-[#1F1F23] rounded-2xl flex items-center justify-center mb-5">
                <FileText className="w-8 h-8 text-[#2a2a2e]" />
              </div>
              <h3 className="text-white font-semibold mb-2">No documents yet</h3>
              <p className="text-[#52525B] text-sm mb-6 text-center max-w-xs">
                Create your first document to start writing and collaborating
              </p>
              <button onClick={createDoc} disabled={creating}
                className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#5254CC] text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-colors">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create document
              </button>
            </div>
          ) : search ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-4 h-4 text-[#52525B]" />
                <h2 className="text-[#71717A] text-xs font-medium uppercase tracking-widest">
                  Results for &ldquo;{search}&rdquo;
                </h2>
                {!searchLoading && (
                  <span className="text-[#3F3F46] text-xs">{searchResults.length}</span>
                )}
              </div>
              {searchLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-5 h-5 animate-spin text-[#6366F1]" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <Search className="w-7 h-7 text-[#2a2a2e]" />
                  <p className="text-[#52525B] text-sm">No documents matched &ldquo;{search}&rdquo;</p>
                  <p className="text-[#3F3F46] text-xs">Try different keywords or check the title and body of your docs.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {searchResults.map(r => <SearchResultCard key={r._id} result={r} />)}
                </div>
              )}
            </div>
          ) : (
            <>
              <Section title="My documents" docs={myDocs} icon={FileText} />
              <Section title="Shared with me" docs={sharedDocs} icon={Users} />
            </>
          )}
        </div>
      </main>

      {/* Template picker modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowTemplates(false)}>
          <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F1F23] flex-shrink-0">
              <div>
                <h2 className="text-white font-semibold">Start from a template</h2>
                <p className="text-[#52525B] text-xs mt-0.5">Pick a template and start writing in seconds</p>
              </div>
              <button onClick={() => setShowTemplates(false)} className="text-[#52525B] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6">
              {Array.from(new Set(TEMPLATES.map(t => t.category))).map(cat => (
                <div key={cat} className="mb-6">
                  <h3 className="text-[#52525B] text-xs font-medium uppercase tracking-widest mb-3">{cat}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TEMPLATES.filter(t => t.category === cat).map(template => (
                      <button key={template.id}
                        onClick={() => createFromTemplate(template)}
                        className="flex items-start gap-3 bg-[#0A0A0B] hover:bg-[#16161A] border border-[#1F1F23] hover:border-[#2a2a30] rounded-xl p-4 text-left transition-all group">
                        <span className="text-2xl flex-shrink-0 mt-0.5">{template.icon}</span>
                        <div>
                          <div className="text-white text-sm font-medium group-hover:text-[#A5B4FC] transition-colors">
                            {template.title}
                          </div>
                          <div className="text-[#52525B] text-xs mt-0.5">{template.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
