import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
    theme: Theme;
    toggleTheme: () => void;
    initTheme: () => void;
}

const getInitialTheme = (): Theme => {
    const stored = localStorage.getItem('bepay-theme') as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
    return 'light';
};

const applyTheme = (theme: Theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bepay-theme', theme);
};

export const useThemeStore = create<ThemeState>((set, get) => ({
    theme: 'dark',

    toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
    },

    initTheme: () => {
        const theme = getInitialTheme();
        applyTheme(theme);
        set({ theme });
    },
}));
