import { useState, useEffect, useMemo, useCallback } from 'react';
import { Watch, WatchSet } from '../types';
import apiService from '../services/apiService';
import { calculateHoldTime, calculateNetProfit } from '../utils/metricsHelpers';

interface MetricsData {
  totalProfit: number;
  avgHoldTime: number;
  totalSold: number;
  avgProfit: number;
}

interface UseMetricsReturn {
  metrics: MetricsData;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

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

export const useMetrics = (inventoryUpdateTrigger?: number): UseMetricsReturn => {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedWatches = await fetchWatchesFromAPI();
      setWatches(fetchedWatches);
    } catch (err: any) {
      setError(err.message || 'Failed to load watch data');
      console.error('Failed to load watch data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload data when inventory changes (triggered by inventoryUpdateTrigger)
  useEffect(() => {
    if (inventoryUpdateTrigger && inventoryUpdateTrigger > 0) {
      console.log('useMetrics: Inventory update trigger received, reloading metrics data');
      loadData();
    }
  }, [inventoryUpdateTrigger, loadData]);

  const soldWatches = useMemo(() => {
    return watches
      .filter((w) => w.dateSold && w.priceSold && w.purchasePrice)
      .map((w) => {
        const netProfit = calculateNetProfit(w);
        const holdTime = calculateHoldTime(w.inDate, w.dateSold);
        return { ...w, netProfit, holdTime };
      });
  }, [watches]);

  const metrics = useMemo((): MetricsData => {
    if (soldWatches.length === 0) {
      return { totalProfit: 0, avgHoldTime: 0, totalSold: 0, avgProfit: 0 };
    }

    const totalProfit = soldWatches.reduce((sum, w) => sum + (w.netProfit || 0), 0);
    const totalHoldTime = soldWatches.reduce((sum, w) => sum + (w.holdTime || 0), 0);
    const watchesWithHoldTime = soldWatches.filter((w) => w.holdTime !== undefined).length;

    return {
      totalProfit,
      avgHoldTime: watchesWithHoldTime > 0 ? Math.round(totalHoldTime / watchesWithHoldTime) : 0,
      totalSold: soldWatches.length,
      avgProfit: soldWatches.length > 0 ? totalProfit / soldWatches.length : 0,
    };
  }, [soldWatches]);

  return {
    metrics,
    isLoading,
    error,
    refetch: loadData,
  };
};
