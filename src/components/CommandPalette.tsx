'use client';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Search, FileText, Plus, CornerDownLeft, Loader2 } from 'lucide-react';

interface DocLite { _id: string; title: string }

export function CommandPalette() {
  const { status } = useSession();
  const router = useRouter();
  const reduce = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [docs, setDocs] = useState<DocLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // ⌘K / Ctrl+K to toggle — only when authenticated
  useEffect(() => {
    if (status !== 'authenticated') return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status]);

  // Load docs once per open
  useEffect(() => {
    if (!open) { setQuery(''); setActive(0); return; }
    setLoading(true);
    fetch('/api/documents')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setDocs(Array.isArray(d) ? d.map((x: DocLite) => ({ _id: x._id, title: x.title })) : []))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? docs.filter((d) => (d.title || 'Untitled').toLowerCase().includes(q)) : docs;
    return list.slice(0, 8);
  }, [docs, query]);

  // actions = [create, ...docs]
  const actionCount = filtered.length + 1;
  useEffect(() => { setActive(0); }, [query]);

  const run = useCallback((idx: number) => {
    setOpen(false);
    if (idx === 0) {
      // Create new document
      fetch('/api/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Document' }),
      }).then((r) => r.ok ? r.json() : null).then((doc) => { if (doc?._id) router.push(`/docs/${doc._id}`); });
    } else {
      const doc = filtered[idx - 1];
      if (doc) router.push(`/docs/${doc._id}`);
    }
  }, [filtered, router]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % actionCount); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + actionCount) % actionCount); }
    else if (e.key === 'Enter') { e.preventDefault(); run(active); }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-md"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-label="Command palette">
              <div className="pointer-events-none fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[15vh]">
              <motion.div
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -8 }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                className="pointer-events-auto w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface-grad shadow-elev-4"
              >
                <Dialog.Title className="sr-only">Command palette</Dialog.Title>
                {/* Search input */}
                <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
                  <Search className="h-4 w-4 flex-shrink-0 text-txt-muted" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Search documents or create a new one…"
                    className="w-full bg-transparent text-sm text-white placeholder-txt-muted focus:outline-none"
                  />
                  {loading && <Loader2 className="h-4 w-4 animate-spin text-txt-muted" />}
                  <kbd className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-txt-muted">ESC</kbd>
                </div>

                {/* Results */}
                <div ref={listRef} className="premium-scroll max-h-[320px] overflow-y-auto p-2">
                  {/* Create action */}
                  <Row active={active === 0} onMouseEnter={() => setActive(0)} onClick={() => run(0)}
                    icon={<Plus className="h-4 w-4 text-accent" />} label="Create new document" hint="Enter" />

                  <div className="my-1 px-2 text-[10px] font-medium uppercase tracking-widest text-txt-muted">
                    {query ? 'Matches' : 'Recent'}
                  </div>

                  {filtered.length === 0 && !loading ? (
                    <p className="px-3 py-6 text-center text-xs text-txt-muted">No documents found.</p>
                  ) : (
                    filtered.map((d, i) => (
                      <Row key={d._id} active={active === i + 1}
                        onMouseEnter={() => setActive(i + 1)} onClick={() => run(i + 1)}
                        icon={<FileText className="h-4 w-4 text-txt-muted" />}
                        label={d.title || 'Untitled Document'} />
                    ))
                  )}
                </div>
              </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function Row({ active, icon, label, hint, onMouseEnter, onClick }: {
  active: boolean; icon: React.ReactNode; label: string; hint?: string;
  onMouseEnter: () => void; onClick: () => void;
}) {
  return (
    <button
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
        active ? 'bg-accent-grad-soft text-white' : 'text-txt-secondary'
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {active && (
        <span className="flex items-center gap-1 text-[10px] text-txt-muted">
          {hint ?? <CornerDownLeft className="h-3 w-3" />}
        </span>
      )}
    </button>
  );
}
