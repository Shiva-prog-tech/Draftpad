'use client';
import { useState, useEffect } from 'react';
import { X, Link2, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

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
    <div className="fixed right-0 top-0 bottom-0 w-72 bg-[#111113] border-l border-[#1F1F23] z-30 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F23] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[#6366F1]" />
          <span className="text-white text-sm font-semibold">Backlinks</span>
          {!loading && (
            <span className="text-[#3F3F46] text-xs">{backlinks.length}</span>
          )}
        </div>
        <button onClick={onClose} className="p-1.5 text-[#52525B] hover:text-white transition-colors rounded-lg hover:bg-[#1F1F23]">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-4 h-4 animate-spin text-[#6366F1]" />
          </div>
        ) : error ? (
          <p className="text-red-400 text-xs">{error}</p>
        ) : backlinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <Link2 className="w-6 h-6 text-[#2a2a2e]" />
            <p className="text-[#52525B] text-xs leading-relaxed">
              No documents link to this one yet.
            </p>
            <p className="text-[#3F3F46] text-[10px] leading-relaxed mt-1">
              Use <span className="font-mono text-[#52525B]">/link</span> in any document to create a backlink.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[#3F3F46] text-[10px] uppercase tracking-widest font-medium mb-3">
              Referenced in {backlinks.length} doc{backlinks.length !== 1 ? 's' : ''}
            </p>
            {backlinks.map(b => (
              <Link
                key={b._id}
                href={`/docs/${b._id}`}
                target="_blank"
                className="flex items-center justify-between gap-2 p-3 bg-[#0A0A0B] border border-[#1F1F23] hover:border-[#6366F1]/40 rounded-xl group transition-all"
              >
                <div className="min-w-0">
                  <div className="text-white text-xs font-medium truncate group-hover:text-[#A5B4FC] transition-colors">
                    {b.title}
                  </div>
                  <div className="text-[#52525B] text-[10px] mt-0.5">
                    {formatDistanceToNow(new Date(b.updatedAt), { addSuffix: true })}
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 text-[#3F3F46] group-hover:text-[#6366F1] flex-shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#1F1F23] flex-shrink-0">
        <p className="text-[#3F3F46] text-[10px] leading-relaxed">
          Backlinks update when documents are saved.
        </p>
      </div>
    </div>
  );
}
