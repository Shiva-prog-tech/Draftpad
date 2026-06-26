'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FileText, Loader2, CheckCircle, XCircle, LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface InviteInfo {
  docId: string;
  docTitle: string;
  inviterName: string;
  role: string;
  email: string;
  expiresAt: string;
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [invite, setInvite]   = useState<InviteInfo | null>(null);
  const [fetchErr, setFetchErr] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [accepted,  setAccepted]  = useState(false);
  const [acceptErr, setAcceptErr] = useState('');

  // Load invite info
  useEffect(() => {
    fetch(`/api/invites/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setFetchErr(data.error);
        else setInvite(data);
      })
      .catch(() => setFetchErr('Failed to load invite'));
  }, [token]);

  const handleAccept = async () => {
    setAccepting(true);
    setAcceptErr('');
    try {
      const res = await fetch(`/api/invites/${token}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { setAcceptErr(data.error || 'Failed to accept'); setAccepting(false); return; }
      setAccepted(true);
      setTimeout(() => router.push(`/docs/${data.docId}`), 1500);
    } catch {
      setAcceptErr('Something went wrong');
      setAccepting(false);
    }
  };

  const loginUrl = `/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`;
  const registerUrl = `/register?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`;

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10 justify-center">
          <div className="w-8 h-8 bg-[#6366F1] rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">Draftpad</span>
        </div>

        <div className="bg-[#111113] border border-[#1F1F23] rounded-xl p-8">

          {/* Loading */}
          {!invite && !fetchErr && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
              <p className="text-[#71717A] text-sm">Loading invite…</p>
            </div>
          )}

          {/* Error */}
          {fetchErr && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <XCircle className="w-10 h-10 text-red-400" />
              <h2 className="text-white font-semibold">Invite unavailable</h2>
              <p className="text-[#71717A] text-sm">{fetchErr}</p>
              <Link href="/dashboard" className="text-[#6366F1] text-sm hover:text-[#818CF8] transition-colors">
                Go to dashboard
              </Link>
            </div>
          )}

          {/* Accepted */}
          {accepted && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle className="w-10 h-10 text-green-400" />
              <h2 className="text-white font-semibold">You&apos;re in!</h2>
              <p className="text-[#71717A] text-sm">Opening the document…</p>
            </div>
          )}

          {/* Invite info */}
          {invite && !accepted && (
            <>
              <p className="text-[#A1A1AA] text-xs font-semibold uppercase tracking-widest mb-3">
                Document Invitation
              </p>
              <h1 className="text-white text-xl font-bold mb-2 leading-tight">
                {invite.inviterName} invited you
              </h1>
              <p className="text-[#71717A] text-sm mb-5">
                to <span className="text-[#A1A1AA]">{invite.role}</span> the document
              </p>

              {/* Doc name */}
              <div className="bg-[#0A0A0B] border border-[#1F1F23] rounded-lg px-4 py-3 mb-5 flex items-center gap-3">
                <FileText className="w-4 h-4 text-[#6366F1] flex-shrink-0" />
                <span className="text-white text-sm font-medium truncate">{invite.docTitle}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded border flex-shrink-0 ${
                  invite.role === 'editor'
                    ? 'text-[#818CF8] bg-[#6366F1]/10 border-[#6366F1]/30'
                    : 'text-[#A1A1AA] bg-[#71717A]/10 border-[#71717A]/30'
                }`}>
                  {invite.role}
                </span>
              </div>

              {/* Not logged in */}
              {status === 'unauthenticated' && (
                <>
                  <p className="text-[#71717A] text-sm mb-4 text-center">
                    Sign in to accept this invitation
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link href={loginUrl}
                      className="w-full bg-[#6366F1] hover:bg-[#5254CC] text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                      <LogIn className="w-4 h-4" /> Sign in
                    </Link>
                    <Link href={registerUrl}
                      className="w-full bg-[#1F1F23] hover:bg-[#2a2a30] text-[#A1A1AA] hover:text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                      <UserPlus className="w-4 h-4" /> Create account
                    </Link>
                  </div>
                  <p className="text-[#3F3F46] text-xs mt-3 text-center">
                    Use the email address this invite was sent to
                  </p>
                </>
              )}

              {/* Loading session */}
              {status === 'loading' && (
                <div className="flex justify-center py-2">
                  <Loader2 className="w-5 h-5 text-[#6366F1] animate-spin" />
                </div>
              )}

              {/* Logged in */}
              {status === 'authenticated' && (
                <>
                  {/* Wrong email warning */}
                  {session.user?.email?.toLowerCase() !== invite.email.toLowerCase() && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-4">
                      <p className="text-amber-400 text-sm">
                        This invite was sent to <strong>{invite.email}</strong>.
                        You&apos;re signed in as <strong>{session.user?.email}</strong>.
                        Please sign in with the correct account.
                      </p>
                    </div>
                  )}

                  {acceptErr && (
                    <p className="text-red-400 text-sm mb-3">{acceptErr}</p>
                  )}

                  {session.user?.email?.toLowerCase() === invite.email.toLowerCase() ? (
                    <button
                      onClick={handleAccept}
                      disabled={accepting}
                      className="w-full bg-[#6366F1] hover:bg-[#5254CC] disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                      {accepting
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Accepting…</>
                        : <><CheckCircle className="w-4 h-4" /> Accept Invitation</>
                      }
                    </button>
                  ) : (
                    <Link href={loginUrl}
                      className="w-full bg-[#1F1F23] hover:bg-[#2a2a30] text-[#A1A1AA] hover:text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 block text-center">
                      <LogIn className="w-4 h-4 inline mr-1" /> Switch account
                    </Link>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
