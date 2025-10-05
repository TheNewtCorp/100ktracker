import { useState, useEffect, useCallback } from 'react';
import { WidgetSettings } from '../types/widget';

const STORAGE_KEY = '100ktracker-widget-settings-v1';

const defaultWidgetSettings: WidgetSettings[] = [
  { widgetId: 'quick-stats', enabled: true, order: 0 },
  { widgetId: 'monthly-profit', enabled: true, order: 1 },
  { widgetId: '100k-goal', enabled: true, order: 2 },
  { widgetId: 'leaderboard', enabled: true, order: 3 },
];

export const useWidgetSettings = () => {
  const [settings, setSettings] = useState<WidgetSettings[]>(defaultWidgetSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings) as WidgetSettings[];
        setSettings(parsed);
      }
    } catch (error) {
      console.warn('Failed to load widget settings from localStorage:', error);
      // Use defaults if loading fails
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings to localStorage whenever they change
  const saveSettings = useCallback((newSettings: WidgetSettings[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save widget settings to localStorage:', error);
    }
  }, []);

  const toggleWidget = useCallback(
    (widgetId: string) => {
      const newSettings = settings.map((setting) =>
        setting.widgetId === widgetId ? { ...setting, enabled: !setting.enabled } : setting,
      );
      saveSettings(newSettings);
    },
    [settings, saveSettings],
  );

  const updateWidgetOrder = useCallback(
    (widgetId: string, newOrder: number) => {
      const newSettings = settings.map((setting) =>
        setting.widgetId === widgetId ? { ...setting, order: newOrder } : setting,
      );
      saveSettings(newSettings);
    },
    [settings, saveSettings],
  );

  const updateWidgetSettings = useCallback(
    (widgetId: string, customSettings: Record<string, any>) => {
      const newSettings = settings.map((setting) =>
        setting.widgetId === widgetId ? { ...setting, customSettings } : setting,
      );
      saveSettings(newSettings);
    },
    [settings, saveSettings],
  );

  const resetToDefaults = useCallback(() => {
    saveSettings(defaultWidgetSettings);
  }, [saveSettings]);

  const getWidgetSetting = useCallback(
    (widgetId: string) => {
      return settings.find((setting) => setting.widgetId === widgetId);
    },
    [settings],
  );

  return {
    settings,
    isLoading,
    toggleWidget,
    updateWidgetOrder,
    updateWidgetSettings,
    resetToDefaults,
    getWidgetSetting,
  };
};
