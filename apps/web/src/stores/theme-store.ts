import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      resolvedTheme: 'dark',
      setTheme: (theme) => {
        const resolved = theme === 'system' ? getSystemTheme() : theme;
        set({ theme, resolvedTheme: resolved });
        
        if (typeof window !== 'undefined') {
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(resolved);
        }
      },
    }),
    {
      name: 'techscholars-theme',
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== 'undefined') {
          const resolved = state.theme === 'system' ? getSystemTheme() : state.theme;
          document.documentElement.classList.remove('light', 'dark');
          document.documentElement.classList.add(resolved);
        }
      },
    }
  )
);