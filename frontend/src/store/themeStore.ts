import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  setDark: (value: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDark: false,
      toggle: () => set((state) => {
        const newIsDark = !state.isDark;
        if (newIsDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { isDark: newIsDark };
      }),
      setDark: (value) => set(() => {
        if (value) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { isDark: value };
      }),
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        // Applica tema salvato al caricamento
        if (state?.isDark) {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);
