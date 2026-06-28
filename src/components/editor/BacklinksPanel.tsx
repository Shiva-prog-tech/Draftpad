'use client';
import { useState, useEffect } from 'react';
import { Link2, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { SidePanel } from '@/components/ui';

interface BacklinkDoc { _id: string; title: string; updatedAt: string; }
interface Props { docId: string; onClose: () => void; }

export function BacklinksPanel({ docId, onClose }: Props) {
  const [loading,   setLoading]   = useState(true);
  const [backlinks, setBacklinks] = useState<BacklinkDoc[]>([]);
  const [error,     setError]     = useState('');

  useEffect(() => {
    fetch(`/api/documents/${docId}/backlinks`)
      .then(r => r.json())
      .then(d => setBacklinks(d.backlinks ?? []))
      .catch(() => setError('Failed to load backlinks'))
      .finally(() => setLoading(false));
  }, [docId]);

  return (
    <SidePanel
      onClose={onClose}
      title="Backlinks"
      icon={<Link2 className="h-3.5 w-3.5 text-white" />}
      width={300}
      subtitle={!loading && !error ? `${backlinks.length} reference${backlinks.length !== 1 ? 's' : ''}` : undefined}
    >
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
          </div>
        ) : error ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : backlinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Link2 className="h-6 w-6 text-[#2a2a2e]" />
            <p className="text-xs leading-relaxed text-txt-muted">No documents link to this one yet.</p>
            <p className="mt-1 text-[10px] leading-relaxed text-[#3F3F46]">
              Use <span className="font-mono text-txt-muted">/link</span> in any document to create a backlink.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {backlinks.map(b => (
              <Link
                key={b._id}
                href={`/docs/${b._id}`}
                target="_blank"
                className="group flex items-center justify-between gap-2 rounded-xl border border-line bg-white/[0.02] p-3 transition-all hover:border-accent/40 hover:bg-white/[0.04]"
              >
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-white transition-colors group-hover:text-[#A5B4FC]">{b.title}</div>
                  <div className="mt-0.5 text-[10px] text-txt-muted">
                    {formatDistanceToNow(new Date(b.updatedAt), { addSuffix: true })}
                  </div>
                </div>
                <ExternalLink className="h-3 w-3 flex-shrink-0 text-[#3F3F46] transition-colors group-hover:text-accent" />
              </Link>
            ))}
            <p className="pt-2 text-[10px] leading-relaxed text-[#3F3F46]">Backlinks update when documents are saved.</p>
          </div>
        )}
      </div>
    </SidePanel>
  );
}
