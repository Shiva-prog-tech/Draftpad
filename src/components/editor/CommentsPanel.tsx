'use client';
import { useState, useEffect, useCallback } from 'react';
import { Send, Check, Loader2, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from 'next-auth/react';
import { MessageSquare } from 'lucide-react';
import { SidePanel } from '@/components/ui';

interface Reply {
  userId: string;
  userName: string;
  userColor: string;
  text: string;
  createdAt: string;
}

interface Comment {
  _id: string;
  userId: string;
  userName: string;
  userColor: string;
  text: string;
  quote: string;
  resolved: boolean;
  replies: Reply[];
  createdAt: string;
}

interface Props {
  docId: string;
  pendingQuote: string;
  onClose: () => void;
  onClearPendingQuote: () => void;
}

export function CommentsPanel({ docId, pendingQuote, onClose, onClearPendingQuote }: Props) {
  const { data: session } = useSession();
  const [comments, setComments]           = useState<Comment[]>([]);
  const [loading, setLoading]             = useState(true);
  const [newText, setNewText]             = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [replyingTo, setReplyingTo]       = useState<string | null>(null);
  const [replyText, setReplyText]         = useState('');
  const [showResolved, setShowResolved]   = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${docId}/comments`);
      if (res.ok) setComments(await res.json());
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  // Auto-focus the new comment form when a quote arrives
  useEffect(() => { if (pendingQuote) setNewText(''); }, [pendingQuote]);

  const submitComment = async () => {
    if (!newText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/documents/${docId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText, quote: pendingQuote }),
      });
      if (res.ok) {
        await fetchComments();
        setNewText('');
        onClearPendingQuote();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (commentId: string) => {
    if (!replyText.trim()) return;
    const res = await fetch(`/api/documents/${docId}/comments`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId, text: replyText }),
    });
    if (res.ok) {
      await fetchComments();
      setReplyText('');
      setReplyingTo(null);
    }
  };

  const resolveComment = async (commentId: string) => {
    await fetch(`/api/documents/${docId}/comments`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId }),
    });
    fetchComments();
  };

  const active   = comments.filter(c => !c.resolved);
  const resolved = comments.filter(c => c.resolved);

  return (
    <SidePanel
      onClose={onClose}
      title="Comments"
      icon={<MessageSquare className="h-3.5 w-3.5 text-white" />}
      width={320}
      headerExtra={active.length > 0 ? (
        <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent">{active.length}</span>
      ) : undefined}
    >
      {/* New comment form — always visible */}
      <div className="m-3 rounded-xl border border-accent/30 bg-white/[0.02] p-3">
        {pendingQuote ? (
          <>
            <div className="mb-1.5 text-[10px] uppercase tracking-wide text-txt-muted">Commenting on</div>
            <blockquote className="mb-3 line-clamp-2 border-l-2 border-accent pl-2 text-[11px] italic text-txt-secondary">
              &ldquo;{pendingQuote}&rdquo;
            </blockquote>
          </>
        ) : (
          <div className="mb-2 text-[10px] uppercase tracking-wide text-txt-muted">New comment</div>
        )}
        <textarea
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) submitComment(); }}
          placeholder={pendingQuote ? 'Add a comment… (⌘Enter to post)' : 'Write a comment… (⌘Enter to post)'}
          autoFocus={!!pendingQuote}
          rows={2}
          className="mb-2 w-full resize-none rounded-lg border border-line bg-[#111113] px-3 py-2 text-xs text-white placeholder-[#3F3F46] transition-colors focus:border-accent focus:outline-none"
        />
        <div className="flex justify-end gap-2">
          {pendingQuote && (
            <button onClick={onClearPendingQuote} className="px-3 py-1.5 text-xs text-txt-muted transition-colors hover:text-white">
              Cancel
            </button>
          )}
          <button onClick={submitComment} disabled={!newText.trim() || submitting}
            className="flex items-center gap-1.5 rounded-lg bg-accent-grad px-3 py-1.5 text-xs text-white shadow-glow-accent-sm transition-shadow hover:shadow-glow-accent disabled:opacity-50">
            {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Post
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-txt-muted" />
        </div>
      ) : active.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white/[0.02]">
            <MessageSquare className="h-5 w-5 text-[#2a2a2e]" />
          </div>
          <p className="text-xs font-medium text-txt-muted">No comments yet</p>
          <p className="mt-1 text-[10px] text-[#3F3F46]">Write above, or select text for a quoted comment</p>
        </div>
      ) : (
        <div className="space-y-2.5 p-3">
          {active.map(comment => (
            <CommentCard
              key={comment._id}
              comment={comment}
              currentUserId={session?.user?.id || ''}
              replyingTo={replyingTo}
              replyText={replyText}
              onReply={() => { setReplyingTo(comment._id); setReplyText(''); }}
              onReplyTextChange={setReplyText}
              onSubmitReply={() => submitReply(comment._id)}
              onResolve={() => resolveComment(comment._id)}
            />
          ))}

          {resolved.length > 0 && (
            <div className="pt-2">
              <button
                onClick={() => setShowResolved(v => !v)}
                className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[#3F3F46] transition-colors hover:text-[#71717A]">
                <CheckCheck className="h-3 w-3" />
                Resolved ({resolved.length}) {showResolved ? '▲' : '▼'}
              </button>
              {showResolved && resolved.map(comment => (
                <div key={comment._id} className="mb-2.5 opacity-50">
                  <CommentCard
                    comment={comment}
                    currentUserId={session?.user?.id || ''}
                    replyingTo={null}
                    replyText=""
                    onReply={() => {}}
                    onReplyTextChange={() => {}}
                    onSubmitReply={() => {}}
                    onResolve={() => {}}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </SidePanel>
  );
}

function CommentCard({ comment, replyingTo, replyText, onReply, onReplyTextChange, onSubmitReply, onResolve }: {
  comment: Comment;
  currentUserId: string;
  replyingTo: string | null;
  replyText: string;
  onReply: () => void;
  onReplyTextChange: (t: string) => void;
  onSubmitReply: () => void;
  onResolve: () => void;
}) {
  const isReplying = replyingTo === comment._id;

  return (
    <div className="rounded-xl border border-line bg-white/[0.02] p-3">
      {comment.quote && (
        <blockquote className="mb-2.5 line-clamp-2 border-l-2 border-accent pl-2 text-[10px] italic text-txt-muted">
          &ldquo;{comment.quote}&rdquo;
        </blockquote>
      )}

      <div className="flex items-start gap-2">
        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ring-1 ring-white/10"
          style={{ backgroundColor: comment.userColor }}>
          {comment.userName[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-baseline gap-1.5">
            <span className="text-[11px] font-semibold text-white">{comment.userName}</span>
            <span className="text-[9px] text-[#3F3F46]">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-txt-secondary">{comment.text}</p>
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="ml-7 mt-2 space-y-2 border-l border-line pl-2">
          {comment.replies.map((reply, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <div className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white"
                style={{ backgroundColor: reply.userColor }}>
                {reply.userName[0]?.toUpperCase()}
              </div>
              <div>
                <span className="mr-1.5 text-[10px] font-semibold text-white">{reply.userName}</span>
                <span className="text-[10px] text-txt-secondary">{reply.text}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isReplying && (
        <div className="ml-7 mt-2 flex gap-1.5">
          <input
            value={replyText}
            onChange={e => onReplyTextChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSubmitReply()}
            placeholder="Reply…"
            autoFocus
            className="flex-1 rounded-lg border border-line bg-[#111113] px-2.5 py-1.5 text-[10px] text-white placeholder-[#3F3F46] transition-colors focus:border-accent focus:outline-none"
          />
          <button onClick={onSubmitReply}
            className="flex-shrink-0 rounded-lg bg-accent-grad px-2 py-1.5 text-white transition-colors hover:opacity-90">
            <Send className="h-3 w-3" />
          </button>
        </div>
      )}

      {!comment.resolved && (
        <div className="ml-7 mt-2 flex items-center gap-3">
          <button onClick={onReply} className="text-[10px] text-txt-muted transition-colors hover:text-txt-secondary">
            Reply
          </button>
          <button onClick={onResolve} className="flex items-center gap-1 text-[10px] text-txt-muted transition-colors hover:text-green-400">
            <Check className="h-2.5 w-2.5" /> Resolve
          </button>
        </div>
      )}
    </div>
  );
}
