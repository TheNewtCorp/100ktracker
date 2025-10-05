import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, LayoutGrid } from 'lucide-react';
import { WidgetProps } from '../../types/widget';
import { useWatchData } from '../../hooks/useWatchData';
import { useTheme } from '../../hooks/useTheme';
import { formatCurrency, calculateNetProfit, calculateHoldTime } from '../../utils/metricsHelpers';
import { Watch } from '../../types';

// Line Graph component for monthly profit visualization
const LineGraph: React.FC<{ data: { label: string; value: number }[]; theme: 'light' | 'dark' }> = ({
  data,
  theme,
}) => {
  const [activePoint, setActivePoint] = useState<{ label: string; value: number; x: number; y: number } | null>(null);
  const width = 500;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };

  if (data.length < 2) {
    return (
      <div
        className={`h-[200px] flex items-center justify-center ${
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
      <svg viewBox={`0 0 ${width} ${height}`} className='w-[50%] h-auto mx-auto'>
        {/* Y-axis grid lines and labels */}
        {[...Array(4)].map((_, i) => {
          const y = padding.top + i * ((height - padding.top - padding.bottom) / 3);
          const val = maxVal - i * (valueRange / 3);
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

export const MonthlyProfitWidget: React.FC<WidgetProps> = ({ isLoading, error }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { watches, isLoading: watchesLoading, error: watchesError } = useWatchData();

  // Combine loading states and errors
  const loading = isLoading || watchesLoading;
  const combinedError = error || watchesError;

  const [yearFilter, setYearFilter] = useState('All Time');
  const [monthFilter, setMonthFilter] = useState('All Months');
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');

  // Process watches to get sold watches with profit calculations
  const soldWatches = useMemo(() => {
    return watches
      .filter((w) => w.dateSold && w.priceSold && w.purchasePrice)
      .map((w) => {
        const netProfit = calculateNetProfit(w);
        const holdTime = calculateHoldTime(w.inDate, w.dateSold);
        return { ...w, netProfit, holdTime };
      });
  }, [watches]);

  // Group by month
  const monthlyData = useMemo(() => {
    const groups: { [key: string]: { profit: number; count: number } } = {};
    soldWatches.forEach((w) => {
      if (w.dateSold && w.netProfit) {
        const period = w.dateSold.substring(0, 7); // YYYY-MM
        if (!groups[period]) groups[period] = { profit: 0, count: 0 };
        groups[period].profit += w.netProfit;
        groups[period].count += 1;
      }
    });
    return Object.entries(groups)
      .map(([period, data]) => ({ period, ...data }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [soldWatches]);

  const years = useMemo(
    () => ['All Time', ...Array.from(new Set(monthlyData.map((d) => d.period.substring(0, 4))))],
    [monthlyData],
  );
  const months = ['All Months', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const filteredData = useMemo(() => {
    let data = monthlyData;
    if (yearFilter !== 'All Time') {
      data = data.filter((d) => d.period.startsWith(yearFilter));
    }
    if (monthFilter !== 'All Months') {
      const monthIndex = months.indexOf(monthFilter);
      if (monthIndex > 0) {
        const monthString = monthIndex.toString().padStart(2, '0');
        data = data.filter((d) => d.period.substring(5, 7) === monthString);
      }
    }
    return data;
  }, [monthlyData, yearFilter, monthFilter, months]);

  if (loading) {
    return (
      <div className='space-y-4'>
        <div className='animate-pulse'>
          <div className='h-6 bg-gray-200 rounded w-3/4 mb-4'></div>
          <div className='flex gap-2 mb-4'>
            <div className='h-8 bg-gray-200 rounded w-24'></div>
            <div className='h-8 bg-gray-200 rounded w-24'></div>
          </div>
          <div className='h-48 bg-gray-200 rounded'></div>
        </div>
      </div>
    );
  }

  if (combinedError) {
    return <div className='text-center text-red-500 py-4'>Failed to load monthly profit data: {combinedError}</div>;
  }

  if (soldWatches.length === 0) {
    return (
      <div
        className={`text-center p-8 rounded-lg border-2 border-dashed ${
          isDark ? 'border-champagne-gold/20 text-platinum-silver/60' : 'border-gray-300 text-gray-600'
        }`}
      >
        No sales data available. Sell a watch to start tracking monthly profits.
      </div>
    );
  }

  const singleMonthView = yearFilter !== 'All Time' && monthFilter !== 'All Months';

  return (
    <div className='space-y-4'>
      {/* Controls */}
      <div className='flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between'>
        <div className='flex items-center gap-2'>
          <select
            value={yearFilter}
            onChange={(e) => {
              setYearFilter(e.target.value);
              if (e.target.value === 'All Time') setMonthFilter('All Months');
            }}
            className={`border rounded-md px-3 py-1.5 text-sm transition-colors ${
              isDark
                ? 'bg-charcoal-slate border-champagne-gold/20 text-platinum-silver focus:ring-champagne-gold focus:border-champagne-gold'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
            }`}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            disabled={yearFilter === 'All Time'}
            className={`border rounded-md px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
              isDark
                ? 'bg-charcoal-slate border-champagne-gold/20 text-platinum-silver focus:ring-champagne-gold focus:border-champagne-gold'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
            }`}
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {!singleMonthView && (
          <div
            className={`flex items-center p-1 rounded-md ${
              isDark ? 'bg-charcoal-slate' : 'bg-white border border-gray-300'
            }`}
          >
            <button
              onClick={() => setViewMode('graph')}
              className={`px-2 py-1 text-sm rounded transition-colors ${
                viewMode === 'graph'
                  ? isDark
                    ? 'bg-champagne-gold text-obsidian-black'
                    : 'bg-blue-600 text-white'
                  : isDark
                    ? 'text-platinum-silver/70 hover:bg-obsidian-black/50'
                    : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart2 size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2 py-1 text-sm rounded transition-colors ${
                viewMode === 'table'
                  ? isDark
                    ? 'bg-champagne-gold text-obsidian-black'
                    : 'bg-blue-600 text-white'
                  : isDark
                    ? 'text-platinum-silver/70 hover:bg-obsidian-black/50'
                    : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={singleMonthView ? 'single' : viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          {singleMonthView ? (
            // Single month summary view
            <div
              className={`text-center p-6 rounded-lg min-h-[200px] flex flex-col justify-center items-center ${
                isDark ? 'bg-charcoal-slate' : 'bg-white border border-gray-200'
              }`}
            >
              {filteredData.length > 0 ? (
                <>
                  <p className={isDark ? 'text-platinum-silver/70' : 'text-gray-600'}>
                    {monthFilter} {yearFilter} Summary
                  </p>
                  <p className='text-3xl font-bold text-money-green mt-2'>{formatCurrency(filteredData[0].profit)}</p>
                  <p className={`mt-1 ${isDark ? 'text-platinum-silver/80' : 'text-gray-700'}`}>
                    from {filteredData[0].count} sale(s)
                  </p>
                </>
              ) : (
                <p className={isDark ? 'text-platinum-silver/60' : 'text-gray-500'}>
                  No sales data for {monthFilter} {yearFilter}.
                </p>
              )}
            </div>
          ) : viewMode === 'graph' ? (
            // Graph view
            <div className='flex justify-center'>
              <div className='w-full'>
                <LineGraph
                  theme={theme}
                  data={filteredData.map((d) => ({
                    label: months[parseInt(d.period.substring(5, 7))],
                    value: d.profit,
                  }))}
                />
              </div>
            </div>
          ) : (
            // Table view
            <div className='overflow-auto max-h-60'>
              <table className='w-full text-sm text-left'>
                <thead className={`text-xs uppercase ${isDark ? 'text-champagne-gold' : 'text-gray-700'}`}>
                  <tr>
                    <th className='px-4 py-2'>Month</th>
                    <th className='px-4 py-2 text-right'>Watches Sold</th>
                    <th className='px-4 py-2 text-right'>Net Profit</th>
                  </tr>
                </thead>
                <tbody className={isDark ? 'text-platinum-silver/90' : 'text-gray-700'}>
                  {filteredData.map((d) => (
                    <tr
                      key={d.period}
                      className={`border-b ${isDark ? 'border-champagne-gold/10' : 'border-gray-200'}`}
                    >
                      <td className='px-4 py-2 font-medium'>
                        {months[parseInt(d.period.substring(5, 7))]} {d.period.substring(0, 4)}
                      </td>
                      <td className='px-4 py-2 text-right'>{d.count}</td>
                      <td className='px-4 py-2 text-right font-semibold text-money-green'>
                        {formatCurrency(d.profit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredData.length === 0 && !singleMonthView && (
            <div
              className={`h-[200px] flex items-center justify-center ${
                isDark ? 'text-platinum-silver/60' : 'text-gray-500'
              }`}
            >
              No sales data for the selected period.
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
