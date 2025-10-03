import { useState, useMemo, useEffect } from 'react';
import { Watch, WatchSet } from '../types';

export interface FilterState {
  brand: string[];
  watchSet: WatchSet[];
  platformPurchased: string[];
  platformSold: string[];
  status: 'all' | 'available' | 'sold';
  dateRange: {
    inDateFrom?: string;
    inDateTo?: string;
    soldDateFrom?: string;
    soldDateTo?: string;
  };
  priceRange: {
    purchaseMin?: number;
    purchaseMax?: number;
    profitMin?: number;
    profitMax?: number;
  };
  isActive: boolean;
  isExpanded: boolean;
}

export interface FilterOptions {
  brands: string[];
  watchSets: WatchSet[];
  platformsPurchased: string[];
  platformsSold: string[];
}

interface UseInventoryFiltersReturn {
  filterState: FilterState;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  filteredWatches: Watch[];
  filterOptions: FilterOptions;
  activeFiltersCount: number;
  clearAllFilters: () => void;
  toggleFilterExpansion: () => void;
}

const initialFilterState: FilterState = {
  brand: [],
  watchSet: [],
  platformPurchased: [],
  platformSold: [],
  status: 'all',
  dateRange: {},
  priceRange: {},
  isActive: false,
  isExpanded: false,
};

const applyFilters = (watches: Watch[], filters: FilterState): Watch[] => {
  return watches.filter((watch) => {
    // Brand filter
    if (filters.brand.length > 0 && !filters.brand.includes(watch.brand)) {
      return false;
    }

    // Watch set filter
    if (filters.watchSet.length > 0 && (!watch.watchSet || !filters.watchSet.includes(watch.watchSet))) {
      return false;
    }

    // Platform purchased filter
    if (
      filters.platformPurchased.length > 0 &&
      (!watch.platformPurchased || !filters.platformPurchased.includes(watch.platformPurchased))
    ) {
      return false;
    }

    // Platform sold filter
    if (
      filters.platformSold.length > 0 &&
      (!watch.platformSold || !filters.platformSold.includes(watch.platformSold))
    ) {
      return false;
    }

    // Status filter
    if (filters.status === 'sold' && !watch.dateSold) {
      return false;
    }
    if (filters.status === 'available' && watch.dateSold) {
      return false;
    }

    // Date range filters
    if (filters.dateRange.inDateFrom && watch.inDate && watch.inDate < filters.dateRange.inDateFrom) {
      return false;
    }
    if (filters.dateRange.inDateTo && watch.inDate && watch.inDate > filters.dateRange.inDateTo) {
      return false;
    }
    if (filters.dateRange.soldDateFrom && watch.dateSold && watch.dateSold < filters.dateRange.soldDateFrom) {
      return false;
    }
    if (filters.dateRange.soldDateTo && watch.dateSold && watch.dateSold > filters.dateRange.soldDateTo) {
      return false;
    }

    // Price range filters
    if (
      filters.priceRange.purchaseMin !== undefined &&
      (!watch.purchasePrice || watch.purchasePrice < filters.priceRange.purchaseMin)
    ) {
      return false;
    }
    if (
      filters.priceRange.purchaseMax !== undefined &&
      (!watch.purchasePrice || watch.purchasePrice > filters.priceRange.purchaseMax)
    ) {
      return false;
    }

    // Profit range filters (for sold watches only)
    const watchProfit =
      watch.dateSold && watch.priceSold && watch.purchasePrice
        ? watch.priceSold -
          (watch.purchasePrice + (watch.accessoriesCost || 0)) -
          (watch.fees || 0) -
          (watch.shipping || 0) -
          (watch.taxes || 0)
        : undefined;

    if (
      filters.priceRange.profitMin !== undefined &&
      (watchProfit === undefined || watchProfit < filters.priceRange.profitMin)
    ) {
      return false;
    }
    if (
      filters.priceRange.profitMax !== undefined &&
      (watchProfit === undefined || watchProfit > filters.priceRange.profitMax)
    ) {
      return false;
    }

    return true;
  });
};

const getFilterOptions = (watches: Watch[]): FilterOptions => {
  const brands = [...new Set(watches.map((w) => w.brand))].sort();

  // Always provide all watch set options, not just the ones that exist in inventory
  const watchSets = [WatchSet.WatchOnly, WatchSet.WatchAndBox, WatchSet.WatchAndPapers, WatchSet.FullSet];

  const platformsPurchased = [...new Set(watches.map((w) => w.platformPurchased).filter(Boolean))].sort();
  const platformsSold = [...new Set(watches.map((w) => w.platformSold).filter(Boolean))].sort();

  return {
    brands,
    watchSets,
    platformsPurchased,
    platformsSold,
  };
};

const countActiveFilters = (filters: FilterState): number => {
  let count = 0;

  if (filters.brand.length > 0) count++;
  if (filters.watchSet.length > 0) count++;
  if (filters.platformPurchased.length > 0) count++;
  if (filters.platformSold.length > 0) count++;
  if (filters.status !== 'all') count++;

  if (
    filters.dateRange.inDateFrom ||
    filters.dateRange.inDateTo ||
    filters.dateRange.soldDateFrom ||
    filters.dateRange.soldDateTo
  )
    count++;

  if (
    filters.priceRange.purchaseMin !== undefined ||
    filters.priceRange.purchaseMax !== undefined ||
    filters.priceRange.profitMin !== undefined ||
    filters.priceRange.profitMax !== undefined
  )
    count++;

  return count;
};

export const useInventoryFilters = (watches: Watch[]): UseInventoryFiltersReturn => {
  const [filterState, setFilterState] = useState<FilterState>(initialFilterState);

  // Update active status based on filter count
  useEffect(() => {
    const activeCount = countActiveFilters(filterState);
    setFilterState((prev) => ({ ...prev, isActive: activeCount > 0 }));
  }, [
    filterState.brand,
    filterState.watchSet,
    filterState.platformPurchased,
    filterState.platformSold,
    filterState.status,
    filterState.dateRange,
    filterState.priceRange,
  ]);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilterState((prev) => ({ ...prev, [key]: value }));
  };

  const filteredWatches = useMemo(() => {
    return applyFilters(watches, filterState);
  }, [watches, filterState]);

  const filterOptions = useMemo(() => {
    return getFilterOptions(watches);
  }, [watches]);

  const activeFiltersCount = useMemo(() => {
    return countActiveFilters(filterState);
  }, [filterState]);

  const clearAllFilters = () => {
    setFilterState(initialFilterState);
  };

  const toggleFilterExpansion = () => {
    setFilterState((prev) => ({ ...prev, isExpanded: !prev.isExpanded }));
  };

  return {
    filterState,
    updateFilter,
    filteredWatches,
    filterOptions,
    activeFiltersCount,
    clearAllFilters,
    toggleFilterExpansion,
  };
};
