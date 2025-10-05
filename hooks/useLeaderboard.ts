import { useMemo } from 'react';
import { LeaderboardData, LeaderboardEntry } from '../types/widget';
import { Watch } from '../types';
import { calculateNetProfit } from '../utils/metricsHelpers';

// Mock usernames for privacy (in a real app, these would be hashed)
const mockUsernames = [
  'WatchMaster97',
  'TimeKeeper42',
  'LuxuryHunter',
  'ChronoTrader',
  'WristWizard',
  'DialDynamo',
  'TickTockPro',
  'HorologyHero',
  'WatchWhisperer',
  'TimeTrader88',
  'LuxuryLegend',
  'ChronoChamp',
  'WatchWarlord',
  'DialDealer',
  'TimeflipperX',
  'WristRoyalty',
  'HourglassHero',
  'TickTockTycoon',
  'WatchNinja',
  'ChronoKing',
];

const badges = [
  '🏆', // Top performer
  '🔥', // Hot streak
  '💎', // Luxury specialist
  '⚡', // Quick turner
  '🎯', // Goal crusher
  '🚀', // Rising star
  '👑', // Leaderboard king
  '💪', // Power trader
];

// Generate realistic mock leaderboard data
const generateMockLeaderboardData = (userStats: { profit: number; watchesSold: number }): LeaderboardEntry[] => {
  const mockEntries: LeaderboardEntry[] = [];

  // Generate 19 other users with realistic data
  for (let i = 0; i < 19; i++) {
    const baseProfit = Math.random() * 150000; // Random profit up to $150k
    const watchesSold = Math.floor(Math.random() * 50) + 1; // 1-50 watches
    const avgProfit = baseProfit / watchesSold;

    mockEntries.push({
      rank: 0, // Will be set after sorting
      username: mockUsernames[i % mockUsernames.length] + (i > mockUsernames.length - 1 ? i + 1 : ''),
      totalProfit: Math.round(baseProfit),
      watchesSold,
      avgProfit: Math.round(avgProfit),
      isCurrentUser: false,
      badge: Math.random() > 0.7 ? badges[Math.floor(Math.random() * badges.length)] : undefined,
    });
  }

  // Add current user
  mockEntries.push({
    rank: 0,
    username: 'You',
    totalProfit: Math.round(userStats.profit),
    watchesSold: userStats.watchesSold,
    avgProfit: userStats.watchesSold > 0 ? Math.round(userStats.profit / userStats.watchesSold) : 0,
    isCurrentUser: true,
  });

  // Sort by total profit and assign ranks
  const sortedEntries = mockEntries
    .sort((a, b) => b.totalProfit - a.totalProfit)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  return sortedEntries;
};

export const useLeaderboard = (watches: Watch[]): LeaderboardData => {
  return useMemo(() => {
    // Calculate user's current year stats
    const currentYear = new Date().getFullYear();
    const currentYearSales = watches.filter((watch) => {
      if (!watch.dateSold || !watch.priceSold || !watch.purchasePrice) return false;
      const saleYear = new Date(watch.dateSold).getFullYear();
      return saleYear === currentYear;
    });

    const userProfit = currentYearSales.reduce((total, watch) => {
      return total + calculateNetProfit(watch);
    }, 0);

    const userStats = {
      profit: userProfit,
      watchesSold: currentYearSales.length,
    };

    // Generate mock leaderboard
    const allEntries = generateMockLeaderboardData(userStats);

    // Get top 10 entries
    const topEntries = allEntries.slice(0, 10);

    // Find user's rank
    const userEntry = allEntries.find((entry) => entry.isCurrentUser);
    const userRank = userEntry?.rank || allEntries.length;

    // If user is not in top 10, add them to the list
    let entries = topEntries;
    if (userRank > 10 && userEntry) {
      entries = [...topEntries, userEntry];
    }

    return {
      entries,
      userRank,
      totalParticipants: allEntries.length,
      season: `${currentYear} Annual`,
    };
  }, [watches]);
};
