import type { Deck } from '@/lib/deck';
import { generateImageDataUri } from '@/lib/ai-image';

/**
 * Export a deck to a real .pptx that opens in PowerPoint / Google Slides / Keynote.
 * pptxgenjs is dynamically imported so it never bloats the main bundle.
 * A single AI-generated background (base64) is embedded across slides for a
 * cohesive, designed look — best-effort, so export still works if it fails.
 */
export async function exportDeckToPptx(deck: Deck, opts?: { background?: boolean }): Promise<void> {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Draftpad';
  pptx.title = deck.title;

  const BG = '0A0A0B';
  const ACCENT = '818CF8';
  const WHITE = 'FFFFFF';
  const MUTED = 'D4D4D8';

  // One cohesive AI background for the whole deck (best-effort).
  let bg: string | null = null;
  if (opts?.background !== false) {
    bg = await generateImageDataUri(`${deck.title}, abstract premium dark gradient, indigo and violet, soft glow, cinematic, no text`, { width: 1280, height: 720 }).catch(() => null);
  }

  type Slide = ReturnType<typeof pptx.addSlide>;
  const paintBg = (slide: Slide, scrim: number, image?: string | null) => {
    const img = image || bg;
    if (img) {
      slide.background = { data: img };
      // dark overlay for text contrast (transparency: 0 = opaque, 100 = clear)
      slide.addShape('rect', { x: 0, y: 0, w: 13.33, h: 7.5, fill: { color: BG, transparency: scrim } });
    } else {
      slide.background = { color: BG };
    }
  };

  // ── Title slide ──
  const title = pptx.addSlide();
  paintBg(title, 35);
  title.addShape('rect', { x: 0, y: 5.1, w: 13.33, h: 0.12, fill: { color: ACCENT } });
  title.addText(deck.title, { x: 0.8, y: 2.4, w: 11.7, h: 1.6, fontSize: 40, bold: true, color: WHITE, fontFace: 'Arial' });
  if (deck.subtitle) {
    title.addText(deck.subtitle, { x: 0.8, y: 4.0, w: 11.7, h: 0.8, fontSize: 18, color: MUTED, fontFace: 'Arial' });
  }

  // ── Content slides ──
  deck.slides.forEach((s, i) => {
    const slide = pptx.addSlide();
    paintBg(slide, 55, s.image);
    slide.addShape('rect', { x: 0, y: 0, w: 0.18, h: 7.5, fill: { color: ACCENT } });
    slide.addText(s.title, { x: 0.7, y: 0.5, w: 12, h: 1, fontSize: 30, bold: true, color: WHITE, fontFace: 'Arial' });
    if (s.bullets.length) {
      slide.addText(
        s.bullets.map((b) => ({ text: b, options: { bullet: { code: '2022' }, color: MUTED, fontSize: 18, paraSpaceAfter: 10 } })),
        { x: 0.9, y: 1.8, w: 11.6, h: 5, fontFace: 'Arial', valign: 'top' },
      );
    }
    slide.addText(`${i + 1}`, { x: 12.4, y: 6.9, w: 0.6, h: 0.4, fontSize: 12, color: '52525B', align: 'right' });
    if (s.notes) slide.addNotes(s.notes);
  });

  await pptx.writeFile({ fileName: `${deck.title.replace(/[^\w\s-]/g, '').trim() || 'presentation'}.pptx` });
}
