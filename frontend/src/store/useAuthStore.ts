import { create } from 'zustand';
import { User } from '../types';

const USERS_DB_KEY = 'milestone_users_db';

// Helper to retrieve persistent profile for a given email
export function getPersistentProfile(email: string): Partial<User> & { password?: string } | null {
  if (!email) return null;
  const key = email.toLowerCase().trim();

  // 1. Check direct user_profile_<email>
  const direct = localStorage.getItem(`user_profile_${key}`);
  if (direct) {
    try {
      return JSON.parse(direct);
    } catch {
      // fallback
    }
  }

  // 2. Check users_db dictionary
  const dbStr = localStorage.getItem(USERS_DB_KEY);
  if (dbStr) {
    try {
      const db = JSON.parse(dbStr);
      if (db[key]) return db[key];
    } catch {
      // fallback
    }
  }

  return null;
}

// Helper to save persistent profile for a given email
export function savePersistentProfile(email: string, profileData: Partial<User> & { password?: string }) {
  if (!email) return;
  const key = email.toLowerCase().trim();
  try {
    const existing = getPersistentProfile(key) || {};
    const merged = { ...existing, ...profileData, email: key };

    // 1. Save user_profile_<email>
    localStorage.setItem(`user_profile_${key}`, JSON.stringify(merged));

    // 2. Save in milestone_users_db dictionary
    const dbStr = localStorage.getItem(USERS_DB_KEY);
    const db = dbStr ? JSON.parse(dbStr) : {};
    db[key] = merged;
    localStorage.setItem(USERS_DB_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn('Failed to save persistent profile:', e);
  }
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User, password?: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedToken = localStorage.getItem('milestone_token') || localStorage.getItem('smarttask_token');
  const savedUserStr = localStorage.getItem('milestone_user') || localStorage.getItem('smarttask_user');

  let initialUser: User | null = null;
  if (savedUserStr && savedToken) {
    try {
      const parsed: User = JSON.parse(savedUserStr);
      // Hydrate with persistent profile (avatar, updated name, etc.)
      const persistent = getPersistentProfile(parsed.email);
      initialUser = persistent ? { ...parsed, ...persistent } : parsed;
    } catch {
      initialUser = null;
    }
  }

  return {
    token: savedToken,
    user: initialUser,
    isAuthenticated: !!savedToken && !!initialUser,

    setAuth: (token: string, user: User, password?: string) => {
      // Hydrate from persistent profile keyed by user email
      const persistent = getPersistentProfile(user.email);
      const mergedUser: User = {
        ...user,
        ...(persistent || {}),
      };

      // Persist profile data with optional password
      savePersistentProfile(mergedUser.email, {
        ...mergedUser,
        ...(password ? { password } : {}),
      });

      // Save active session token and user
      localStorage.setItem('milestone_token', token);
      localStorage.setItem('milestone_user', JSON.stringify(mergedUser));
      set({ token, user: mergedUser, isAuthenticated: true });
    },

    setUser: (user: User) => {
      // Save to persistent user profile record
      savePersistentProfile(user.email, user);

      // Update active session user
      localStorage.setItem('milestone_user', JSON.stringify(user));
      set({ user });
    },

    logout: () => {
      // Clear ONLY active session flags & tokens — never delete stored user profiles or avatars
      localStorage.removeItem('milestone_token');
      localStorage.removeItem('milestone_user');
      localStorage.removeItem('smarttask_token');
      localStorage.removeItem('smarttask_user');
      set({ token: null, user: null, isAuthenticated: false });
    },
  };
});

