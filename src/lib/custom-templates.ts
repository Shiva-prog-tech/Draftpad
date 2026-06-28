/**
 * User-saved ("My") templates, persisted in localStorage. Lets anyone turn a
 * document into a reusable starting point without a backend. (Team-shared
 * templates in MongoDB are the natural next step.)
 */
export interface CustomTemplate {
  id: string;
  title: string;
  html: string;
  createdAt: number;
}

const KEY = 'draftpad:custom-templates';

export function getCustomTemplates(): CustomTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as CustomTemplate[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveCustomTemplate(input: { title: string; html: string }): CustomTemplate {
  const item: CustomTemplate = {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
    title: input.title.trim() || 'Untitled template',
    html: input.html,
    createdAt: Date.now(),
  };
  const next = [item, ...getCustomTemplates()].slice(0, 100);
  localStorage.setItem(KEY, JSON.stringify(next));
  return item;
}

export function removeCustomTemplate(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(getCustomTemplates().filter((t) => t.id !== id)));
}
