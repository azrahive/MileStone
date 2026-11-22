import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useSyncStore } from '../store/useSyncStore';
import { processOfflineQueue } from '../services/syncService';

export const SyncStatusIndicator: React.FC = () => {
  const { isOnline, isSyncing, queuedMutations } = useSyncStore();

  const handleManualSync = () => {
    if (isOnline) {
      processOfflineQueue();
    }
  };

  if (!isOnline) {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
        title="Application is operating in offline mode. Changes are queued locally and will automatically sync when connection is restored."
      >
        <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span>Offline {queuedMutations.length > 0 && `(${queuedMutations.length} queued)`}</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 animate-pulse">
        <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleManualSync}
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
      title="Connected to server. Click to sync."
    >
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span>Online</span>
    </button>
  );
};
