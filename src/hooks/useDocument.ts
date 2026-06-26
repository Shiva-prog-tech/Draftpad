'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { SyncEngine } from '@/lib/sync/sync-engine';
import { createYDoc, encodeState, applyStateFromBase64, getTextFromDoc, stripHtml, countWords } from '@/lib/crdt/yjs-utils';
import { SyncStatus } from '@/types';

// Online status hook
export function useOnlineStatus() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

// Main document hook
export function useDocument(docId: string, userId: string, initialState?: string) {
  const docRef = useRef<Y.Doc | null>(null);
  const engineRef = useRef<SyncEngine | null>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [content, setContent] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [pendingOps, setPendingOps] = useState(0);
  const online = useOnlineStatus();

  useEffect(() => {
    // Init Yjs doc
    const doc = createYDoc();
    docRef.current = doc;
    engineRef.current = new SyncEngine(userId);

    // Apply initial server state or load from IndexedDB
    const init = async () => {
      const engine = engineRef.current!;
      if (initialState) {
        applyStateFromBase64(doc, initialState);
      } else {
        const local = await engine.getLocalDoc(docId);
        if (local) applyStateFromBase64(doc, local);
      }
      const text = getTextFromDoc(doc);
      setContent(text);
      setWordCount(countWords(stripHtml(text)));
    };
    init();

    // Listen for local changes
    const handleUpdate = () => {
      const html = getTextFromDoc(doc);
      setContent(html);
      setWordCount(countWords(stripHtml(html)));
      setSyncStatus('syncing');

      // Debounced save — always send the full encoded state so the server
      // can reconstruct the document regardless of what it previously had.
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        const engine = engineRef.current!;
        const state = encodeState(doc);
        await engine.saveDocLocally(docId, state);
        await engine.enqueue({ docId, update: state, clock: Date.now(), userId });
        const pending = await engine.getPendingCount();
        setPendingOps(pending);
        setSyncStatus(navigator.onLine ? 'synced' : 'offline');
      }, 800);
    };

    doc.on('update', handleUpdate);

    return () => {
      doc.off('update', handleUpdate);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      engineRef.current?.destroy();
    };
  }, [docId, userId, initialState]);

  useEffect(() => {
    setSyncStatus(online ? (pendingOps > 0 ? 'syncing' : 'synced') : 'offline');
  }, [online, pendingOps]);

  const updateText = useCallback((newText: string) => {
    const doc = docRef.current;
    if (!doc) return;
    const yText = doc.getText('content');
    doc.transact(() => {
      yText.delete(0, yText.length);
      yText.insert(0, newText);
    });
  }, []);

  const getDoc = useCallback(() => docRef.current, []);

  return { content, wordCount, syncStatus, pendingOps, updateText, getDoc };
}

// Version history hook
export function useVersionHistory(docId: string) {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/versions?docId=${docId}`);
      if (res.ok) setVersions(await res.json());
    } finally {
      setLoading(false);
    }
  }, [docId]);

  const saveVersion = useCallback(async (label: string, state: string) => {
    await fetch('/api/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ docId, state, label }),
    });
    fetchVersions();
  }, [docId, fetchVersions]);

  const restoreVersion = useCallback(async (versionId: string) => {
    const res = await fetch(`/api/versions/${versionId}/restore`, { method: 'POST' });
    return res.ok;
  }, []);

  useEffect(() => { fetchVersions(); }, [fetchVersions]);

  return { versions, loading, saveVersion, restoreVersion, refetch: fetchVersions };
}
