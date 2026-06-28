export interface Slide {
  id?: string;
  title: string;
  bullets: string[];
  notes?: string;
  image?: string; // base64 data URI (optional)
}

export interface Deck {
  _id?: string;
  title: string;
  subtitle?: string;
  slides: Slide[];
}

/**
 * Parse a deck out of the AI's text response. The model is asked for strict
 * JSON, but we defensively strip code fences and locate the JSON object so a
 * stray sentence doesn't break generation.
 */
export function parseDeck(text: string): Deck | null {
  if (!text) return null;
  let raw = text.trim();

  // Strip ```json … ``` fences if present.
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  // Fall back to the outermost { … } if there's surrounding prose.
  if (!raw.startsWith('{')) {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    raw = raw.slice(start, end + 1);
  }

  try {
    const obj = JSON.parse(raw) as Partial<Deck>;
    if (!obj || !Array.isArray(obj.slides)) return null;
    const slides: Slide[] = obj.slides
      .map((s) => ({
        title: String((s as Slide)?.title ?? '').trim(),
        bullets: Array.isArray((s as Slide)?.bullets)
          ? (s as Slide).bullets.map((b) => String(b).trim()).filter(Boolean)
          : [],
        notes: (s as Slide)?.notes ? String((s as Slide).notes).trim() : undefined,
      }))
      .filter((s) => s.title || s.bullets.length);
    if (!slides.length) return null;
    return {
      title: String(obj.title ?? 'Untitled Deck').trim(),
      subtitle: obj.subtitle ? String(obj.subtitle).trim() : undefined,
      slides,
    };
  } catch {
    return null;
  }
}
