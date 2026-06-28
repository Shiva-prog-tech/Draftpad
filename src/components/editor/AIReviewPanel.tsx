'use client';
import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, AlertCircle, ThumbsUp, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';

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
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-[#111113] border-l border-[#1F1F23] z-30 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F23] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#6366F1]" />
          <span className="text-white text-sm font-semibold">AI Review</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={run}
            disabled={loading}
            title="Re-run review"
            className="p-1.5 text-[#52525B] hover:text-white transition-colors rounded-lg hover:bg-[#1F1F23] disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-[#52525B] hover:text-white transition-colors rounded-lg hover:bg-[#1F1F23]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#6366F1]" />
            <p className="text-[#52525B] text-xs text-center leading-relaxed">
              Analyzing your document…<br />This may take a moment.
            </p>
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-xs leading-relaxed">{error}</p>
          </div>
        ) : review ? (
          <>
            {/* Score ring */}
            <div className="flex items-center gap-4 p-4 bg-[#0A0A0B] border border-[#1F1F23] rounded-xl">
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
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
                  <span className="text-white text-xl font-bold tabular-nums">{review.score}</span>
                </div>
              </div>
              <div>
                <div className="text-white text-sm font-semibold">Quality Score</div>
                <div className="text-[#52525B] text-xs mt-0.5">out of 10</div>
                <div className="text-xs mt-1.5 font-medium" style={{ color: scoreColor }}>
                  {review.score >= 8 ? 'Excellent' : review.score >= 6 ? 'Good — improvable' : 'Needs work'}
                </div>
              </div>
            </div>

            {/* Overview */}
            {review.summary && (
              <div className="p-3 bg-[#0A0A0B] border border-[#1F1F23] rounded-xl">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3 h-3 text-[#6366F1]" />
                  <span className="text-[#6366F1] text-[10px] font-semibold uppercase tracking-wider">Overview</span>
                </div>
                <p className="text-[#A1A1AA] text-[11px] leading-relaxed">{review.summary}</p>
              </div>
            )}

            {/* Strengths */}
            {review.strengths.length > 0 && (
              <div className="p-3 bg-[#0A0A0B] border border-[#1F1F23] rounded-xl">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <ThumbsUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">Strengths</span>
                </div>
                <ul className="space-y-2">
                  {review.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-[#A1A1AA] leading-relaxed">
                      <span className="text-emerald-400 flex-shrink-0">✓</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Issues */}
            {review.issues.length > 0 && (
              <div className="p-3 bg-[#0A0A0B] border border-[#1F1F23] rounded-xl">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-400 text-[10px] font-semibold uppercase tracking-wider">Issues</span>
                </div>
                <ul className="space-y-2">
                  {review.issues.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-[#A1A1AA] leading-relaxed">
                      <span className="text-amber-400 flex-shrink-0">!</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {review.suggestions.length > 0 && (
              <div className="p-3 bg-[#0A0A0B] border border-[#6366F1]/20 rounded-xl">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Lightbulb className="w-3 h-3 text-[#818CF8]" />
                  <span className="text-[#818CF8] text-[10px] font-semibold uppercase tracking-wider">Suggestions</span>
                </div>
                <ul className="space-y-2">
                  {review.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-[#A1A1AA] leading-relaxed">
                      <span className="text-[#6366F1] font-semibold flex-shrink-0 tabular-nums">{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
