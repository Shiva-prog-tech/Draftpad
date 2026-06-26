'use client';
import { useState } from 'react';
import { X, UserPlus, Loader2, Crown, Edit3, Eye, Trash2 } from 'lucide-react';
import { Collaborator } from '@/types';

interface Props {
  docId: string;
  collaborators: Collaborator[];
  onClose: () => void;
  onUpdate: () => void;
  currentUserId: string;
}

const roleConfig = {
  owner:  { label: 'Owner',  color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', icon: Crown },
  editor: { label: 'Editor', color: 'text-[#6366F1] bg-[#6366F1]/10 border-[#6366F1]/20',   icon: Edit3 },
  viewer: { label: 'Viewer', color: 'text-[#71717A] bg-[#71717A]/10 border-[#71717A]/20',   icon: Eye  },
};

export function ShareModal({ docId, collaborators, onClose, onUpdate, currentUserId }: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isOwner = collaborators.find(c => c.userId === currentUserId)?.role === 'owner';

  const invite = async () => {
    if (!email.trim()) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/documents/${docId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to invite'); }
      else { setSuccess(`Invite sent to ${email}`); setEmail(''); }
    } catch { setError('Something went wrong'); }
    finally { setLoading(false); }
  };

  const changeRole = async (userId: string, newRole: 'editor' | 'viewer') => {
    await fetch(`/api/documents/${docId}/collaborators`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    });
    onUpdate();
  };

  const removeCollab = async (userId: string) => {
    await fetch(`/api/documents/${docId}/collaborators?userId=${userId}`, { method: 'DELETE' });
    onUpdate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#111113] border border-[#1F1F23] rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1F1F23]">
          <div>
            <h2 className="text-white font-semibold">Share document</h2>
            <p className="text-[#52525B] text-xs mt-0.5">{collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="text-[#52525B] hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invite */}
        {isOwner && (
          <div className="p-5 border-b border-[#1F1F23]">
            <div className="flex gap-2">
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                onKeyDown={e => e.key === 'Enter' && invite()}
                className="flex-1 bg-[#0A0A0B] border border-[#1F1F23] text-white placeholder-[#3F3F46] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
              />
              <select value={role} onChange={e => setRole(e.target.value as any)}
                className="bg-[#0A0A0B] border border-[#1F1F23] text-[#A1A1AA] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366F1] transition-colors">
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button onClick={invite} disabled={loading || !email.trim()}
                className="bg-[#6366F1] hover:bg-[#5254CC] disabled:opacity-50 text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1.5">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            {success && <p className="text-green-400 text-xs mt-2">{success}</p>}
          </div>
        )}

        {/* Collaborators list */}
        <div className="p-5 space-y-3 max-h-64 overflow-y-auto">
          {collaborators.map(c => {
            const cfg = roleConfig[c.role];
            const Icon = cfg.icon;
            return (
              <div key={c.userId} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                  style={{ backgroundColor: c.color }}>
                  {c.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{c.name}
                    {c.userId === currentUserId && <span className="text-[#52525B] font-normal ml-1">(you)</span>}
                  </p>
                  <p className="text-[#52525B] text-xs truncate">{c.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isOwner && c.role !== 'owner' && c.userId !== currentUserId ? (
                    <>
                      <select value={c.role} onChange={e => changeRole(c.userId, e.target.value as any)}
                        className="bg-[#0A0A0B] border border-[#1F1F23] text-[#A1A1AA] rounded px-2 py-1 text-xs focus:outline-none">
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button onClick={() => removeCollab(c.userId)}
                        className="text-[#52525B] hover:text-red-400 transition-colors p-1">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border ${cfg.color}`}>
                      <Icon className="w-3 h-3" />{cfg.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
