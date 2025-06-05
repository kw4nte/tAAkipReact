import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

type Palette = { background: string; text: string; accent: string };

const light: Palette = {
    background: '#ffffff',
    text: '#0d0d0d',
    accent: '#c5a630',
};

const dark: Palette = {
    background: '#0d0d0d',
    text: '#e5e4e2',
    accent: '#ffd700',
};

const ThemeContext = createContext<Palette>(light);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const scheme = useColorScheme();
    return (
        <ThemeContext.Provider value={scheme === 'dark' ? dark : light}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useThemeColors = () => useContext(ThemeContext);
