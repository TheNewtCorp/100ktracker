import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, className = '' }) => (
  <div className={`bg-charcoal-slate p-4 rounded-lg flex items-center gap-4 ${className}`}>
    <div className='flex-shrink-0 w-12 h-12 flex items-center justify-center bg-champagne-gold/10 text-champagne-gold rounded-full'>
      {icon}
    </div>
    <div>
      <p className='text-sm text-platinum-silver/70'>{label}</p>
      <p className='text-2xl font-bold text-platinum-silver'>{value}</p>
    </div>
  </div>
);

export default StatCard;
