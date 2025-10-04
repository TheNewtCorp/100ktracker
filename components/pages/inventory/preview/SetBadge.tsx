import React from 'react';
import { WatchSet } from '../../../../types';
import { useTheme } from '../../../../hooks/useTheme';

interface SetBadgeProps {
  watchSet?: WatchSet;
  className?: string;
}

const SetBadge: React.FC<SetBadgeProps> = ({ watchSet, className = '' }) => {
  const { theme } = useTheme();

  if (!watchSet) {
    return (
      <span className={`text-xs ${className} ${theme === 'light' ? 'text-gray-400' : 'text-platinum-silver/40'}`}>
        -
      </span>
    );
  }

  const getSetInfo = (set: WatchSet) => {
    switch (set) {
      case WatchSet.WatchOnly:
        return {
          icon: '⌚',
          label: 'Watch Only',
          color: theme === 'light' ? 'text-gray-600' : 'text-platinum-silver/60',
        };
      case WatchSet.WatchAndBox:
        return {
          icon: '📦',
          label: 'Watch & Box',
          color: theme === 'light' ? 'text-blue-600' : 'text-blue-400',
        };
      case WatchSet.WatchAndPapers:
        return {
          icon: '📄',
          label: 'Watch & Papers',
          color: theme === 'light' ? 'text-green-600' : 'text-green-400',
        };
      case WatchSet.FullSet:
        return {
          icon: '🎁',
          label: 'Full Set',
          color: theme === 'light' ? 'text-blue-600' : 'text-champagne-gold',
        };
      default:
        return {
          icon: '❓',
          label: 'Unknown',
          color: theme === 'light' ? 'text-gray-400' : 'text-platinum-silver/40',
        };
    }
  };

  const setInfo = getSetInfo(watchSet);

  return (
    <div className={`flex items-center gap-1 ${className}`} title={setInfo.label}>
      <span className='text-sm'>{setInfo.icon}</span>
      <span className={`text-xs font-medium ${setInfo.color}`}>{setInfo.label}</span>
    </div>
  );
};

export default SetBadge;
