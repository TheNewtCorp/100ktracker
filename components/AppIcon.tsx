
import React from 'react';
import { motion } from 'framer-motion';
import { AppTool } from '../types';

interface AppIconProps {
  tool: AppTool;
  icon: React.ReactNode;
  onClick: () => void;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const AppIcon: React.FC<AppIconProps> = ({ tool, icon, onClick }) => {
  return (
    <motion.div
      layoutId={`app-card-${tool.id}`}
      onClick={onClick}
      variants={itemVariants}
      className="aspect-square bg-charcoal-slate rounded-3xl flex flex-col items-center justify-center p-4 cursor-pointer shadow-lg hover:shadow-champagne-gold/20 transition-shadow duration-300"
      style={{ borderRadius: '1.5rem' }}
    >
      <motion.div layoutId={`app-icon-${tool.id}`} className="text-champagne-gold">
        {icon}
      </motion.div>
      <motion.h3 
        layoutId={`app-title-${tool.id}`}
        className="text-platinum-silver font-semibold mt-4 text-sm sm:text-base text-center"
      >
        {tool.title}
      </motion.h3>
    </motion.div>
  );
};

export default AppIcon;
