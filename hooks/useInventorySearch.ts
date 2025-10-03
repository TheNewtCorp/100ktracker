import { useState, useEffect, useMemo, useRef } from 'react';
import { Watch } from '../types';

interface UseInventorySearchReturn {
  searchText: string;
  setSearchText: (text: string) => void;
  searchResults: Watch[];
  isSearching: boolean;
  resultsCount: number;
  clearSearch: () => void;
}

// Fields to search across
const SEARCHABLE_FIELDS: Array<keyof Watch> = [
  'brand',
  'model',
  'referenceNumber',
  'serialNumber',
  'notes',
  'accessories',
  'platformPurchased',
  'platformSold',
];

const searchInField = (watch: Watch, field: keyof Watch, searchTerm: string): boolean => {
  const value = watch[field];
  if (!value) return false;

  return String(value).toLowerCase().includes(searchTerm.toLowerCase());
};

const searchWatch = (watch: Watch, searchTerm: string): boolean => {
  if (!searchTerm.trim()) return true;

  return SEARCHABLE_FIELDS.some((field) => searchInField(watch, field, searchTerm));
};

export const useInventorySearch = (watches: Watch[]): UseInventorySearchReturn => {
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSearching(true);

    timeoutRef.current = setTimeout(() => {
      setDebouncedSearchText(searchText);
      setIsSearching(false);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchText]);

  // Filter watches based on search
  const searchResults = useMemo(() => {
    if (!debouncedSearchText.trim()) {
      return watches;
    }

    return watches.filter((watch) => searchWatch(watch, debouncedSearchText));
  }, [watches, debouncedSearchText]);

  const clearSearch = () => {
    setSearchText('');
    setDebouncedSearchText('');
    setIsSearching(false);
  };

  return {
    searchText,
    setSearchText,
    searchResults,
    isSearching,
    resultsCount: searchResults.length,
    clearSearch,
  };
};
