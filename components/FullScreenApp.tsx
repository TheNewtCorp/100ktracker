import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { AppTool } from '../types';
import { useTheme } from '../hooks/useTheme';

interface FullScreenAppProps {
  tool: AppTool;
  onClose: () => void;
  children: React.ReactNode;
}

const FullScreenApp: React.FC<FullScreenAppProps> = ({ tool, onClose, children }) => {
  const { theme } = useTheme();

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex flex-col overflow-y-auto ${
        theme === 'light' ? 'bg-gray-50' : 'bg-charcoal-slate'
      }`}
      layoutId={`app-card-${tool.id}`}
      initial={{ borderRadius: '1.5rem' }}
      animate={{ borderRadius: '0rem' }}
      exit={{ borderRadius: '1.5rem' }}
      transition={{ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }}
    >
      <motion.div className='flex-grow p-6 md:p-10'>
        <header className='flex items-start justify-between mb-8'>
          <div className='flex items-center space-x-4'>
            <motion.div
              layoutId={`app-icon-${tool.id}`}
              className={`${theme === 'light' ? 'text-blue-600' : 'text-champagne-gold'}`}
            >
              {/* Placeholder for icon, as it animates from AppIcon */}
            </motion.div>
            <motion.h1
              layoutId={`app-title-${tool.id}`}
              className={`text-3xl md:text-4xl font-bold ${
                theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'
              }`}
            >
              {tool.title}
            </motion.h1>
          </div>
          <motion.button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              theme === 'light'
                ? 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                : 'text-platinum-silver/70 hover:bg-obsidian-black/50 hover:text-platinum-silver'
            }`}
            aria-label='Close'
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1, transition: { delay: 0.3 } }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            <X size={28} />
          </motion.button>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
          exit={{ opacity: 0, y: 20 }}
          className='content'
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default FullScreenApp;
