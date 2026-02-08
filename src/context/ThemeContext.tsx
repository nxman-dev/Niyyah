import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightColors, DarkColors } from '../constants/Colors';

type Theme = 'light' | 'dark' | 'system';
type ThemeColors = typeof LightColors;

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    colors: ThemeColors;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const STORAGE_THEME_KEY = '@prayer_streak_theme';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemScheme = useColorScheme();
    const [theme, setTheme] = useState<Theme>('system');
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const saved = await AsyncStorage.getItem(STORAGE_THEME_KEY);
            if (saved === 'light' || saved === 'dark' || saved === 'system') {
                setTheme(saved);
            }
        } catch (e) {
            console.log("Failed to load theme preference");
        } finally {
            setLoaded(true);
        }
    };

    const saveTheme = async (newTheme: Theme) => {
        setTheme(newTheme);
        await AsyncStorage.setItem(STORAGE_THEME_KEY, newTheme);
    };

    const isSystemDark = systemScheme === 'dark';
    const isDark = theme === 'dark' || (theme === 'system' && isSystemDark);

    const colors = isDark ? DarkColors : LightColors;

    if (!loaded) return null; // Or a splash screen

    return (
        <ThemeContext.Provider value={{ theme, setTheme: saveTheme, colors, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
