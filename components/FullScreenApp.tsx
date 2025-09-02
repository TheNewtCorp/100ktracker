
import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { AppTool } from '../types';

interface FullScreenAppProps {
  tool: AppTool;
  onClose: () => void;
  children: React.ReactNode;
}

const FullScreenApp: React.FC<FullScreenAppProps> = ({ tool, onClose, children }) => {
  return (
    <motion.div
      className="fixed inset-0 bg-charcoal-slate z-50 flex flex-col overflow-y-auto"
      layoutId={`app-card-${tool.id}`}
      initial={{ borderRadius: '1.5rem' }}
      animate={{ borderRadius: '0rem' }}
      exit={{ borderRadius: '1.5rem' }}
      transition={{ duration: 0.5, ease: [0.43, 0.13, 0.23, 0.96] }}
    >
      <motion.div className="flex-grow p-6 md:p-10">
        <header className="flex items-start justify-between mb-8">
            <div className="flex items-center space-x-4">
                 <motion.div layoutId={`app-icon-${tool.id}`} className="text-champagne-gold">
                    {/* Placeholder for icon, as it animates from AppIcon */}
                 </motion.div>
                <motion.h1 
                    layoutId={`app-title-${tool.id}`}
                    className="text-3xl md:text-4xl font-bold text-platinum-silver"
                >
                    {tool.title}
                </motion.h1>
            </div>
            <motion.button
              onClick={onClose}
              className="p-2 rounded-full text-platinum-silver/70 hover:bg-obsidian-black/50 hover:text-platinum-silver transition-colors"
              aria-label="Close"
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
          className="content"
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default FullScreenApp;
