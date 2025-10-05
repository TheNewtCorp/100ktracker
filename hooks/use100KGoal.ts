import { useMemo } from 'react';
import { Watch } from '../types';
import { calculateNetProfit } from '../utils/metricsHelpers';
import { Goal100KData } from '../types/widget';

export const use100KGoal = (watches: Watch[]): Goal100KData => {
  return useMemo(() => {
    const currentYear = new Date().getFullYear();
    const goalAmount = 100000;

    // Filter watches sold in current year
    const currentYearSales = watches.filter((watch) => {
      if (!watch.dateSold || !watch.priceSold || !watch.purchasePrice) return false;
      const saleYear = new Date(watch.dateSold).getFullYear();
      return saleYear === currentYear;
    });

    // Calculate current year profit
    const currentYearProfit = currentYearSales.reduce((total, watch) => {
      return total + calculateNetProfit(watch);
    }, 0);

    // Calculate progress
    const progressPercentage = Math.min((currentYearProfit / goalAmount) * 100, 100);
    const remainingAmount = Math.max(goalAmount - currentYearProfit, 0);

    // Calculate days and targets
    const now = new Date();
    const endOfYear = new Date(currentYear, 11, 31); // December 31st
    const startOfYear = new Date(currentYear, 0, 1); // January 1st
    const totalDaysInYear = Math.ceil((endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysPassed = Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeftInYear = Math.max(totalDaysInYear - daysPassed, 0);

    const dailyTargetNeeded = daysLeftInYear > 0 ? remainingAmount / daysLeftInYear : 0;

    // Calculate if on track (based on time elapsed vs progress made)
    const timeProgress = daysPassed / totalDaysInYear;
    const isOnTrack = progressPercentage / 100 >= timeProgress;

    // Project end amount based on current pace
    const projectedEndAmount = timeProgress > 0 ? currentYearProfit / timeProgress : currentYearProfit;

    // Generate monthly breakdown
    const monthlyBreakdown = Array.from({ length: 12 }, (_, monthIndex) => {
      const monthStart = new Date(currentYear, monthIndex, 1);
      const monthEnd = new Date(currentYear, monthIndex + 1, 0);
      const monthName = monthStart.toLocaleDateString('en-US', { month: 'short' });

      // Calculate target for this month (goal / 12)
      const monthlyTarget = goalAmount / 12;

      // Calculate actual for this month
      const monthSales = currentYearSales.filter((watch) => {
        if (!watch.dateSold) return false;
        const saleDate = new Date(watch.dateSold);
        return saleDate >= monthStart && saleDate <= monthEnd;
      });

      const monthlyActual = monthSales.reduce((total, watch) => {
        return total + calculateNetProfit(watch);
      }, 0);

      // Month is complete if it's in the past
      const isComplete = monthEnd < now;

      return {
        month: monthName,
        target: monthlyTarget,
        actual: monthlyActual,
        isComplete,
      };
    });

    return {
      currentYearProfit,
      goalAmount,
      progressPercentage,
      remainingAmount,
      daysLeftInYear,
      dailyTargetNeeded,
      isOnTrack,
      projectedEndAmount,
      monthlyBreakdown,
    };
  }, [watches]);
};
