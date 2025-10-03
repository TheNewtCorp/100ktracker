import { useState, useMemo, useEffect } from 'react';
import { Watch, WatchSet } from '../types';

export interface SortOption {
  key: string;
  label: string;
  field: keyof Watch | 'computed';
  direction: 'asc' | 'desc';
  type: 'string' | 'number' | 'date' | 'boolean';
}

export const SORT_OPTIONS: SortOption[] = [
  { key: 'default', label: 'Default Order', field: 'computed', direction: 'asc', type: 'string' },
  { key: 'brand-asc', label: 'Brand (A-Z)', field: 'brand', direction: 'asc', type: 'string' },
  { key: 'brand-desc', label: 'Brand (Z-A)', field: 'brand', direction: 'desc', type: 'string' },
  { key: 'model-asc', label: 'Model (A-Z)', field: 'model', direction: 'asc', type: 'string' },
  { key: 'model-desc', label: 'Model (Z-A)', field: 'model', direction: 'desc', type: 'string' },
  { key: 'ref-asc', label: 'Reference # (A-Z)', field: 'referenceNumber', direction: 'asc', type: 'string' },
  { key: 'ref-desc', label: 'Reference # (Z-A)', field: 'referenceNumber', direction: 'desc', type: 'string' },
  { key: 'set-asc', label: 'Set (Watch Only → Full Set)', field: 'watchSet', direction: 'asc', type: 'string' },
  { key: 'set-desc', label: 'Set (Full Set → Watch Only)', field: 'watchSet', direction: 'desc', type: 'string' },
  { key: 'sold-first', label: 'Sold Items First', field: 'computed', direction: 'desc', type: 'boolean' },
  { key: 'available-first', label: 'Available Items First', field: 'computed', direction: 'asc', type: 'boolean' },
  { key: 'date-newest', label: 'Newest First (In Date)', field: 'inDate', direction: 'desc', type: 'date' },
  { key: 'date-oldest', label: 'Oldest First (In Date)', field: 'inDate', direction: 'asc', type: 'date' },
  { key: 'profit-highest', label: 'Highest Profit First', field: 'computed', direction: 'desc', type: 'number' },
  { key: 'profit-lowest', label: 'Lowest Profit First', field: 'computed', direction: 'asc', type: 'number' },
  { key: 'price-highest', label: 'Highest Price First', field: 'purchasePrice', direction: 'desc', type: 'number' },
  { key: 'price-lowest', label: 'Lowest Price First', field: 'purchasePrice', direction: 'asc', type: 'number' },
];

interface UseInventorySortReturn {
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  sortedWatches: Watch[];
  clearSort: () => void;
}

// Helper function to get the sort value for computed fields
const getComputedSortValue = (watch: any, option: SortOption) => {
  switch (option.key) {
    case 'sold-first':
    case 'available-first':
      return watch.dateSold ? 1 : 0;
    case 'profit-highest':
    case 'profit-lowest':
      return watch.netProfit || 0;
    default:
      return 0;
  }
};

// Helper function to get the sort value for watchSet
const getWatchSetSortValue = (watchSet?: WatchSet): number => {
  if (!watchSet) return 0;
  switch (watchSet) {
    case WatchSet.WatchOnly:
      return 1;
    case WatchSet.WatchAndBox:
      return 2;
    case WatchSet.WatchAndPapers:
      return 3;
    case WatchSet.FullSet:
      return 4;
    default:
      return 0;
  }
};

// Generic comparison function
const compareValues = (a: any, b: any, option: SortOption): number => {
  // Handle computed fields
  if (option.field === 'computed') {
    const aVal = getComputedSortValue(a, option);
    const bVal = getComputedSortValue(b, option);
    return option.direction === 'asc' ? aVal - bVal : bVal - aVal;
  }

  // Handle watchSet specially
  if (option.field === 'watchSet') {
    const aVal = getWatchSetSortValue(a[option.field]);
    const bVal = getWatchSetSortValue(b[option.field]);
    return option.direction === 'asc' ? aVal - bVal : bVal - aVal;
  }

  // Get field values
  const aVal = a[option.field];
  const bVal = b[option.field];

  // Handle null/undefined values (always sort to end)
  if (aVal == null && bVal == null) return 0;
  if (aVal == null) return 1;
  if (bVal == null) return -1;

  let comparison = 0;

  switch (option.type) {
    case 'string':
      comparison = String(aVal).localeCompare(String(bVal));
      break;
    case 'number':
      comparison = Number(aVal) - Number(bVal);
      break;
    case 'date':
      comparison = new Date(aVal).getTime() - new Date(bVal).getTime();
      break;
    case 'boolean':
      comparison = (aVal ? 1 : 0) - (bVal ? 1 : 0);
      break;
    default:
      comparison = String(aVal).localeCompare(String(bVal));
  }

  return option.direction === 'asc' ? comparison : -comparison;
};

export const useInventorySort = (watches: Watch[]): UseInventorySortReturn => {
  const [sortOption, setSortOption] = useState<SortOption>(SORT_OPTIONS[0]); // Default order

  // Load sort preference from localStorage on mount
  useEffect(() => {
    const savedSort = localStorage.getItem('inventory-sort-preference');
    if (savedSort) {
      try {
        const parsed = JSON.parse(savedSort);
        const foundOption = SORT_OPTIONS.find((opt) => opt.key === parsed.key);
        if (foundOption) {
          setSortOption(foundOption);
        }
      } catch (error) {
        console.warn('Failed to parse saved sort preference:', error);
      }
    }
  }, []);

  // Save sort preference to localStorage when it changes
  useEffect(() => {
    if (sortOption.key !== 'default') {
      localStorage.setItem('inventory-sort-preference', JSON.stringify({ key: sortOption.key }));
    } else {
      localStorage.removeItem('inventory-sort-preference');
    }
  }, [sortOption]);

  // Sort watches based on current option
  const sortedWatches = useMemo(() => {
    if (sortOption.key === 'default') {
      return [...watches]; // Return original order
    }

    return [...watches].sort((a, b) => compareValues(a, b, sortOption));
  }, [watches, sortOption]);

  const clearSort = () => {
    setSortOption(SORT_OPTIONS[0]); // Reset to default
  };

  return {
    sortOption,
    setSortOption,
    sortedWatches,
    clearSort,
  };
};
