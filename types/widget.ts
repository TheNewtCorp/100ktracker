import { LucideIcon } from 'lucide-react';
import { ComponentType } from 'react';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full-width';
export type WidgetCategory = 'profits' | 'goals' | 'social' | 'analytics';

export interface Widget {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  component: ComponentType<WidgetProps>;
  enabled: boolean;
  order: number;
  size: WidgetSize;
  category: WidgetCategory;
  defaultSettings?: Record<string, any>;
}

export interface WidgetSettings {
  widgetId: string;
  enabled: boolean;
  order: number;
  customSettings?: Record<string, any>;
}

export interface WidgetProps {
  widgetId: string;
  settings?: Record<string, any>;
  onSettingsChange?: (settings: Record<string, any>) => void;
  isLoading?: boolean;
  error?: string | null;
}

export interface Goal100KData {
  currentYearProfit: number;
  goalAmount: number;
  progressPercentage: number;
  remainingAmount: number;
  daysLeftInYear: number;
  dailyTargetNeeded: number;
  isOnTrack: boolean;
  projectedEndAmount: number;
  monthlyBreakdown: {
    month: string;
    target: number;
    actual: number;
    isComplete: boolean;
  }[];
}

export interface LeaderboardEntry {
  rank: number;
  username: string; // Anonymized
  totalProfit: number;
  watchesSold: number;
  avgProfit: number;
  isCurrentUser: boolean;
  badge?: string;
}

export interface LeaderboardData {
  entries: LeaderboardEntry[];
  userRank: number;
  totalParticipants: number;
  season: string;
}
