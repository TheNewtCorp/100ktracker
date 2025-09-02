import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Clock, Hash, TrendingUp, LayoutGrid, BarChart2 } from 'lucide-react';
import { Watch, WatchSet } from '../../types';

// Mock API function - expanded with more data for better metrics visualization
const fetchWatchesFromAPI = async (): Promise<Watch[]> => {
  console.log('Fetching watch inventory for metrics...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  return [
    { id: 'w1', brand: 'Rolex', model: 'Submariner', referenceNumber: '126610LN', inDate: '2023-05-15', purchasePrice: 13500, accessoriesCost: 150, dateSold: '2023-09-20', priceSold: 15500, fees: 450, shipping: 100 },
    { id: 'w2', brand: 'Omega', model: 'Speedmaster', referenceNumber: '310.30.42.50.01.001', inDate: '2023-02-10', purchasePrice: 6200, watchSet: WatchSet.FullSet },
    { id: 'w3', brand: 'Audemars Piguet', model: 'Royal Oak', referenceNumber: '15500ST.OO.1220ST.03', inDate: '2023-07-01', purchasePrice: 45000, liquidationPrice: 42000 },
    { id: 'w4', brand: 'Patek Philippe', model: 'Nautilus', referenceNumber: '5711/1A-010', inDate: '2023-01-05', purchasePrice: 120000, dateSold: '2023-04-10', priceSold: 150000, fees: 3000, shipping: 250 },
    { id: 'w5', brand: 'Rolex', model: 'Daytona', referenceNumber: '116500LN', inDate: '2023-08-20', purchasePrice: 28000, dateSold: '2023-09-25', priceSold: 32000, fees: 800, shipping: 150 },
    { id: 'w6', brand: 'Tudor', model: 'Black Bay 58', referenceNumber: 'M79030N-0001', inDate: '2024-01-10', purchasePrice: 3800, dateSold: '2024-02-15', priceSold: 4200, fees: 100, shipping: 50 },
    { id: 'w7', brand: 'Cartier', model: 'Santos', referenceNumber: 'WSSA0029', inDate: '2024-02-01', purchasePrice: 6500, dateSold: '2024-03-20', priceSold: 7100, fees: 200, shipping: 75 },
    { id: 'w8', brand: 'Rolex', model: 'GMT-Master II', referenceNumber: '126710BLNR', inDate: '2022-11-15', purchasePrice: 16000, dateSold: '2023-01-30', priceSold: 18500, fees: 500, shipping: 120 },
  ];
};

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; }> = ({ icon, label, value }) => (
    <div className="bg-charcoal-slate p-4 rounded-lg flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-champagne-gold/10 text-champagne-gold rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-sm text-platinum-silver/70">{label}</p>
            <p className="text-2xl font-bold text-platinum-silver">{value}</p>
        </div>
    </div>
);

const LineGraph: React.FC<{ data: { label: string, value: number }[] }> = ({ data }) => {
    const [activePoint, setActivePoint] = useState<{ label: string, value: number, x: number, y: number } | null>(null);
    const width = 500;
    const height = 250;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };

    if (data.length < 2) {
        return <div className="h-[250px] flex items-center justify-center text-platinum-silver/60">Not enough data to draw a graph.</div>;
    }

    const values = data.map(d => d.value);
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
        <div className="relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Y-axis grid lines and labels */}
                {[...Array(5)].map((_, i) => {
                    const y = padding.top + i * ((height - padding.top - padding.bottom) / 4);
                    const val = maxVal - i * (valueRange / 4);
                    return (
                        <g key={i}>
                            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(200, 169, 126, 0.1)" />
                            <text x={padding.left - 8} y={y + 4} fill="rgba(230, 230, 230, 0.6)" textAnchor="end" fontSize="10">
                                {formatCurrency(val)}
                            </text>
                        </g>
                    );
                })}

                {/* X-axis labels */}
                {points.map((p, i) => (
                    <text key={i} x={p.x} y={height - 10} fill="rgba(230, 230, 230, 0.6)" textAnchor="middle" fontSize="10">
                        {p.label}
                    </text>
                ))}

                <path d={path} fill="none" stroke="#C8A97E" strokeWidth="2" />

                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="8"
                        fill="transparent"
                        onMouseEnter={() => setActivePoint(p)}
                        onMouseLeave={() => setActivePoint(null)}
                    />
                ))}
                 {points.map((p, i) => (
                    <circle key={`solid-${i}`} cx={p.x} cy={p.y} r="3" fill="#C8A97E" className="pointer-events-none" />
                ))}
            </svg>
            <AnimatePresence>
                {activePoint && (
                    <motion.div
                        className="absolute bg-obsidian-black p-2 rounded-md text-xs pointer-events-none shadow-lg border border-champagne-gold/20"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                            left: activePoint.x,
                            top: activePoint.y,
                            transform: `translate(-50%, -120%)`,
                        }}
                    >
                        <p className="font-bold text-platinum-silver">{activePoint.label}</p>
                        <p className="text-money-green">{formatCurrency(activePoint.value)}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

const MetricsPage: React.FC = () => {
    const [watches, setWatches] = useState<Watch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [yearFilter, setYearFilter] = useState('All Time');
    const [monthFilter, setMonthFilter] = useState('All Months');
    const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            const fetchedWatches = await fetchWatchesFromAPI();
            setWatches(fetchedWatches);
            setIsLoading(false);
        };
        loadData();
    }, []);

    const soldWatches = useMemo(() => {
        return watches
            .filter(w => w.dateSold && w.priceSold && w.purchasePrice)
            .map(w => {
                const totalIn = (w.purchasePrice || 0) + (w.accessoriesCost || 0);
                const netProfit = (w.priceSold || 0) - totalIn - (w.fees || 0) - (w.shipping || 0) - (w.taxes || 0);
                let holdTime: number | undefined = undefined;
                if (w.inDate && w.dateSold) {
                    const start = new Date(w.inDate).getTime();
                    const end = new Date(w.dateSold).getTime();
                    if (end > start) holdTime = Math.round((end - start) / (1000 * 60 * 60 * 24));
                }
                return { ...w, netProfit, holdTime };
            });
    }, [watches]);

    const overallStats = useMemo(() => {
        if (soldWatches.length === 0) return { totalProfit: 0, avgHoldTime: 0, totalSold: 0, avgProfit: 0 };
        const totalProfit = soldWatches.reduce((sum, w) => sum + (w.netProfit || 0), 0);
        const totalHoldTime = soldWatches.reduce((sum, w) => sum + (w.holdTime || 0), 0);
        const watchesWithHoldTime = soldWatches.filter(w => w.holdTime !== undefined).length;

        return {
            totalProfit,
            avgHoldTime: watchesWithHoldTime > 0 ? Math.round(totalHoldTime / watchesWithHoldTime) : 0,
            totalSold: soldWatches.length,
            avgProfit: soldWatches.length > 0 ? totalProfit / soldWatches.length : 0,
        };
    }, [soldWatches]);
    
    const monthlyData = useMemo(() => {
        const groups: { [key: string]: { profit: number, count: number } } = {};
        soldWatches.forEach(w => {
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

    const years = useMemo(() => ['All Time', ...Array.from(new Set(monthlyData.map(d => d.period.substring(0, 4))))], [monthlyData]);
    const months = ["All Months", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const filteredData = useMemo(() => {
        let data = monthlyData;
        if (yearFilter !== 'All Time') {
            data = data.filter(d => d.period.startsWith(yearFilter));
        }
        if (monthFilter !== 'All Months') {
            const monthIndex = months.indexOf(monthFilter);
            if(monthIndex > 0) {
                 const monthString = monthIndex.toString().padStart(2, '0');
                 data = data.filter(d => d.period.substring(5, 7) === monthString);
            }
        }
        return data;
    }, [monthlyData, yearFilter, monthFilter, months]);


    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-4 border-champagne-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (soldWatches.length === 0) {
        return (
            <div className="p-8 border-2 border-dashed border-champagne-gold/20 rounded-lg text-center text-platinum-silver/60">
                No sales data available. Sell a watch to start seeing your metrics.
            </div>
        );
    }
    
    const singleMonthView = yearFilter !== 'All Time' && monthFilter !== 'All Months';

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-semibold text-platinum-silver mb-4">Overall Performance</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={<DollarSign size={24} />} label="Total Net Profit" value={formatCurrency(overallStats.totalProfit)} />
                    <StatCard icon={<Clock size={24} />} label="Average Hold Time" value={`${overallStats.avgHoldTime} Days`} />
                    <StatCard icon={<Hash size={24} />} label="Total Watches Sold" value={overallStats.totalSold.toString()} />
                    <StatCard icon={<TrendingUp size={24} />} label="Average Profit/Watch" value={formatCurrency(overallStats.avgProfit)} />
                </div>
            </div>
            
             <div className="bg-obsidian-black/50 p-6 rounded-xl border border-champagne-gold/10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-semibold text-platinum-silver">Monthly Profit Tracker</h2>
                    <div className="flex items-center gap-2">
                        <select value={yearFilter} onChange={e => { setYearFilter(e.target.value); if(e.target.value === 'All Time') setMonthFilter('All Months')}} className="bg-charcoal-slate border border-champagne-gold/20 text-platinum-silver rounded-md px-3 py-1.5 text-sm focus:ring-champagne-gold focus:border-champagne-gold">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} disabled={yearFilter === 'All Time'} className="bg-charcoal-slate border border-champagne-gold/20 text-platinum-silver rounded-md px-3 py-1.5 text-sm focus:ring-champagne-gold focus:border-champagne-gold disabled:opacity-50">
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        {!singleMonthView && (
                             <div className="flex items-center bg-charcoal-slate p-1 rounded-md">
                                <button onClick={() => setViewMode('graph')} className={`px-2 py-1 text-sm rounded ${viewMode === 'graph' ? 'bg-champagne-gold text-obsidian-black' : 'text-platinum-silver/70 hover:bg-obsidian-black/50'}`}><BarChart2 size={16}/></button>
                                <button onClick={() => setViewMode('table')} className={`px-2 py-1 text-sm rounded ${viewMode === 'table' ? 'bg-champagne-gold text-obsidian-black' : 'text-platinum-silver/70 hover:bg-obsidian-black/50'}`}><LayoutGrid size={16}/></button>
                            </div>
                        )}
                    </div>
                </div>
                 <AnimatePresence mode="wait">
                    <motion.div
                        key={singleMonthView ? 'single' : viewMode}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        {singleMonthView ? (
                            <div className="text-center p-8 bg-charcoal-slate rounded-lg min-h-[250px] flex flex-col justify-center items-center">
                                {filteredData.length > 0 ? (
                                    <>
                                        <p className="text-platinum-silver/70">{monthFilter} {yearFilter} Summary</p>
                                        <p className="text-4xl font-bold text-money-green mt-2">{formatCurrency(filteredData[0].profit)}</p>
                                        <p className="text-platinum-silver/80 mt-1">from {filteredData[0].count} sale(s)</p>
                                    </>
                                ) : (
                                    <p className="text-platinum-silver/60">No sales data for {monthFilter} {yearFilter}.</p>
                                )}
                            </div>
                        ) : viewMode === 'graph' ? (
                           <div className="flex justify-center">
                               <div className="w-full max-w-2xl">
                                   <LineGraph data={filteredData.map(d => ({ label: months[parseInt(d.period.substring(5,7))], value: d.profit }))} />
                               </div>
                           </div>
                        ) : (
                            <div className="overflow-auto max-h-[300px]">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-champagne-gold uppercase">
                                        <tr>
                                            <th className="px-4 py-2">Month</th>
                                            <th className="px-4 py-2 text-right">Watches Sold</th>
                                            <th className="px-4 py-2 text-right">Net Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-platinum-silver/90">
                                        {filteredData.map(d => (
                                            <tr key={d.period} className="border-b border-champagne-gold/10">
                                                <td className="px-4 py-2 font-medium">{months[parseInt(d.period.substring(5,7))]} {d.period.substring(0,4)}</td>
                                                <td className="px-4 py-2 text-right">{d.count}</td>
                                                <td className="px-4 py-2 text-right font-semibold text-money-green">{formatCurrency(d.profit)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                         {filteredData.length === 0 && !singleMonthView && <div className="h-[250px] flex items-center justify-center text-platinum-silver/60">No sales data for the selected period.</div>}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MetricsPage;