import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, Calendar, Trophy } from 'lucide-react';
import { WidgetProps } from '../../types/widget';
import { useWatchData } from '../../hooks/useWatchData';
import { use100KGoal } from '../../hooks/use100KGoal';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrency } from '../../utils/metricsHelpers';

export const Goal100KWidget: React.FC<WidgetProps> = ({ isLoading, error }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { watches, isLoading: watchesLoading, error: watchesError } = useWatchData();

  // Use real watch data for 100K goal calculations
  const goalData = use100KGoal(watches);

  // Combine loading states and errors
  const loading = isLoading || watchesLoading;
  const combinedError = error || watchesError;

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='animate-pulse'>
          <div className='h-32 bg-gray-200 rounded-lg mb-4'></div>
          <div className='space-y-2'>
            <div className='h-4 bg-gray-200 rounded w-3/4'></div>
            <div className='h-4 bg-gray-200 rounded w-1/2'></div>
          </div>
        </div>
      </div>
    );
  }

  if (combinedError) {
    return <div className='text-center text-red-500 py-4'>Failed to load goal data: {combinedError}</div>;
  }

  // Use goalData properties instead of calculating manually
  const progressPercentage = goalData.progressPercentage;
  const remainingAmount = goalData.remainingAmount;
  const daysLeft = goalData.daysLeftInYear;
  const dailyTarget = goalData.dailyTargetNeeded;
  const isOnTrack = goalData.isOnTrack;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className='space-y-6'>
      {/* Progress Circle */}
      <div className='flex flex-col items-center'>
        <div className='relative w-40 h-40'>
          <svg className='w-40 h-40 transform -rotate-90' viewBox='0 0 144 144'>
            {/* Background circle */}
            <circle
              cx='72'
              cy='72'
              r={radius}
              fill='none'
              stroke={isDark ? 'rgba(200, 169, 126, 0.1)' : 'rgba(156, 163, 175, 0.2)'}
              strokeWidth='8'
            />
            {/* Progress circle */}
            <motion.circle
              cx='72'
              cy='72'
              r={radius}
              fill='none'
              stroke={progressPercentage >= 100 ? '#10B981' : isDark ? '#C8A97E' : '#3B82F6'}
              strokeWidth='8'
              strokeLinecap='round'
              strokeDasharray={strokeDasharray}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>

          {/* Center content */}
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className='text-center'
            >
              <div
                className={`text-2xl font-bold ${
                  progressPercentage >= 100 ? 'text-money-green' : isDark ? 'text-champagne-gold' : 'text-blue-600'
                }`}
              >
                {Math.round(progressPercentage)}%
              </div>
              <div className={`text-xs ${isDark ? 'text-platinum-silver/60' : 'text-gray-500'}`}>of $100K goal</div>
            </motion.div>
          </div>
        </div>

        {/* Goal status */}
        <div className='text-center mt-4'>
          <div className={`text-lg font-semibold ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
            {formatCurrency(goalData.currentYearProfit)}
          </div>
          <div className={`text-sm ${isDark ? 'text-platinum-silver/70' : 'text-gray-600'}`}>
            {remainingAmount > 0 ? `${formatCurrency(remainingAmount)} to go` : 'Goal achieved! 🎉'}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-2 gap-4'>
        <div
          className={`
          p-3 rounded-lg border text-center
          ${isDark ? 'bg-obsidian-black border-champagne-gold/20' : 'bg-gray-50 border-gray-200'}
        `}
        >
          <div className='flex items-center justify-center mb-1'>
            <Calendar size={16} className={isDark ? 'text-champagne-gold' : 'text-blue-600'} />
          </div>
          <div className={`text-sm font-semibold ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>{daysLeft}</div>
          <div className={`text-xs ${isDark ? 'text-platinum-silver/60' : 'text-gray-500'}`}>days left</div>
        </div>

        <div
          className={`
          p-3 rounded-lg border text-center
          ${isDark ? 'bg-obsidian-black border-champagne-gold/20' : 'bg-gray-50 border-gray-200'}
        `}
        >
          <div className='flex items-center justify-center mb-1'>
            <Target size={16} className={isDark ? 'text-champagne-gold' : 'text-blue-600'} />
          </div>
          <div className={`text-sm font-semibold ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
            {formatCurrency(dailyTarget)}
          </div>
          <div className={`text-xs ${isDark ? 'text-platinum-silver/60' : 'text-gray-500'}`}>daily target</div>
        </div>

        <div
          className={`
          p-3 rounded-lg border text-center col-span-2
          ${isDark ? 'bg-obsidian-black border-champagne-gold/20' : 'bg-gray-50 border-gray-200'}
        `}
        >
          <div className='flex items-center justify-center mb-1'>
            {isOnTrack ? (
              <Trophy size={16} className='text-money-green' />
            ) : (
              <TrendingUp size={16} className={isDark ? 'text-champagne-gold' : 'text-blue-600'} />
            )}
          </div>
          <div
            className={`text-sm font-semibold ${
              isOnTrack ? 'text-money-green' : isDark ? 'text-platinum-silver' : 'text-gray-900'
            }`}
          >
            {isOnTrack ? 'On Track!' : 'Need to Accelerate'}
          </div>
          <div className={`text-xs ${isDark ? 'text-platinum-silver/60' : 'text-gray-500'}`}>
            {isOnTrack ? 'Keep up the great work' : 'Push harder to reach goal'}
          </div>
        </div>
      </div>
    </div>
  );
};
