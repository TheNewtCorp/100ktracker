import React from 'react';
import { DollarSign, Clock, Hash, TrendingUp } from 'lucide-react';
import { WidgetProps } from '../../types/widget';
import { useWatchData } from '../../hooks/useWatchData';
import { formatCurrency } from '../../utils/metricsHelpers';
import StatCard from '../shared/StatCard';

export const QuickStatsWidget: React.FC<WidgetProps> = ({ isLoading, error }) => {
  const { watches, isLoading: watchesLoading, error: watchesError } = useWatchData();

  // Calculate metrics from real watch data
  const totalWatches = watches.length;
  const soldWatches = watches.filter((watch) => watch.dateSold);
  const totalProfit = watches.reduce((sum, watch) => sum + (watch.netProfit || 0), 0);
  const avgProfit = soldWatches.length > 0 ? totalProfit / soldWatches.length : 0;

  // Calculate average hold time for sold watches
  const avgHoldTime =
    soldWatches.length > 0
      ? soldWatches.reduce((sum, watch) => {
          if (watch.inDate && watch.dateSold) {
            const inDate = new Date(watch.inDate);
            const soldDate = new Date(watch.dateSold);
            const daysDiff = Math.floor((soldDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + daysDiff;
          }
          return sum;
        }, 0) / soldWatches.length
      : 0;

  // Combine loading states and errors
  const loading = isLoading || watchesLoading;
  const combinedError = error || watchesError;

  if (loading) {
    return (
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='animate-pulse'>
            <div className='h-20 bg-gray-200 rounded-lg'></div>
          </div>
        ))}
      </div>
    );
  }

  if (combinedError) {
    return <div className='text-center text-red-500 py-4'>Failed to load stats: {combinedError}</div>;
  }

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
      <StatCard icon={<DollarSign size={24} />} label='Total Net Profit' value={formatCurrency(totalProfit)} />
      <StatCard icon={<Clock size={24} />} label='Average Hold Time' value={`${Math.round(avgHoldTime)} Days`} />
      <StatCard icon={<Hash size={24} />} label='Total Watches Sold' value={soldWatches.length.toString()} />
      <StatCard icon={<TrendingUp size={24} />} label='Average Profit/Watch' value={formatCurrency(avgProfit)} />
    </div>
  );
};
