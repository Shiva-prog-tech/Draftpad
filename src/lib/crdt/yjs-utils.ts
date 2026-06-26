import * as Y from 'yjs';

export function createYDoc(): Y.Doc {
  return new Y.Doc();
}

export function encodeState(doc: Y.Doc): string {
  const state = Y.encodeStateAsUpdate(doc);
  return Buffer.from(state).toString('base64');
}

export function applyStateFromBase64(doc: Y.Doc, base64: string) {
  try {
    const binary = Buffer.from(base64, 'base64');
    Y.applyUpdate(doc, new Uint8Array(binary));
  } catch (e) {
    console.error('Failed to apply Yjs state:', e);
  }
}

export function encodeUpdate(update: Uint8Array): string {
  return Buffer.from(update).toString('base64');
}

export function decodeUpdate(base64: string): Uint8Array {
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

export function mergeStates(states: string[]): string {
  const doc = new Y.Doc();
  for (const state of states) {
    try {
      applyStateFromBase64(doc, state);
    } catch { /* skip malformed */ }
  }
  return encodeState(doc);
}

export function getTextFromDoc(doc: Y.Doc): string {
  return doc.getText('content').toString();
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
