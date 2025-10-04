import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, isDark, isLight } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        relative flex items-center justify-center p-3 rounded-xl
        transition-all duration-300 ease-in-out
        ${
          isDark
            ? 'bg-charcoal-slate/80 border border-champagne-gold/20 hover:bg-charcoal-slate hover:border-champagne-gold/40'
            : 'bg-white border border-gray-200 hover:bg-gray-50 hover:border-blue-300 shadow-sm'
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className='relative w-6 h-6'>
        {/* Sun Icon for Light Mode */}
        <motion.div
          className='absolute inset-0 flex items-center justify-center'
          initial={false}
          animate={{
            rotate: isLight ? 0 : 180,
            scale: isLight ? 1 : 0,
            opacity: isLight ? 1 : 0,
          }}
          transition={{
            duration: 0.3,
            ease: 'easeInOut',
          }}
        >
          <Sun size={20} className={`${isLight ? 'text-blue-600' : 'text-transparent'}`} />
        </motion.div>

        {/* Moon Icon for Dark Mode */}
        <motion.div
          className='absolute inset-0 flex items-center justify-center'
          initial={false}
          animate={{
            rotate: isDark ? 0 : -180,
            scale: isDark ? 1 : 0,
            opacity: isDark ? 1 : 0,
          }}
          transition={{
            duration: 0.3,
            ease: 'easeInOut',
          }}
        >
          <Moon size={20} className={`${isDark ? 'text-champagne-gold' : 'text-transparent'}`} />
        </motion.div>
      </div>

      {/* Optional tooltip/label */}
      <div
        className={`
        absolute -bottom-8 left-1/2 transform -translate-x-1/2
        px-2 py-1 rounded text-xs font-medium opacity-0 pointer-events-none
        transition-opacity duration-200 whitespace-nowrap
        ${isDark ? 'bg-charcoal-slate text-platinum-silver border border-champagne-gold/20' : 'bg-gray-800 text-white'}
        group-hover:opacity-100
      `}
      >
        {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      </div>
    </motion.button>
  );
};

export default ThemeToggle;
