import { useState, useEffect, useCallback } from 'react';
import { Watch, WatchSet } from '../types';
import apiService from '../services/apiService';

interface UseWatchDataReturn {
  watches: Watch[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Transform API response to match frontend interface
const transformWatchData = (watch: any): Watch => ({
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
});

export const useWatchData = (inventoryUpdateTrigger?: number): UseWatchDataReturn => {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWatches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching watch inventory...');
      const watchesResponse = await apiService.getWatches();
      const transformedWatches = watchesResponse.watches.map(transformWatchData);
      setWatches(transformedWatches);
      console.log('Successfully fetched watches:', transformedWatches.length);
    } catch (err: any) {
      console.error('Failed to fetch watches:', err);
      setError(err.message || 'Failed to load watch data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchWatches();
  }, [fetchWatches]);

  // Reload when inventory changes
  useEffect(() => {
    if (inventoryUpdateTrigger && inventoryUpdateTrigger > 0) {
      console.log('Inventory update trigger received, reloading watch data');
      fetchWatches();
    }
  }, [inventoryUpdateTrigger, fetchWatches]);

  return {
    watches,
    isLoading,
    error,
    refetch: fetchWatches,
  };
};
