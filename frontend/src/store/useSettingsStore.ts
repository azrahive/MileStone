import { create } from 'zustand';
import { ThemeMode } from '../types';

interface SettingsState {
  theme: ThemeMode;
  apiBaseUrl: string;
  setTheme: (theme: ThemeMode) => void;
  setApiBaseUrl: (url: string) => void;
  resetApiBaseUrl: () => void;
}

const configuredApiUrl = import.meta.env.VITE_API_URL || '';
const DEFAULT_API_URL =
  configuredApiUrl || (import.meta.env.PROD ? '' : 'http://localhost:8000');

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useSettingsStore = create<SettingsState>((set) => {
  const savedTheme =
    (localStorage.getItem('milestone_theme') as ThemeMode) ||
    (localStorage.getItem('milestone_theme') as ThemeMode) ||
    'system';
  const savedApiUrl =
    import.meta.env.PROD && !configuredApiUrl
      ? DEFAULT_API_URL
      : localStorage.getItem('milestone_api_url') || DEFAULT_API_URL;

  // Apply initial theme
  applyTheme(savedTheme);

  // Listen to system theme changes if theme is system
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const currentTheme =
        (localStorage.getItem('milestone_theme') as ThemeMode) ||
        (localStorage.getItem('milestone_theme') as ThemeMode);
      if (currentTheme === 'system' || !currentTheme) {
        applyTheme('system');
      }
    });
  }

  return {
    theme: savedTheme,
    apiBaseUrl: savedApiUrl,

    setTheme: (theme: ThemeMode) => {
      localStorage.setItem('milestone_theme', theme);
      applyTheme(theme);
      set({ theme });
    },

    setApiBaseUrl: (url: string) => {
      let cleaned = url.trim();
      if (cleaned.endsWith('/')) {
        cleaned = cleaned.slice(0, -1);
      }
      localStorage.setItem('milestone_api_url', cleaned);
      set({ apiBaseUrl: cleaned });
    },

    resetApiBaseUrl: () => {
      localStorage.removeItem('milestone_api_url');
      set({ apiBaseUrl: DEFAULT_API_URL });
    },
  };
});
