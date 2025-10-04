import { createContext, useContext } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme configuration object for consistent color mapping
export const themeConfig = {
  dark: {
    // Preserve exact existing dark theme colors
    primary: 'bg-obsidian-black text-platinum-silver',
    secondary: 'bg-charcoal-slate text-platinum-silver',
    accent: 'text-champagne-gold',
    accentBg: 'bg-champagne-gold text-obsidian-black',
    border: 'border-champagne-gold',
    borderSubtle: 'border-champagne-gold/20',
    textPrimary: 'text-platinum-silver',
    textSecondary: 'text-platinum-silver/80',
    textMuted: 'text-platinum-silver/60',
    success: 'text-money-green',
    error: 'text-crimson-red',
    hover: 'hover:bg-charcoal-slate/50',
    hoverAccent: 'hover:bg-champagne-gold/10',
  },
  light: {
    // New light theme colors matching OperandiChallengePage
    primary: 'bg-white text-gray-900',
    secondary: 'bg-gray-50 text-gray-800',
    accent: 'text-blue-600',
    accentBg: 'bg-blue-600 text-white',
    border: 'border-blue-600',
    borderSubtle: 'border-gray-200',
    textPrimary: 'text-gray-900',
    textSecondary: 'text-gray-700',
    textMuted: 'text-gray-600',
    success: 'text-green-600',
    error: 'text-red-600',
    hover: 'hover:bg-gray-100',
    hoverAccent: 'hover:bg-blue-50',
  },
};

// Helper function to get theme classes
export const getThemeClasses = (theme: Theme, variant: keyof typeof themeConfig.dark): string => {
  return themeConfig[theme][variant];
};
