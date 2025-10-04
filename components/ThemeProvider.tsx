import React, { ReactNode } from 'react';
import { ThemeContext, Theme, ThemeContextType } from '../hooks/useTheme';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Default to dark theme to preserve existing behavior
  const [theme, setTheme] = React.useState<Theme>('dark');

  // Load theme from localStorage on mount
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('100ktracker-theme') as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme);
    } else {
      // Default to dark theme if no preference saved
      setTheme('dark');
    }
  }, []);

  // Save theme to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('100ktracker-theme', theme);

    // Apply theme class to document body for global styling
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${theme}-theme`);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const contextValue: ThemeContextType = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
  };

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};
