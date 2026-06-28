/**
 * Shared Pollinations URL builder — pure, safe on both client and server.
 * Client and server MUST build the identical URL so the browser can warm the
 * Cloudflare cache and the server proxy then gets an instant cache hit.
 */
export const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';
export const POLLINATIONS_MODEL = 'turbo'; // far faster than flux → far fewer timeouts

export function pollinationsUrl(
  prompt: string,
  opts: { width?: number; height?: number; seed: number; model?: string },
): string {
  const { width = 768, height = 512, seed, model = POLLINATIONS_MODEL } = opts;
  return `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}&model=${model}`;
}
