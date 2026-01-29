import { useState, useEffect } from 'react';
import type { Theme } from '../types';

interface TelegramWebApp {
    setHeaderColor: (color: string) => void;
}

const tg = (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;

interface UseThemeReturn {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

export const useTheme = (initialTheme: Theme = 'light'): UseThemeReturn => {
    const [theme, setThemeState] = useState<Theme>(initialTheme);

    useEffect(() => {
        // Apply theme to body
        document.body.className = theme + '-theme';

        // Update Telegram WebApp header color
        if (tg) {
            tg.setHeaderColor(theme === 'dark' ? '#1f2937' : '#ffffff');
        }
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        // Could save to localStorage here
        // localStorage.setItem('theme', newTheme);
    };

    return { theme, setTheme };
};
