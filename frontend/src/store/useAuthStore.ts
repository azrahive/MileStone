import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedToken = localStorage.getItem('milestone_token') || localStorage.getItem('smarttask_token');
  const savedUser = localStorage.getItem('milestone_user') || localStorage.getItem('smarttask_user');

  let initialUser: User | null = null;
  if (savedUser) {
    try {
      initialUser = JSON.parse(savedUser);
    } catch {
      initialUser = null;
    }
  }

  return {
    token: savedToken,
    user: initialUser,
    isAuthenticated: !!savedToken,

    setAuth: (token: string, user: User) => {
      localStorage.setItem('milestone_token', token);
      localStorage.setItem('milestone_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true });
    },

    setUser: (user: User) => {
      localStorage.setItem('milestone_user', JSON.stringify(user));
      set({ user });
    },

    logout: () => {
      localStorage.removeItem('milestone_token');
      localStorage.removeItem('milestone_user');
      localStorage.removeItem('smarttask_token');
      localStorage.removeItem('smarttask_user');
      set({ token: null, user: null, isAuthenticated: false });
    },
  };
});
