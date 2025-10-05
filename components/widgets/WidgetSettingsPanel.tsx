import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { Widget, WidgetSettings, WidgetCategory } from '../../types/widget';

interface WidgetSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: Widget[];
  settings: WidgetSettings[];
  onSettingsChange: (settings: WidgetSettings[]) => void;
  onResetToDefaults: () => void;
}

const categoryLabels: Record<WidgetCategory, string> = {
  profits: 'Profit Tracking',
  goals: 'Goals & Targets',
  social: 'Social & Competition',
  analytics: 'Analytics & Insights',
};

const categoryColors = {
  profits: 'text-money-green',
  goals: 'text-blue-500',
  social: 'text-purple-500',
  analytics: 'text-orange-500',
};

export const WidgetSettingsPanel: React.FC<WidgetSettingsPanelProps> = ({
  isOpen,
  onClose,
  widgets,
  settings,
  onSettingsChange,
  onResetToDefaults,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeCategory, setActiveCategory] = useState<WidgetCategory | 'all'>('all');

  const categories = Array.from(new Set(widgets.map((w) => w.category)));
  const filteredWidgets = activeCategory === 'all' ? widgets : widgets.filter((w) => w.category === activeCategory);

  const getWidgetSetting = (widgetId: string) => {
    return settings.find((s) => s.widgetId === widgetId) || { widgetId, enabled: true, order: 999 };
  };

  const toggleWidget = (widgetId: string) => {
    const currentSetting = getWidgetSetting(widgetId);
    const newSettings = settings.filter((s) => s.widgetId !== widgetId);
    newSettings.push({
      ...currentSetting,
      enabled: !currentSetting.enabled,
    });
    onSettingsChange(newSettings);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black/50 z-40'
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`
              fixed right-0 top-0 h-full w-full max-w-md z-50 overflow-hidden
              ${isDark ? 'bg-obsidian-black border-l border-champagne-gold/20' : 'bg-white border-l border-gray-200'}
              shadow-2xl
            `}
          >
            <div className='flex flex-col h-full'>
              {/* Header */}
              <div
                className={`
                p-6 border-b
                ${isDark ? 'border-champagne-gold/20' : 'border-gray-200'}
              `}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <Settings size={24} className={isDark ? 'text-champagne-gold' : 'text-blue-600'} />
                    <h2 className={`text-xl font-semibold ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                      Widget Settings
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${isDark ? 'hover:bg-champagne-gold/10 text-platinum-silver/60 hover:text-platinum-silver' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}
                    `}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Category Filter */}
              <div
                className={`
                p-4 border-b
                ${isDark ? 'border-champagne-gold/20' : 'border-gray-200'}
              `}
              >
                <div className='flex flex-wrap gap-2'>
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                      ${
                        activeCategory === 'all'
                          ? isDark
                            ? 'bg-champagne-gold text-obsidian-black'
                            : 'bg-blue-600 text-white'
                          : isDark
                            ? 'bg-charcoal-slate text-platinum-silver/70 hover:text-platinum-silver'
                            : 'bg-gray-100 text-gray-600 hover:text-gray-800'
                      }
                    `}
                  >
                    All Widgets
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                        ${
                          activeCategory === category
                            ? isDark
                              ? 'bg-champagne-gold text-obsidian-black'
                              : 'bg-blue-600 text-white'
                            : isDark
                              ? 'bg-charcoal-slate text-platinum-silver/70 hover:text-platinum-silver'
                              : 'bg-gray-100 text-gray-600 hover:text-gray-800'
                        }
                      `}
                    >
                      {categoryLabels[category]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Widget List */}
              <div className='flex-1 overflow-y-auto p-4 space-y-3'>
                {filteredWidgets.map((widget) => {
                  const setting = getWidgetSetting(widget.id);
                  return (
                    <div
                      key={widget.id}
                      className={`
                        p-4 rounded-lg border
                        ${isDark ? 'bg-charcoal-slate border-champagne-gold/10' : 'bg-gray-50 border-gray-200'}
                      `}
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex items-start gap-3 flex-1'>
                          <div className={`p-2 rounded-lg ${isDark ? 'bg-obsidian-black' : 'bg-white'}`}>
                            <widget.icon size={20} className={categoryColors[widget.category]} />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2 mb-1'>
                              <h3 className={`font-medium ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                                {widget.name}
                              </h3>
                              <span
                                className={`
                                px-2 py-0.5 text-xs rounded-full
                                ${isDark ? 'bg-obsidian-black text-platinum-silver/60' : 'bg-white text-gray-500'}
                              `}
                              >
                                {widget.size}
                              </span>
                            </div>
                            <p className={`text-sm ${isDark ? 'text-platinum-silver/70' : 'text-gray-600'}`}>
                              {widget.description}
                            </p>
                            <p className={`text-xs mt-1 ${categoryColors[widget.category]}`}>
                              {categoryLabels[widget.category]}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleWidget(widget.id)}
                          className={`
                            p-2 rounded-lg transition-colors ml-2
                            ${
                              setting.enabled
                                ? isDark
                                  ? 'bg-champagne-gold/20 text-champagne-gold hover:bg-champagne-gold/30'
                                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                : isDark
                                  ? 'bg-obsidian-black text-platinum-silver/40 hover:text-platinum-silver/60'
                                  : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                            }
                          `}
                          title={setting.enabled ? 'Hide Widget' : 'Show Widget'}
                        >
                          {setting.enabled ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer Actions */}
              <div
                className={`
                p-4 border-t space-y-3
                ${isDark ? 'border-champagne-gold/20' : 'border-gray-200'}
              `}
              >
                <button
                  onClick={onResetToDefaults}
                  className={`
                    w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isDark ? 'bg-crimson-red/20 text-crimson-red hover:bg-crimson-red/30' : 'bg-red-50 text-red-600 hover:bg-red-100'}
                  `}
                >
                  <RotateCcw size={16} />
                  Reset to Defaults
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
