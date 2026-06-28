'use client';
import { useState, useEffect } from 'react';
import { Sparkles, Loader2, AlertCircle, ThumbsUp, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import { SidePanel } from '@/components/ui';

interface ReviewResult {
  score: number;
  summary: string;
  strengths: string[];
  issues: string[];
  suggestions: string[];
}

interface Props {
  content: string;
  title: string;
  onClose: () => void;
}

function htmlToText(html: string): string {
  if (typeof window === 'undefined') return '';
  const el = document.createElement('div');
  el.innerHTML = html;
  return el.textContent || '';
}

function parseReview(text: string): ReviewResult {
  const result: ReviewResult = { score: 0, summary: '', strengths: [], issues: [], suggestions: [] };
  let section = '';
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (/^SCORE:/i.test(line)) {
      result.score = parseInt(line.replace(/^SCORE:\s*/i, '')) || 0;
    } else if (/^SUMMARY:/i.test(line)) {
      const rest = line.replace(/^SUMMARY:\s*/i, '');
      if (rest) result.summary = rest;
      section = 'summary';
    } else if (/^STRENGTHS?:/i.test(line)) {
      section = 'strengths';
    } else if (/^ISSUES?:/i.test(line)) {
      section = 'issues';
    } else if (/^SUGGESTIONS?:/i.test(line)) {
      section = 'suggestions';
    } else if (/^[-•*\d+.]/.test(line)) {
      const item = line.replace(/^[-•*\d+.]+\s*/, '').trim();
      if (!item) continue;
      if (section === 'strengths') result.strengths.push(item);
      else if (section === 'issues') result.issues.push(item);
      else if (section === 'suggestions') result.suggestions.push(item);
    } else if (section === 'summary' && !result.summary) {
      result.summary = line;
    }
  }
  return result;
}

export function AIReviewPanel({ content, title, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [review, setReview]   = useState<ReviewResult | null>(null);
  const [error, setError]     = useState('');

  const run = async () => {
    setLoading(true);
    setError('');
    setReview(null);
    const text = htmlToText(content).trim();
    if (!text) {
      setError('Document is empty. Add some content first.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review',
          prompt: `Review this document titled: "${title}"`,
          context: text.slice(0, 5000),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Review failed');
      setReview(parseReview(data.result));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to get review');
    } finally {
      setLoading(false);
    }
  };

  // Auto-run on open
  useEffect(() => { run(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scoreColor = !review ? '#52525B'
    : review.score >= 8 ? '#10B981'
    : review.score >= 6 ? '#F59E0B'
    : '#EF4444';

  // r=15.9155 gives circumference ≈ 100, so dashoffset = 100 - score*10
  const dashOffset = review ? 100 - review.score * 10 : 100;

  return (
    <SidePanel
      onClose={onClose}
      title="AI Review"
      icon={<Sparkles className="h-3.5 w-3.5 text-white" />}
      width={320}
      headerExtra={
        <button
          onClick={run}
          disabled={loading}
          title="Re-run review"
          className="rounded-lg p-2 text-txt-muted transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      }
    >
      <div className="space-y-3 p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <p className="text-center text-xs leading-relaxed text-txt-muted">
              Analyzing your document…<br />This may take a moment.
            </p>
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
            <p className="text-xs leading-relaxed text-red-400">{error}</p>
          </div>
        ) : review ? (
          <>
            {/* Score ring */}
            <div className="flex items-center gap-4 rounded-xl border border-line bg-white/[0.02] p-4">
              <div className="relative h-16 w-16 flex-shrink-0">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#1F1F23" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9155"
                    fill="none"
                    stroke={scoreColor}
                    strokeWidth="3"
                    strokeDasharray="100 100"
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold tabular-nums text-white">{review.score}</span>
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Quality Score</div>
                <div className="mt-0.5 text-xs text-txt-muted">out of 10</div>
                <div className="mt-1.5 text-xs font-medium" style={{ color: scoreColor }}>
                  {review.score >= 8 ? 'Excellent' : review.score >= 6 ? 'Good — improvable' : 'Needs work'}
                </div>
              </div>
            </div>

            {review.summary && (
              <div className="rounded-xl border border-line bg-white/[0.02] p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-accent" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">Overview</span>
                </div>
                <p className="text-[11px] leading-relaxed text-txt-secondary">{review.summary}</p>
              </div>
            )}

            {review.strengths.length > 0 && (
              <div className="rounded-xl border border-line bg-white/[0.02] p-3">
                <div className="mb-2.5 flex items-center gap-1.5">
                  <ThumbsUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Strengths</span>
                </div>
                <ul className="space-y-2">
                  {review.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed text-txt-secondary">
                      <span className="flex-shrink-0 text-emerald-400">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {review.issues.length > 0 && (
              <div className="rounded-xl border border-line bg-white/[0.02] p-3">
                <div className="mb-2.5 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Issues</span>
                </div>
                <ul className="space-y-2">
                  {review.issues.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed text-txt-secondary">
                      <span className="flex-shrink-0 text-amber-400">!</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {review.suggestions.length > 0 && (
              <div className="rounded-xl border border-accent/20 bg-white/[0.02] p-3">
                <div className="mb-2.5 flex items-center gap-1.5">
                  <Lightbulb className="h-3 w-3 text-[#818CF8]" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#818CF8]">Suggestions</span>
                </div>
                <ul className="space-y-2">
                  {review.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed text-txt-secondary">
                      <span className="flex-shrink-0 font-semibold tabular-nums text-accent">{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : null}
      </div>
    </SidePanel>
  );
}
