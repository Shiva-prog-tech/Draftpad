import { pollinationsUrl } from '@/lib/pollinations';

/**
 * Client helper for the one image service. Returns a base64 data URI that can be
 * dropped straight into a document (<img src>) or embedded in a .pptx.
 *
 * Strategy: warm the Pollinations CDN cache in the BROWSER first (no serverless
 * time limit, so it can wait through Pollinations' throttle queue), then ask our
 * /api/image proxy for the same URL — which is now an instant Cloudflare cache
 * hit, avoiding the 504 timeouts the proxy hit when generating cold.
 */
function warmCache(url: string, timeoutMs = 40_000): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const t = setTimeout(() => { img.src = ''; reject(new Error('timeout')); }, timeoutMs);
    img.onload = () => { clearTimeout(t); resolve(); };
    img.onerror = () => { clearTimeout(t); reject(new Error('failed')); };
    img.src = url;
  });
}

async function runGeneration(
  prompt: string,
  opts?: { width?: number; height?: number; seed?: number },
): Promise<string> {
  const width = opts?.width ?? 768;
  const height = opts?.height ?? 512;
  const seed = opts?.seed ?? Math.floor(Math.random() * 1_000_000);

  // Generate + cache in the browser first (best-effort).
  try { await warmCache(pollinationsUrl(prompt, { width, height, seed })); } catch { /* fall through to proxy */ }

  const res = await fetch('/api/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, width, height, seed }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Image generation failed');
  return data.dataUri as string;
}

// Serialize all image generations: Pollinations' free tier throttles concurrent
// requests hard (causing stalls/504s), so we run them one at a time globally.
let queue: Promise<unknown> = Promise.resolve();

export function generateImageDataUri(
  prompt: string,
  opts?: { width?: number; height?: number; seed?: number },
): Promise<string> {
  const result = queue.then(() => runGeneration(prompt, opts));
  // Keep the chain alive even if this one fails.
  queue = result.then(() => undefined, () => undefined);
  return result;
}
