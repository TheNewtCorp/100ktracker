import React from 'react';
import { motion } from 'framer-motion';
import { AppTool } from '../types';
import { useTheme } from '../hooks/useTheme';

interface AppIconProps {
  tool: AppTool;
  icon: React.ReactNode;
  onClick: () => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const AppIcon: React.FC<AppIconProps> = ({ tool, icon, onClick }) => {
  const { theme } = useTheme();

  return (
    <motion.div
      layoutId={`app-card-${tool.id}`}
      onClick={onClick}
      variants={itemVariants}
      className={`aspect-square rounded-3xl flex flex-col items-center justify-center p-4 cursor-pointer shadow-lg transition-all duration-300 ${
        theme === 'light'
          ? 'bg-white border border-gray-200 hover:shadow-blue-200/50 hover:border-blue-300'
          : 'bg-charcoal-slate hover:shadow-champagne-gold/20'
      }`}
      style={{ borderRadius: '1.5rem' }}
    >
      <motion.div
        layoutId={`app-icon-${tool.id}`}
        className={theme === 'light' ? 'text-blue-600' : 'text-champagne-gold'}
      >
        {icon}
      </motion.div>
      <motion.h3
        layoutId={`app-title-${tool.id}`}
        className={`font-semibold mt-4 text-sm sm:text-base text-center ${
          theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'
        }`}
      >
        {tool.title}
      </motion.h3>
    </motion.div>
  );
};

export default AppIcon;
