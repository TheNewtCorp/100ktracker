import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Users } from 'lucide-react';
import { WidgetProps } from '../../types/widget';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { useWatchData } from '../../hooks/useWatchData';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrency } from '../../utils/metricsHelpers';

export const LeaderboardWidget: React.FC<WidgetProps> = ({ isLoading, error }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Get real watch data from the backend
  const { watches, isLoading: watchesLoading, error: watchesError } = useWatchData();
  const leaderboardData = useLeaderboard(watches);

  // Combine loading states
  const loading = isLoading || watchesLoading;
  const combinedError = error || watchesError;

  if (loading) {
    return (
      <div className='space-y-4'>
        <div className='animate-pulse'>
          <div className='h-6 bg-gray-200 rounded w-3/4 mb-4'></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='flex items-center gap-3 mb-3'>
              <div className='w-8 h-8 bg-gray-200 rounded-full'></div>
              <div className='flex-1'>
                <div className='h-4 bg-gray-200 rounded w-2/3 mb-1'></div>
                <div className='h-3 bg-gray-200 rounded w-1/3'></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (combinedError) {
    return <div className='text-center text-red-500 py-4'>Failed to load leaderboard: {combinedError}</div>;
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy size={20} className='text-yellow-500' />;
      case 2:
        return <Medal size={20} className='text-gray-400' />;
      case 3:
        return <Award size={20} className='text-amber-600' />;
      default:
        return (
          <div
            className={`
            w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
            ${isDark ? 'bg-charcoal-slate text-platinum-silver/70' : 'bg-gray-100 text-gray-600'}
          `}
          >
            {rank}
          </div>
        );
    }
  };

  const getRankColor = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) {
      return isDark ? 'bg-champagne-gold/10 border-champagne-gold/30' : 'bg-blue-50 border-blue-200';
    }
    switch (rank) {
      case 1:
        return isDark ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200';
      case 2:
        return isDark ? 'bg-gray-500/10 border-gray-500/30' : 'bg-gray-50 border-gray-200';
      case 3:
        return isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200';
      default:
        return isDark ? 'bg-obsidian-black border-champagne-gold/10' : 'bg-white border-gray-100';
    }
  };

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Trophy size={20} className={isDark ? 'text-champagne-gold' : 'text-blue-600'} />
          <h4 className={`font-semibold ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
            {leaderboardData.season}
          </h4>
        </div>
        <div className='flex items-center gap-1 text-xs'>
          <Users size={14} className={isDark ? 'text-platinum-silver/60' : 'text-gray-500'} />
          <span className={isDark ? 'text-platinum-silver/60' : 'text-gray-500'}>
            {leaderboardData.totalParticipants} traders
          </span>
        </div>
      </div>

      {/* Leaderboard List */}
      <div className='space-y-2 max-h-80 overflow-y-auto'>
        {leaderboardData.entries.slice(0, 10).map((entry, index) => (
          <motion.div
            key={entry.username}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`
              flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
              ${getRankColor(entry.rank, entry.isCurrentUser)}
              ${entry.isCurrentUser ? 'ring-1 ring-offset-1' : ''}
              ${entry.isCurrentUser && isDark ? 'ring-champagne-gold/50 ring-offset-obsidian-black' : ''}
              ${entry.isCurrentUser && !isDark ? 'ring-blue-300 ring-offset-white' : ''}
            `}
          >
            {/* Rank */}
            <div className='flex items-center justify-center w-8'>{getRankIcon(entry.rank)}</div>

            {/* User Info */}
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2'>
                <span
                  className={`
                  font-medium truncate
                  ${
                    entry.isCurrentUser
                      ? isDark
                        ? 'text-champagne-gold'
                        : 'text-blue-600'
                      : isDark
                        ? 'text-platinum-silver'
                        : 'text-gray-900'
                  }
                `}
                >
                  {entry.username}
                </span>
                {entry.badge && <span className='text-sm'>{entry.badge}</span>}
                {entry.isCurrentUser && (
                  <span
                    className={`
                    text-xs px-2 py-0.5 rounded-full font-medium
                    ${isDark ? 'bg-champagne-gold/20 text-champagne-gold' : 'bg-blue-100 text-blue-600'}
                  `}
                  >
                    You
                  </span>
                )}
              </div>
              <div className={`text-xs ${isDark ? 'text-platinum-silver/60' : 'text-gray-500'}`}>
                {entry.watchesSold} watches • Avg: {formatCurrency(entry.avgProfit)}
              </div>
            </div>

            {/* Profit */}
            <div className='text-right'>
              <div
                className={`
                font-semibold
                ${entry.rank <= 3 ? 'text-money-green' : isDark ? 'text-platinum-silver' : 'text-gray-900'}
              `}
              >
                {formatCurrency(entry.totalProfit)}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Current user if not in top 10 */}
        {leaderboardData.userRank > 10 && (
          <>
            <div
              className={`
              text-center py-2 text-xs
              ${isDark ? 'text-platinum-silver/60' : 'text-gray-500'}
            `}
            >
              ...
            </div>
            {leaderboardData.entries
              .filter((entry) => entry.isCurrentUser)
              .map((entry) => (
                <motion.div
                  key={entry.username}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border ring-1 ring-offset-1
                    ${getRankColor(entry.rank, true)}
                    ${isDark ? 'ring-champagne-gold/50 ring-offset-obsidian-black' : 'ring-blue-300 ring-offset-white'}
                  `}
                >
                  <div className='flex items-center justify-center w-8'>{getRankIcon(entry.rank)}</div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <span className={`font-medium ${isDark ? 'text-champagne-gold' : 'text-blue-600'}`}>
                        {entry.username}
                      </span>
                      <span
                        className={`
                        text-xs px-2 py-0.5 rounded-full font-medium
                        ${isDark ? 'bg-champagne-gold/20 text-champagne-gold' : 'bg-blue-100 text-blue-600'}
                      `}
                      >
                        You
                      </span>
                    </div>
                    <div className={`text-xs ${isDark ? 'text-platinum-silver/60' : 'text-gray-500'}`}>
                      {entry.watchesSold} watches • Avg: {formatCurrency(entry.avgProfit)}
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className={`font-semibold ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                      {formatCurrency(entry.totalProfit)}
                    </div>
                  </div>
                </motion.div>
              ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div
        className={`
        text-center text-xs pt-2 border-t
        ${isDark ? 'border-champagne-gold/20 text-platinum-silver/60' : 'border-gray-200 text-gray-500'}
      `}
      >
        Your rank: #{leaderboardData.userRank} of {leaderboardData.totalParticipants}
      </div>
    </div>
  );
};
