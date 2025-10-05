import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Clock,
  Hash,
  TrendingUp,
  LayoutGrid,
  BarChart2,
  Settings,
  Target,
  Trophy,
  BarChart,
} from 'lucide-react';
import { Watch, WatchSet } from '../../types';
import apiService from '../../services/apiService';
import StatCard from '../shared/StatCard';
import { useMetrics } from '../../hooks/useMetrics';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrency, calculateHoldTime, calculateNetProfit } from '../../utils/metricsHelpers';
import { WidgetGrid } from '../widgets/WidgetGrid';
import { WidgetSettingsPanel } from '../widgets/WidgetSettingsPanel';
import { useWidgetSettings } from '../../hooks/useWidgetSettings';
import { QuickStatsWidget } from '../widgets/QuickStatsWidget';
import { MonthlyProfitWidget } from '../widgets/MonthlyProfitWidget';
import { Goal100KWidget } from '../widgets/Goal100KWidget';
import { LeaderboardWidget } from '../widgets/LeaderboardWidget';
import { Widget, WidgetSettings } from '../../types/widget';

// Load watches from real API
const fetchWatchesFromAPI = async (): Promise<Watch[]> => {
  try {
    console.log('Fetching watch inventory for metrics...');
    const watchesResponse = await apiService.getWatches();

    // Transform API response to match frontend interface
    const transformedWatches = watchesResponse.watches.map((watch: any) => ({
      id: watch.id.toString(),
      brand: watch.brand,
      model: watch.model,
      referenceNumber: watch.reference_number,
      inDate: watch.in_date,
      serialNumber: watch.serial_number,
      watchSet: watch.watch_set as WatchSet,
      platformPurchased: watch.platform_purchased,
      purchasePrice: watch.purchase_price,
      liquidationPrice: watch.liquidation_price,
      accessories: watch.accessories,
      accessoriesCost: watch.accessories_cost,
      dateSold: watch.date_sold,
      platformSold: watch.platform_sold,
      priceSold: watch.price_sold,
      fees: watch.fees,
      shipping: watch.shipping,
      taxes: watch.taxes,
      notes: watch.notes,
    }));

    console.log('Transformed watches for metrics:', transformedWatches);
    return transformedWatches;
  } catch (error) {
    console.error('Failed to fetch watches for metrics:', error);
    throw error;
  }
};

const LineGraph: React.FC<{ data: { label: string; value: number }[]; theme: 'light' | 'dark' }> = ({
  data,
  theme,
}) => {
  const [activePoint, setActivePoint] = useState<{ label: string; value: number; x: number; y: number } | null>(null);
  const width = 500;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };

  if (data.length < 2) {
    return (
      <div
        className={`h-[250px] flex items-center justify-center ${
          theme === 'light' ? 'text-gray-500' : 'text-platinum-silver/60'
        }`}
      >
        Not enough data to draw a graph.
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values, 0);
  const maxVal = Math.max(...values);
  const valueRange = maxVal - minVal;

  const points = data.map((d, i) => {
    const x = padding.left + i * ((width - padding.left - padding.right) / (data.length - 1));
    const y = padding.top + (height - padding.top - padding.bottom) * (1 - (d.value - minVal) / (valueRange || 1));
    return { x, y, ...d };
  });

  const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x} ${p.y}`).join(' ');

  const gridStroke = theme === 'light' ? 'rgba(156, 163, 175, 0.3)' : 'rgba(200, 169, 126, 0.1)';
  const textFill = theme === 'light' ? 'rgba(107, 114, 128, 0.8)' : 'rgba(230, 230, 230, 0.6)';
  const lineStroke = theme === 'light' ? '#3B82F6' : '#C8A97E';
  const pointFill = theme === 'light' ? '#3B82F6' : '#C8A97E';

  return (
    <div className='relative'>
      <svg viewBox={`0 0 ${width} ${height}`} className='w-full h-auto'>
        {/* Y-axis grid lines and labels */}
        {[...Array(5)].map((_, i) => {
          const y = padding.top + i * ((height - padding.top - padding.bottom) / 4);
          const val = maxVal - i * (valueRange / 4);
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={gridStroke} />
              <text x={padding.left - 8} y={y + 4} fill={textFill} textAnchor='end' fontSize='10'>
                {formatCurrency(val)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {points.map((p, i) => (
          <text key={i} x={p.x} y={height - 10} fill={textFill} textAnchor='middle' fontSize='10'>
            {p.label}
          </text>
        ))}

        <path d={path} fill='none' stroke={lineStroke} strokeWidth='2' />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r='8'
            fill='transparent'
            onMouseEnter={() => setActivePoint(p)}
            onMouseLeave={() => setActivePoint(null)}
          />
        ))}
        {points.map((p, i) => (
          <circle key={`solid-${i}`} cx={p.x} cy={p.y} r='3' fill={pointFill} className='pointer-events-none' />
        ))}
      </svg>
      <AnimatePresence>
        {activePoint && (
          <motion.div
            className={`absolute p-2 rounded-md text-xs pointer-events-none shadow-lg border ${
              theme === 'light'
                ? 'bg-white border-gray-200 text-gray-900'
                : 'bg-obsidian-black border-champagne-gold/20 text-platinum-silver'
            }`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              left: activePoint.x,
              top: activePoint.y,
              transform: `translate(-50%, -120%)`,
            }}
          >
            <p className={`font-bold ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
              {activePoint.label}
            </p>
            <p className='text-money-green'>{formatCurrency(activePoint.value)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface MetricsPageProps {
  inventoryUpdateTrigger?: number; // Trigger number that causes metrics to refresh when changed
}

const MetricsPage: React.FC<MetricsPageProps> = ({ inventoryUpdateTrigger }) => {
  const { theme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);

  // Use the shared metrics hook instead of local data fetching
  const { metrics, isLoading, error, refetch } = useMetrics(inventoryUpdateTrigger);
  const { settings, toggleWidget, updateWidgetOrder, updateWidgetSettings, resetToDefaults } = useWidgetSettings();

  // Create handlers that match the expected interface
  const handleSettingsChange = (newSettings: WidgetSettings[]) => {
    // For now, we'll update each setting individually
    newSettings.forEach((setting) => {
      if (setting.customSettings) {
        updateWidgetSettings(setting.widgetId, setting.customSettings);
      }
    });
  };

  // Define available widgets
  const widgets: Widget[] = [
    {
      id: 'quick-stats',
      name: 'Quick Stats',
      description: 'Overview of key trading metrics',
      icon: BarChart,
      component: QuickStatsWidget,
      enabled: true,
      order: 0,
      size: 'large',
      category: 'analytics',
    },
    {
      id: 'monthly-profit',
      name: 'Monthly Profit Tracker',
      description: 'Track profits by month with interactive charts',
      icon: TrendingUp,
      component: MonthlyProfitWidget,
      enabled: true,
      order: 1,
      size: 'full-width',
      category: 'profits',
    },
    {
      id: '100k-goal',
      name: '100K Goal Tracker',
      description: 'Track progress toward $100K annual profit goal',
      icon: Target,
      component: Goal100KWidget,
      enabled: true,
      order: 2,
      size: 'large',
      category: 'goals',
    },
    {
      id: 'leaderboard',
      name: 'Trader Leaderboard',
      description: 'See how you rank against other traders',
      icon: Trophy,
      component: LeaderboardWidget,
      enabled: true,
      order: 3,
      size: 'medium',
      category: 'social',
    },
  ];

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div
          className={`w-8 h-8 border-4 rounded-full animate-spin ${
            theme === 'light' ? 'border-blue-600 border-t-transparent' : 'border-champagne-gold border-t-transparent'
          }`}
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-8'>
        <div
          className={`border rounded-lg p-4 mb-6 ${
            theme === 'light' ? 'bg-red-50 border-red-200' : 'bg-crimson-red/10 border-crimson-red/20'
          }`}
        >
          <p className='text-crimson-red font-medium'>Error loading metrics data</p>
          <p className={`text-sm mt-1 ${theme === 'light' ? 'text-red-600' : 'text-crimson-red/80'}`}>{error}</p>
          <button
            onClick={refetch}
            className={`mt-3 px-4 py-2 rounded-lg text-sm transition-colors ${
              theme === 'light'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-crimson-red text-white hover:bg-red-700'
            }`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h2 className={`text-2xl font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
            Overall Performance
          </h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm
              ${
                theme === 'light'
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-charcoal-slate hover:bg-obsidian-black text-platinum-silver'
              }
            `}
          >
            <Settings size={16} />
            Widget Settings
          </button>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <StatCard
            icon={<DollarSign size={24} />}
            label='Total Net Profit'
            value={formatCurrency(metrics.totalProfit)}
          />
          <StatCard icon={<Clock size={24} />} label='Average Hold Time' value={`${metrics.avgHoldTime} Days`} />
          <StatCard icon={<Hash size={24} />} label='Total Watches Sold' value={metrics.totalSold.toString()} />
          <StatCard
            icon={<TrendingUp size={24} />}
            label='Average Profit/Watch'
            value={formatCurrency(metrics.avgProfit)}
          />
        </div>
      </div>

      {/* Widget Settings Panel */}
      {showSettings && (
        <WidgetSettingsPanel
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          widgets={widgets}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onResetToDefaults={resetToDefaults}
        />
      )}

      {/* Widget Grid */}
      <div>
        <h2 className={`text-2xl font-semibold mb-6 ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
          Dashboard Widgets
        </h2>
        <WidgetGrid
          widgets={widgets}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onWidgetToggle={toggleWidget}
          isLoading={isLoading}
          error={error ? error : undefined}
        />
      </div>
    </div>
  );
};
export default MetricsPage;
