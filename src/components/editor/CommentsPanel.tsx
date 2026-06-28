'use client';
import { useState, useEffect, useCallback } from 'react';
import { X, MessageSquare, Send, Check, Loader2, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from 'next-auth/react';

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
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-[#111113] border-l border-[#1F1F23] z-30 flex flex-col shadow-2xl animate-[slideRight_0.2s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F23] flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#6366F1]" />
          <span className="text-white text-sm font-semibold">Comments</span>
          {active.length > 0 && (
            <span className="text-[10px] bg-[#6366F1]/20 text-[#6366F1] px-1.5 py-0.5 rounded-full font-medium">
              {active.length}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-[#52525B] hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* New comment form — always visible */}
        <div className="m-3 bg-[#0A0A0B] border border-[#6366F1]/30 rounded-xl p-3">
          {pendingQuote ? (
            <>
              <div className="text-[10px] text-[#52525B] uppercase tracking-wide mb-1.5">Commenting on</div>
              <blockquote className="border-l-2 border-[#6366F1] pl-2 text-[#71717A] text-[11px] mb-3 line-clamp-2 italic">
                &ldquo;{pendingQuote}&rdquo;
              </blockquote>
            </>
          ) : (
            <div className="text-[10px] text-[#52525B] uppercase tracking-wide mb-2">New comment</div>
          )}
          <textarea
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) submitComment(); }}
            placeholder={pendingQuote ? 'Add a comment… (⌘Enter to post)' : 'Write a comment… (⌘Enter to post)'}
            autoFocus={!!pendingQuote}
            rows={2}
            className="w-full bg-[#111113] border border-[#1F1F23] text-white placeholder-[#3F3F46] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#6366F1] resize-none mb-2 transition-colors"
          />
          <div className="flex justify-end gap-2">
            {pendingQuote && (
              <button onClick={onClearPendingQuote}
                className="text-[#52525B] hover:text-white text-xs px-3 py-1.5 transition-colors">
                Cancel
              </button>
            )}
            <button onClick={submitComment} disabled={!newText.trim() || submitting}
              className="bg-[#6366F1] hover:bg-[#5254CC] disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
              {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Post
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-[#52525B]" />
          </div>
        ) : active.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-10 h-10 bg-[#111113] border border-[#1F1F23] rounded-xl flex items-center justify-center mb-3">
              <MessageSquare className="w-5 h-5 text-[#2a2a2e]" />
            </div>
            <p className="text-[#52525B] text-xs font-medium">No comments yet</p>
            <p className="text-[#3F3F46] text-[10px] mt-1">Write above, or select text for a quoted comment</p>
          </div>
        ) : (
          <div className="p-3 space-y-2.5">
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
                  className="flex items-center gap-1.5 text-[#3F3F46] hover:text-[#71717A] text-[10px] uppercase tracking-wide mb-2 transition-colors">
                  <CheckCheck className="w-3 h-3" />
                  Resolved ({resolved.length}) {showResolved ? '▲' : '▼'}
                </button>
                {showResolved && resolved.map(comment => (
                  <div key={comment._id} className="opacity-50 mb-2.5">
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
      </div>
    </div>
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
    <div className="bg-[#0A0A0B] border border-[#1F1F23] rounded-xl p-3">
      {comment.quote && (
        <blockquote className="border-l-2 border-[#6366F1] pl-2 text-[#52525B] text-[10px] mb-2.5 line-clamp-2 italic">
          &ldquo;{comment.quote}&rdquo;
        </blockquote>
      )}

      <div className="flex items-start gap-2">
        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
          style={{ backgroundColor: comment.userColor }}>
          {comment.userName[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 mb-0.5">
            <span className="text-white text-[11px] font-semibold">{comment.userName}</span>
            <span className="text-[#3F3F46] text-[9px]">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-[#A1A1AA] text-xs leading-relaxed">{comment.text}</p>
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="ml-7 mt-2 space-y-2 border-l border-[#1F1F23] pl-2">
          {comment.replies.map((reply, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white flex-shrink-0 mt-0.5"
                style={{ backgroundColor: reply.userColor }}>
                {reply.userName[0]?.toUpperCase()}
              </div>
              <div>
                <span className="text-white text-[10px] font-semibold mr-1.5">{reply.userName}</span>
                <span className="text-[#A1A1AA] text-[10px]">{reply.text}</span>
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
            className="flex-1 bg-[#111113] border border-[#1F1F23] text-white placeholder-[#3F3F46] rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-[#6366F1] transition-colors"
          />
          <button onClick={onSubmitReply}
            className="bg-[#6366F1] hover:bg-[#5254CC] text-white rounded-lg px-2 py-1.5 transition-colors flex-shrink-0">
            <Send className="w-3 h-3" />
          </button>
        </div>
      )}

      {!comment.resolved && (
        <div className="flex items-center gap-3 mt-2 ml-7">
          <button onClick={onReply}
            className="text-[#52525B] hover:text-[#A1A1AA] text-[10px] transition-colors">
            Reply
          </button>
          <button onClick={onResolve}
            className="text-[#52525B] hover:text-green-400 text-[10px] transition-colors flex items-center gap-1">
            <Check className="w-2.5 h-2.5" /> Resolve
          </button>
        </div>
      )}
    </div>
  );
}
