import React from 'react';
import { useTheme } from '../../hooks/useTheme';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, className = '' }) => {
  const { theme } = useTheme();

  return (
    <div
      className={`p-4 rounded-lg flex items-center gap-4 transition-colors duration-300 ${
        theme === 'light' ? 'bg-white border border-gray-200' : 'bg-charcoal-slate'
      } ${className}`}
    >
      <div
        className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full ${
          theme === 'light' ? 'bg-blue-100 text-blue-600' : 'bg-champagne-gold/10 text-champagne-gold'
        }`}
      >
        {icon}
      </div>
      <div>
        <p className={`text-sm ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver/70'}`}>{label}</p>
        <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
