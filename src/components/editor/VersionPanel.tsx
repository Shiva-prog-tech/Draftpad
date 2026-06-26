'use client';
import { useState } from 'react';
import { X, Clock, RotateCcw, Save, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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
    <div className="fixed inset-y-0 right-0 z-40 w-80 bg-[#111113] border-l border-[#1F1F23] flex flex-col shadow-2xl animate-[slideRight_0.25s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1F1F23]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#6366F1]" />
          <h2 className="text-white font-semibold text-sm">Version History</h2>
        </div>
        <button onClick={onClose} className="text-[#52525B] hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Save now */}
      <div className="p-4 border-b border-[#1F1F23]">
        {showLabelInput ? (
          <div className="flex gap-2">
            <input value={label} onChange={e => setLabel(e.target.value)}
              placeholder="Version name…" autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowLabelInput(false); }}
              className="flex-1 bg-[#0A0A0B] border border-[#1F1F23] text-white placeholder-[#3F3F46] rounded px-3 py-1.5 text-xs focus:outline-none focus:border-[#6366F1]" />
            <button onClick={handleSave} disabled={saving}
              className="bg-[#6366F1] text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-[#5254CC] disabled:opacity-50 flex items-center gap-1">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            </button>
          </div>
        ) : (
          <button onClick={() => setShowLabelInput(true)}
            className="w-full flex items-center justify-center gap-2 text-[#6366F1] border border-[#6366F1]/30 hover:border-[#6366F1]/60 hover:bg-[#6366F1]/5 rounded-lg py-2 text-xs font-medium transition-all">
            <Save className="w-3.5 h-3.5" />
            Save current version
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-[#52525B]" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-8 h-8 text-[#2a2a2e] mx-auto mb-3" />
            <p className="text-[#52525B] text-sm">No versions saved yet</p>
            <p className="text-[#3F3F46] text-xs mt-1">Save a version to see it here</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-3 bottom-3 w-px bg-[#1F1F23]" />
            <div className="space-y-1">
              {versions.map((v, i) => (
                <div key={v._id} className="relative pl-8 group">
                  {/* Dot */}
                  <div className={`absolute left-2 top-3.5 w-2 h-2 rounded-full border-2 transition-colors ${i === 0 ? 'border-[#6366F1] bg-[#6366F1]' : 'border-[#3F3F46] bg-[#111113] group-hover:border-[#6366F1]/50'}`} />
                  <div className="bg-[#0A0A0B] border border-[#1F1F23] group-hover:border-[#2a2a30] rounded-lg p-3 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white text-xs font-medium truncate">
                          {v.label}
                          {i === 0 && <span className="ml-1.5 text-[10px] bg-[#6366F1]/20 text-[#6366F1] px-1.5 py-0.5 rounded">Current</span>}
                        </p>
                        <p className="text-[#52525B] text-[11px] mt-0.5">
                          {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <div className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: v.createdByUser.color }} />
                          <span className="text-[#71717A] text-[11px]">{v.createdByUser.name}</span>
                        </div>
                      </div>
                      {i !== 0 && (
                        <button onClick={() => setConfirmRestore(v._id)}
                          className="opacity-0 group-hover:opacity-100 text-[#52525B] hover:text-[#6366F1] transition-all flex-shrink-0 p-1"
                          title="Restore this version">
                          <RotateCcw className="w-3.5 h-3.5" />
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

      {/* Confirm restore dialog */}
      {confirmRestore && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-[#111113] border border-[#1F1F23] rounded-xl p-5 w-full">
            <h3 className="text-white font-semibold mb-2 text-sm">Restore this version?</h3>
            <p className="text-[#71717A] text-xs mb-5 leading-relaxed">
              This will restore the document for all collaborators. The current state will be saved as a backup version first.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmRestore(null)}
                className="flex-1 border border-[#1F1F23] text-[#A1A1AA] rounded-lg py-2 text-xs font-medium hover:border-[#2a2a30] transition-colors">
                Cancel
              </button>
              <button onClick={() => handleRestore(confirmRestore)} disabled={!!restoring}
                className="flex-1 bg-[#6366F1] hover:bg-[#5254CC] text-white rounded-lg py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50">
                {restoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
