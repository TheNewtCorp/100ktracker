import React from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { WatchSet } from '../../../../types';
import { FilterState, FilterOptions } from '../../../../hooks/useInventoryFilters';
import { useTheme } from '../../../../hooks/useTheme';
import FilterDropdown from './FilterDropdown';
import FilterChips from './FilterChips';

interface FilterBarProps {
  filterState: FilterState;
  filterOptions: FilterOptions;
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onClearAllFilters: () => void;
  onToggleExpansion: () => void;
  activeFiltersCount: number;
  className?: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filterState,
  filterOptions,
  onUpdateFilter,
  onClearAllFilters,
  onToggleExpansion,
  activeFiltersCount,
  className = '',
}) => {
  const { theme } = useTheme();
  const handleRemoveFilter = (filterKey: keyof FilterState, value?: string) => {
    switch (filterKey) {
      case 'brand':
        if (value) {
          onUpdateFilter(
            'brand',
            filterState.brand.filter((b) => b !== value),
          );
        }
        break;
      case 'watchSet':
        if (value) {
          onUpdateFilter(
            'watchSet',
            filterState.watchSet.filter((s) => s !== value),
          );
        }
        break;
      case 'platformPurchased':
        if (value) {
          onUpdateFilter(
            'platformPurchased',
            filterState.platformPurchased.filter((p) => p !== value),
          );
        }
        break;
      case 'platformSold':
        if (value) {
          onUpdateFilter(
            'platformSold',
            filterState.platformSold.filter((p) => p !== value),
          );
        }
        break;
      case 'status':
        onUpdateFilter('status', 'all');
        break;
      case 'dateRange':
        onUpdateFilter('dateRange', {});
        break;
      case 'priceRange':
        onUpdateFilter('priceRange', {});
        break;
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Items' },
    { value: 'available', label: 'Available' },
    { value: 'sold', label: 'Sold' },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filter Toggle Button */}
      <div className='flex items-center justify-between'>
        <button
          onClick={onToggleExpansion}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all duration-200 ${
            theme === 'light'
              ? 'bg-white border-gray-300 text-gray-900 hover:border-blue-500'
              : 'bg-charcoal-slate border-champagne-gold/20 text-platinum-silver hover:border-champagne-gold/50'
          }`}
        >
          <Filter size={16} className={`${theme === 'light' ? 'text-blue-600/60' : 'text-champagne-gold/60'}`} />
          <span className='text-sm'>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
          {filterState.isExpanded ? (
            <ChevronUp size={16} className={`${theme === 'light' ? 'text-blue-600/60' : 'text-champagne-gold/60'}`} />
          ) : (
            <ChevronDown size={16} className={`${theme === 'light' ? 'text-blue-600/60' : 'text-champagne-gold/60'}`} />
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={onClearAllFilters}
            className='text-sm text-crimson-red hover:text-red-400 px-3 py-2 rounded transition-colors'
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Expanded Filter Controls */}
      {filterState.isExpanded && (
        <div
          className={`space-y-4 p-4 rounded-lg border ${
            theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-obsidian-black/30 border-champagne-gold/10'
          }`}
        >
          {/* Primary Filters Row */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
            <FilterDropdown
              label='Brand'
              options={filterOptions.brands}
              selectedValues={filterState.brand}
              onSelectionChange={(values) => onUpdateFilter('brand', values)}
              placeholder='Any brand'
            />

            <FilterDropdown
              label='Set'
              options={filterOptions.watchSets}
              selectedValues={filterState.watchSet}
              onSelectionChange={(values) => onUpdateFilter('watchSet', values as WatchSet[])}
              placeholder='Any set'
            />

            <FilterDropdown
              label='Platform Purchased'
              options={filterOptions.platformsPurchased}
              selectedValues={filterState.platformPurchased}
              onSelectionChange={(values) => onUpdateFilter('platformPurchased', values)}
              placeholder='Any platform'
            />

            <div className='relative'>
              <select
                value={filterState.status}
                onChange={(e) => onUpdateFilter('status', e.target.value as 'all' | 'available' | 'sold')}
                className={`w-full px-3 py-2 text-sm border rounded-lg transition-all duration-200 ${
                  theme === 'light'
                    ? 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                    : 'bg-charcoal-slate border-champagne-gold/20 text-platinum-silver focus:border-champagne-gold/50 focus:ring-2 focus:ring-champagne-gold/20'
                }`}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Secondary Filters Row (if needed) */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <FilterDropdown
              label='Platform Sold'
              options={filterOptions.platformsSold}
              selectedValues={filterState.platformSold}
              onSelectionChange={(values) => onUpdateFilter('platformSold', values)}
              placeholder='Any platform'
            />

            {/* Placeholder for future advanced filters */}
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {activeFiltersCount > 0 && (
        <FilterChips filterState={filterState} onRemoveFilter={handleRemoveFilter} onClearAll={onClearAllFilters} />
      )}
    </div>
  );
};

export default FilterBar;
