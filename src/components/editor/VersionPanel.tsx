'use client';
import { useState } from 'react';
import { Clock, RotateCcw, Save, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SidePanel, Modal, Button } from '@/components/ui';

interface Version {
  _id: string;
  label: string;
  createdAt: string;
  size: number;
  createdByUser: { name: string; color: string };
}

interface Props {
  versions: Version[];
  loading: boolean;
  onClose: () => void;
  onRestore: (versionId: string) => Promise<boolean>;
  onSaveNow: (label: string) => Promise<void>;
}

export function VersionPanel({ versions, loading, onClose, onRestore, onSaveNow }: Props) {
  const [restoring, setRestoring] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    await onSaveNow(label || `Snapshot ${new Date().toLocaleTimeString()}`);
    setLabel('');
    setShowLabelInput(false);
    setSaving(false);
  };

  const handleRestore = async (id: string) => {
    setRestoring(id);
    const ok = await onRestore(id);
    setRestoring(null);
    setConfirmRestore(null);
    if (ok) onClose();
  };

  return (
    <>
      <SidePanel
        onClose={onClose}
        title="Version History"
        icon={<Clock className="h-3.5 w-3.5 text-white" />}
        width={320}
      >
        {/* Save now */}
        <div className="border-b border-line p-4">
          {showLabelInput ? (
            <div className="flex gap-2">
              <input value={label} onChange={e => setLabel(e.target.value)}
                placeholder="Version name…" autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowLabelInput(false); }}
                className="flex-1 rounded-lg border border-line bg-white/[0.02] px-3 py-1.5 text-xs text-white placeholder-[#3F3F46] transition-colors focus:border-accent focus:outline-none" />
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1 rounded-lg bg-accent-grad px-3 py-1.5 text-xs font-medium text-white shadow-glow-accent-sm transition-shadow hover:shadow-glow-accent disabled:opacity-50">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              </button>
            </div>
          ) : (
            <button onClick={() => setShowLabelInput(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-accent/30 py-2 text-xs font-medium text-accent transition-all hover:border-accent/60 hover:bg-accent/5">
              <Save className="h-3.5 w-3.5" />
              Save current version
            </button>
          )}
        </div>

        {/* Timeline */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-txt-muted" />
            </div>
          ) : versions.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="mx-auto mb-3 h-8 w-8 text-[#2a2a2e]" />
              <p className="text-sm text-txt-muted">No versions saved yet</p>
              <p className="mt-1 text-xs text-[#3F3F46]">Save a version to see it here</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute bottom-3 left-3 top-3 w-px bg-line" />
              <div className="space-y-1">
                {versions.map((v, i) => (
                  <div key={v._id} className="group relative pl-8">
                    <div className={`absolute left-2 top-3.5 h-2 w-2 rounded-full border-2 transition-colors ${i === 0 ? 'border-accent bg-accent' : 'border-[#3F3F46] bg-[#111113] group-hover:border-accent/50'}`} />
                    <div className="rounded-lg border border-line bg-white/[0.02] p-3 transition-colors group-hover:border-line-strong">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-white">
                            {v.label}
                            {i === 0 && <span className="ml-1.5 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] text-accent">Current</span>}
                          </p>
                          <p className="mt-0.5 text-[11px] text-txt-muted">
                            {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                          </p>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <div className="h-3.5 w-3.5 flex-shrink-0 rounded-full" style={{ backgroundColor: v.createdByUser.color }} />
                            <span className="text-[11px] text-[#71717A]">{v.createdByUser.name}</span>
                          </div>
                        </div>
                        {i !== 0 && (
                          <button onClick={() => setConfirmRestore(v._id)}
                            className="flex-shrink-0 p-1 text-txt-muted opacity-0 transition-all hover:text-accent group-hover:opacity-100"
                            title="Restore this version">
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SidePanel>

      {/* Confirm restore */}
      <Modal open={!!confirmRestore} onClose={() => setConfirmRestore(null)} title="Restore this version?" className="max-w-sm">
        <div className="p-5">
          <p className="mb-5 text-xs leading-relaxed text-[#71717A]">
            This will restore the document for all collaborators. The current state will be saved as a backup version first.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setConfirmRestore(null)} className="flex-1">Cancel</Button>
            <Button onClick={() => confirmRestore && handleRestore(confirmRestore)} loading={!!restoring} disabled={!!restoring} className="flex-1">
              {!restoring && <RotateCcw className="h-3 w-3" />}Restore
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
