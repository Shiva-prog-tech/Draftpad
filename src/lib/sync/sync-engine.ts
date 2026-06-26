'use client';
import Dexie, { Table } from 'dexie';
import { SyncOperation } from '@/types';

// IndexedDB schema via Dexie
class DraftpadDB extends Dexie {
  syncQueue!: Table<SyncOperation>;
  docCache!: Table<{ id: string; yjsState: string; updatedAt: number }>;

  constructor() {
    super('draftpad-db');
    this.version(1).stores({
      syncQueue: 'id, docId, createdAt, retries',
      docCache: 'id, updatedAt',
    });
  }
}

export const localDB = new DraftpadDB();

// Sync engine — manages offline queue + online flushing
export class SyncEngine {
  private flushing = false;
  private onlineHandler: (() => void) | null = null;

  constructor(private userId: string) {
    if (typeof window !== 'undefined') {
      this.onlineHandler = () => this.flush();
      window.addEventListener('online', this.onlineHandler);
    }
  }

  destroy() {
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
    }
  }

  async enqueue(op: Omit<SyncOperation, 'id' | 'createdAt' | 'retries'>) {
    const operation: SyncOperation = {
      ...op,
      id: `${op.docId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: new Date(),
      retries: 0,
    };
    await localDB.syncQueue.put(operation);
    if (navigator.onLine) this.flush();
  }

  async flush() {
    if (this.flushing) return;
    this.flushing = true;
    try {
      const ops = await localDB.syncQueue
        .where('retries').below(5)
        .sortBy('createdAt');

      for (const op of ops) {
        try {
          const res = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              docId: op.docId,
              update: op.update,
              clock: op.clock,
              clientId: this.userId,
            }),
          });
          if (res.ok) {
            await localDB.syncQueue.delete(op.id);
          } else if (res.status >= 400 && res.status < 500) {
            // Client error — drop it, not retriable
            await localDB.syncQueue.delete(op.id);
          } else {
            // Server error — increment retry count
            await localDB.syncQueue.update(op.id, { retries: op.retries + 1 });
          }
        } catch {
          await localDB.syncQueue.update(op.id, { retries: op.retries + 1 });
          break; // Network down — stop processing
        }
      }
    } finally {
      this.flushing = false;
    }
  }

  async getPendingCount(): Promise<number> {
    return localDB.syncQueue.count();
  }

  async saveDocLocally(docId: string, yjsState: string) {
    await localDB.docCache.put({ id: docId, yjsState, updatedAt: Date.now() });
  }

  async getLocalDoc(docId: string): Promise<string | null> {
    const cached = await localDB.docCache.get(docId);
    return cached?.yjsState ?? null;
  }
}
