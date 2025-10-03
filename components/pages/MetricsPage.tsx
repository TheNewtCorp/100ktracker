import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Clock, Hash, TrendingUp, LayoutGrid, BarChart2 } from 'lucide-react';
import { Watch, WatchSet } from '../../types';
import apiService from '../../services/apiService';
import StatCard from '../shared/StatCard';
import { useMetrics } from '../../hooks/useMetrics';
import { formatCurrency, calculateHoldTime, calculateNetProfit } from '../../utils/metricsHelpers';

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

const LineGraph: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
  const [activePoint, setActivePoint] = useState<{ label: string; value: number; x: number; y: number } | null>(null);
  const width = 500;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };

  if (data.length < 2) {
    return (
      <div className='h-[250px] flex items-center justify-center text-platinum-silver/60'>
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

  return (
    <div className='relative'>
      <svg viewBox={`0 0 ${width} ${height}`} className='w-full h-auto'>
        {/* Y-axis grid lines and labels */}
        {[...Array(5)].map((_, i) => {
          const y = padding.top + i * ((height - padding.top - padding.bottom) / 4);
          const val = maxVal - i * (valueRange / 4);
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke='rgba(200, 169, 126, 0.1)' />
              <text x={padding.left - 8} y={y + 4} fill='rgba(230, 230, 230, 0.6)' textAnchor='end' fontSize='10'>
                {formatCurrency(val)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {points.map((p, i) => (
          <text key={i} x={p.x} y={height - 10} fill='rgba(230, 230, 230, 0.6)' textAnchor='middle' fontSize='10'>
            {p.label}
          </text>
        ))}

        <path d={path} fill='none' stroke='#C8A97E' strokeWidth='2' />

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
          <circle key={`solid-${i}`} cx={p.x} cy={p.y} r='3' fill='#C8A97E' className='pointer-events-none' />
        ))}
      </svg>
      <AnimatePresence>
        {activePoint && (
          <motion.div
            className='absolute bg-obsidian-black p-2 rounded-md text-xs pointer-events-none shadow-lg border border-champagne-gold/20'
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              left: activePoint.x,
              top: activePoint.y,
              transform: `translate(-50%, -120%)`,
            }}
          >
            <p className='font-bold text-platinum-silver'>{activePoint.label}</p>
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
  const [yearFilter, setYearFilter] = useState('All Time');
  const [monthFilter, setMonthFilter] = useState('All Months');
  const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');

  // Use the shared metrics hook instead of local data fetching
  const { metrics, isLoading, error, refetch } = useMetrics(inventoryUpdateTrigger);

  // Still need to fetch watches for the detailed filtering and graphs
  const [watches, setWatches] = useState<Watch[]>([]);
  const [watchesLoading, setWatchesLoading] = useState(true);
  const [watchesError, setWatchesError] = useState<string | null>(null);

  const loadWatchData = useCallback(async () => {
    setWatchesLoading(true);
    setWatchesError(null);
    try {
      const fetchedWatches = await fetchWatchesFromAPI();
      setWatches(fetchedWatches);
    } catch (err: any) {
      setWatchesError(err.message || 'Failed to load watch data');
      console.error('Failed to load watch data:', err);
    } finally {
      setWatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWatchData();
  }, [loadWatchData]);

  // Reload data when inventory changes (triggered by inventoryUpdateTrigger)
  useEffect(() => {
    if (inventoryUpdateTrigger && inventoryUpdateTrigger > 0) {
      console.log('MetricsPage: Inventory update trigger received, reloading metrics data');
      loadWatchData();
    }
  }, [inventoryUpdateTrigger, loadWatchData]);

  const soldWatches = useMemo(() => {
    return watches
      .filter((w) => w.dateSold && w.priceSold && w.purchasePrice)
      .map((w) => {
        const netProfit = calculateNetProfit(w);
        const holdTime = calculateHoldTime(w.inDate, w.dateSold);
        return { ...w, netProfit, holdTime };
      });
  }, [watches]);

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

  if (isLoading || watchesLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='w-8 h-8 border-4 border-champagne-gold border-t-transparent rounded-full animate-spin'></div>
      </div>
    );
  }

  if (error || watchesError) {
    return (
      <div className='p-8'>
        <div className='bg-crimson-red/10 border border-crimson-red/20 rounded-lg p-4 mb-6'>
          <p className='text-crimson-red font-medium'>Error loading metrics data</p>
          <p className='text-crimson-red/80 text-sm mt-1'>{error || watchesError}</p>
          <button
            onClick={() => {
              refetch();
              loadWatchData();
            }}
            className='mt-3 px-4 py-2 bg-crimson-red text-white rounded-lg text-sm hover:bg-red-700'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (soldWatches.length === 0) {
    return (
      <div className='p-8 border-2 border-dashed border-champagne-gold/20 rounded-lg text-center text-platinum-silver/60'>
        No sales data available. Sell a watch to start seeing your metrics.
      </div>
    );
  }

  const singleMonthView = yearFilter !== 'All Time' && monthFilter !== 'All Months';

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-2xl font-semibold text-platinum-silver mb-4'>Overall Performance</h2>
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

      <div className='bg-obsidian-black/50 p-6 rounded-xl border border-champagne-gold/10'>
        <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4'>
          <h2 className='text-2xl font-semibold text-platinum-silver'>Monthly Profit Tracker</h2>
          <div className='flex items-center gap-2'>
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                if (e.target.value === 'All Time') setMonthFilter('All Months');
              }}
              className='bg-charcoal-slate border border-champagne-gold/20 text-platinum-silver rounded-md px-3 py-1.5 text-sm focus:ring-champagne-gold focus:border-champagne-gold'
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
              className='bg-charcoal-slate border border-champagne-gold/20 text-platinum-silver rounded-md px-3 py-1.5 text-sm focus:ring-champagne-gold focus:border-champagne-gold disabled:opacity-50'
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            {!singleMonthView && (
              <div className='flex items-center bg-charcoal-slate p-1 rounded-md'>
                <button
                  onClick={() => setViewMode('graph')}
                  className={`px-2 py-1 text-sm rounded ${viewMode === 'graph' ? 'bg-champagne-gold text-obsidian-black' : 'text-platinum-silver/70 hover:bg-obsidian-black/50'}`}
                >
                  <BarChart2 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2 py-1 text-sm rounded ${viewMode === 'table' ? 'bg-champagne-gold text-obsidian-black' : 'text-platinum-silver/70 hover:bg-obsidian-black/50'}`}
                >
                  <LayoutGrid size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
        <AnimatePresence mode='wait'>
          <motion.div
            key={singleMonthView ? 'single' : viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {singleMonthView ? (
              <div className='text-center p-8 bg-charcoal-slate rounded-lg min-h-[250px] flex flex-col justify-center items-center'>
                {filteredData.length > 0 ? (
                  <>
                    <p className='text-platinum-silver/70'>
                      {monthFilter} {yearFilter} Summary
                    </p>
                    <p className='text-4xl font-bold text-money-green mt-2'>{formatCurrency(filteredData[0].profit)}</p>
                    <p className='text-platinum-silver/80 mt-1'>from {filteredData[0].count} sale(s)</p>
                  </>
                ) : (
                  <p className='text-platinum-silver/60'>
                    No sales data for {monthFilter} {yearFilter}.
                  </p>
                )}
              </div>
            ) : viewMode === 'graph' ? (
              <div className='flex justify-center'>
                <div className='w-full max-w-2xl'>
                  <LineGraph
                    data={filteredData.map((d) => ({
                      label: months[parseInt(d.period.substring(5, 7))],
                      value: d.profit,
                    }))}
                  />
                </div>
              </div>
            ) : (
              <div className='overflow-auto max-h-[300px]'>
                <table className='w-full text-sm text-left'>
                  <thead className='text-xs text-champagne-gold uppercase'>
                    <tr>
                      <th className='px-4 py-2'>Month</th>
                      <th className='px-4 py-2 text-right'>Watches Sold</th>
                      <th className='px-4 py-2 text-right'>Net Profit</th>
                    </tr>
                  </thead>
                  <tbody className='text-platinum-silver/90'>
                    {filteredData.map((d) => (
                      <tr key={d.period} className='border-b border-champagne-gold/10'>
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
              <div className='h-[250px] flex items-center justify-center text-platinum-silver/60'>
                No sales data for the selected period.
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MetricsPage;
