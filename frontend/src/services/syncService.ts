import { useSyncStore, QueuedMutation } from '../store/useSyncStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';

let isProcessing = false;

export async function processOfflineQueue() {
  const { queuedMutations, removeMutation, setIsSyncing, setLastSyncedAt } = useSyncStore.getState();
  const baseUrl = useSettingsStore.getState().apiBaseUrl;
  const token = useAuthStore.getState().token;

  if (isProcessing || queuedMutations.length === 0 || !navigator.onLine) {
    return;
  }

  isProcessing = true;
  setIsSyncing(true);

  for (const mutation of queuedMutations) {
    try {
      const url = `${baseUrl}/api/v1${mutation.endpoint}`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(url, {
        method: mutation.method,
        headers,
        body: mutation.body ? JSON.stringify(mutation.body) : undefined,
      });

      if (res.ok || res.status === 404) {
        // Successfully replayed or entity no longer exists, remove from queue
        removeMutation(mutation.id);
      }
    } catch (e) {
      console.warn('Failed to replay mutation, will retry next time:', e);
      break;
    }
  }

  setLastSyncedAt(new Date());
  setIsSyncing(false);
  isProcessing = false;
}

export function initSyncListeners() {
  const { setOnline } = useSyncStore.getState();

  window.addEventListener('online', () => {
    setOnline(true);
    processOfflineQueue();
  });

  window.addEventListener('offline', () => {
    setOnline(false);
  });

  // Periodically check and replay queue if online
  setInterval(() => {
    if (navigator.onLine && useSyncStore.getState().queuedMutations.length > 0) {
      processOfflineQueue();
    }
  }, 15000);
}
