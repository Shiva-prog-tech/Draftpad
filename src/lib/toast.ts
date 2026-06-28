import { create } from 'zustand';
import { nanoid } from 'nanoid';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (t: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: nanoid() }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

/** Fire-and-forget helpers usable from anywhere (no hook needed). */
export const toast = {
  success: (title: string, description?: string) => useToastStore.getState().push({ type: 'success', title, description }),
  error:   (title: string, description?: string) => useToastStore.getState().push({ type: 'error', title, description }),
  info:    (title: string, description?: string) => useToastStore.getState().push({ type: 'info', title, description }),
};
