import { create } from 'zustand';

export interface QueuedMutation {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body?: any;
  timestamp: number;
}

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  queuedMutations: QueuedMutation[];
  lastSyncedAt: Date | null;
  setOnline: (isOnline: boolean) => void;
  setIsSyncing: (isSyncing: boolean) => void;
  queueMutation: (mutation: Omit<QueuedMutation, 'id' | 'timestamp'>) => void;
  clearQueue: () => void;
  removeMutation: (id: string) => void;
  setLastSyncedAt: (date: Date) => void;
}

export const useSyncStore = create<SyncState>((set, get) => {
  const savedQueue = localStorage.getItem('smarttask_offline_queue');
  let initialQueue: QueuedMutation[] = [];
  if (savedQueue) {
    try {
      initialQueue = JSON.parse(savedQueue);
    } catch {
      initialQueue = [];
    }
  }

  return {
    isOnline: navigator.onLine,
    isSyncing: false,
    queuedMutations: initialQueue,
    lastSyncedAt: null,

    setOnline: (isOnline: boolean) => set({ isOnline }),
    setIsSyncing: (isSyncing: boolean) => set({ isSyncing }),

    queueMutation: (mutation) => {
      const item: QueuedMutation = {
        ...mutation,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
      };
      const updated = [...get().queuedMutations, item];
      localStorage.setItem('smarttask_offline_queue', JSON.stringify(updated));
      set({ queuedMutations: updated });
    },

    clearQueue: () => {
      localStorage.removeItem('smarttask_offline_queue');
      set({ queuedMutations: [] });
    },

    removeMutation: (id: string) => {
      const updated = get().queuedMutations.filter((m) => m.id !== id);
      localStorage.setItem('smarttask_offline_queue', JSON.stringify(updated));
      set({ queuedMutations: updated });
    },

    setLastSyncedAt: (date: Date) => set({ lastSyncedAt: date }),
  };
});
