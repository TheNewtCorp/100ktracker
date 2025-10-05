import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Settings, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { WidgetSize } from '../../types/widget';

interface WidgetContainerProps {
  widgetId: string;
  title: string;
  icon: React.ReactElement;
  children: ReactNode;
  size: WidgetSize;
  enabled: boolean;
  onToggle?: () => void;
  onSettings?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

const sizeClasses = {
  small: 'col-span-1',
  medium: 'col-span-1 lg:col-span-1',
  large: 'col-span-1 lg:col-span-2',
  'full-width': 'col-span-full',
};

export const WidgetContainer: React.FC<WidgetContainerProps> = ({
  widgetId,
  title,
  icon,
  children,
  size,
  enabled,
  onToggle,
  onSettings,
  isLoading,
  error,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: enabled ? 1 : 0.6,
        scale: 1,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={`
        ${sizeClasses[size]}
        ${isDark ? 'bg-charcoal-slate border-champagne-gold/10' : 'bg-white border-gray-200'}
        border rounded-xl p-6 shadow-sm transition-all duration-200
        ${!enabled ? 'pointer-events-none' : ''}
      `}
    >
      {/* Widget Header */}
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-3'>
          <div className={isDark ? 'text-champagne-gold' : 'text-blue-600'}>{icon}</div>
          <h3 className={`font-semibold ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>{title}</h3>
        </div>

        <div className='flex items-center gap-2'>
          {onSettings && (
            <button
              onClick={onSettings}
              className={`
                p-1.5 rounded-lg transition-colors
                ${
                  isDark
                    ? 'hover:bg-champagne-gold/10 text-platinum-silver/60 hover:text-platinum-silver'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }
              `}
              title='Widget Settings'
            >
              <Settings size={16} />
            </button>
          )}

          {onToggle && (
            <button
              onClick={onToggle}
              className={`
                p-1.5 rounded-lg transition-colors
                ${
                  isDark
                    ? 'hover:bg-champagne-gold/10 text-platinum-silver/60 hover:text-platinum-silver'
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }
              `}
              title={enabled ? 'Hide Widget' : 'Show Widget'}
            >
              {enabled ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className={`${!enabled ? 'opacity-50' : ''}`}>
        {error ? (
          <div
            className={`
            p-4 rounded-lg border text-center
            ${
              isDark
                ? 'bg-crimson-red/10 border-crimson-red/20 text-crimson-red'
                : 'bg-red-50 border-red-200 text-red-600'
            }
          `}
          >
            <p className='text-sm font-medium'>Widget Error</p>
            <p className='text-xs mt-1 opacity-80'>{error}</p>
          </div>
        ) : isLoading ? (
          <div className='flex justify-center items-center py-8'>
            <div
              className={`
              w-6 h-6 border-2 rounded-full animate-spin
              ${isDark ? 'border-champagne-gold border-t-transparent' : 'border-blue-600 border-t-transparent'}
            `}
            />
          </div>
        ) : (
          children
        )}
      </div>
    </motion.div>
  );
};
