'use client';
import { useEffect, useState } from 'react';
import { SyncStatus } from '@/types';

interface Props { status: SyncStatus; pendingOps?: number; }

const statusConfig = {
  synced:   { color: 'bg-green-500',  label: 'Synced',     show: false },
  syncing:  { color: 'bg-[#6366F1]',  label: 'Syncing…',   show: true  },
  offline:  { color: 'bg-amber-500',  label: 'Offline',    show: true  },
  conflict: { color: 'bg-amber-400',  label: 'Conflict',   show: true  },
  error:    { color: 'bg-red-500',    label: 'Sync error', show: true  },
};

export function SyncBar({ status, pendingOps = 0 }: Props) {
  const [visible, setVisible] = useState(false);
  const [prevStatus, setPrevStatus] = useState<SyncStatus>(status);

  useEffect(() => {
    if (status !== prevStatus) {
      setPrevStatus(status);
      setVisible(true);
      if (status === 'synced') {
        const t = setTimeout(() => setVisible(false), 1500);
        return () => clearTimeout(t);
      }
    }
    setVisible(statusConfig[status].show || status === 'synced');
  }, [status, prevStatus]);

  const cfg = statusConfig[status];

  return (
    <>
      {/* Top 2px bar */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 overflow-hidden">
        {status === 'syncing' && (
          <div className={`absolute inset-0 ${cfg.color} sync-shimmer`} />
        )}
        {status === 'offline' && (
          <div className={`absolute inset-0 ${cfg.color} animate-pulse`} />
        )}
        {status === 'synced' && visible && (
          <div className="absolute inset-0 bg-green-500 animate-[fadeOut_1.5s_ease-out_forwards]" />
        )}
        {status === 'error' && (
          <div className={`absolute inset-0 ${cfg.color}`} />
        )}
      </div>

      {/* Offline banner */}
      {status === 'offline' && (
        <div className="fixed top-0 left-0 right-0 z-[9998] bg-amber-950/90 border-b border-amber-500/20 px-4 py-2 flex items-center gap-2.5 backdrop-blur-sm mt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
          <p className="text-amber-400 text-xs font-medium">
            You&apos;re offline — changes save locally and sync when you reconnect
            {pendingOps > 0 && <span className="ml-2 text-amber-500">({pendingOps} pending)</span>}
          </p>
        </div>
      )}
    </>
  );
}
