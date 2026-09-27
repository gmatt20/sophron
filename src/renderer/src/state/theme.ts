import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePref = 'system' | 'light' | 'dark';

interface ThemeState {
  pref: ThemePref;
  cycle: () => void;
}

const NEXT: Record<ThemePref, ThemePref> = { system: 'light', light: 'dark', dark: 'system' };

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      pref: 'system',
      cycle: () => set((s) => ({ pref: NEXT[s.pref] }))
    }),
    { name: 'sophron-theme' }
  )
);

/** Keeps the `dark` class on <html> in sync with the preference and the OS. */
export function useApplyTheme() {
  const pref = useTheme((s) => s.pref);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = pref === 'dark' || (pref === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', dark);
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [pref]);
}
