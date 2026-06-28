/**
 * AI cover images via Pollinations — free, no API key, generated on demand from
 * a prompt embedded in the URL. We use a deterministic seed per template so the
 * URL is stable and the browser/CDN caches it (one generation, then reused).
 */
const BASE = 'https://image.pollinations.ai/prompt';

/** Stable non-negative hash for seeding. */
export function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % 100000;
}

export function coverImageUrl(prompt: string, seed: number, width = 400, height = 220): string {
  const refined = `${prompt}, abstract minimal premium dark gradient artwork, indigo and violet, soft glow, cinematic, no text, no words`;
  return `${BASE}/${encodeURIComponent(refined)}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=turbo`;
}
