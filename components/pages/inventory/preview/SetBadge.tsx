import React from 'react';
import { WatchSet } from '../../../../types';

interface SetBadgeProps {
  watchSet?: WatchSet;
  className?: string;
}

const SetBadge: React.FC<SetBadgeProps> = ({ watchSet, className = '' }) => {
  if (!watchSet) {
    return <span className={`text-platinum-silver/40 text-xs ${className}`}>-</span>;
  }

  const getSetInfo = (set: WatchSet) => {
    switch (set) {
      case WatchSet.WatchOnly:
        return { icon: '⌚', label: 'Watch Only', color: 'text-platinum-silver/60' };
      case WatchSet.WatchAndBox:
        return { icon: '📦', label: 'Watch & Box', color: 'text-blue-400' };
      case WatchSet.WatchAndPapers:
        return { icon: '📄', label: 'Watch & Papers', color: 'text-green-400' };
      case WatchSet.FullSet:
        return { icon: '🎁', label: 'Full Set', color: 'text-champagne-gold' };
      default:
        return { icon: '❓', label: 'Unknown', color: 'text-platinum-silver/40' };
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
