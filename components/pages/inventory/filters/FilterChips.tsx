import React from 'react';
import { X } from 'lucide-react';
import { FilterState } from '../../../../hooks/useInventoryFilters';

interface FilterChip {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

interface FilterChipsProps {
  filterState: FilterState;
  onRemoveFilter: (filterKey: keyof FilterState, value?: string) => void;
  onClearAll: () => void;
  className?: string;
}

const FilterChips: React.FC<FilterChipsProps> = ({ filterState, onRemoveFilter, onClearAll, className = '' }) => {
  const chips: FilterChip[] = [];

  // Brand chips
  filterState.brand.forEach((brand) => {
    chips.push({
      key: `brand-${brand}`,
      label: 'Brand',
      value: brand,
      onRemove: () => onRemoveFilter('brand', brand),
    });
  });

  // Watch set chips
  filterState.watchSet.forEach((set) => {
    chips.push({
      key: `set-${set}`,
      label: 'Set',
      value: set,
      onRemove: () => onRemoveFilter('watchSet', set),
    });
  });

  // Platform purchased chips
  filterState.platformPurchased.forEach((platform) => {
    chips.push({
      key: `platform-purchased-${platform}`,
      label: 'Purchased',
      value: platform,
      onRemove: () => onRemoveFilter('platformPurchased', platform),
    });
  });

  // Platform sold chips
  filterState.platformSold.forEach((platform) => {
    chips.push({
      key: `platform-sold-${platform}`,
      label: 'Sold',
      value: platform,
      onRemove: () => onRemoveFilter('platformSold', platform),
    });
  });

  // Status chip
  if (filterState.status !== 'all') {
    chips.push({
      key: 'status',
      label: 'Status',
      value: filterState.status === 'sold' ? 'Sold' : 'Available',
      onRemove: () => onRemoveFilter('status'),
    });
  }

  // Date range chips
  if (filterState.dateRange.inDateFrom || filterState.dateRange.inDateTo) {
    const fromDate = filterState.dateRange.inDateFrom || '...';
    const toDate = filterState.dateRange.inDateTo || '...';
    chips.push({
      key: 'in-date-range',
      label: 'In Date',
      value: `${fromDate} to ${toDate}`,
      onRemove: () => onRemoveFilter('dateRange'),
    });
  }

  if (filterState.dateRange.soldDateFrom || filterState.dateRange.soldDateTo) {
    const fromDate = filterState.dateRange.soldDateFrom || '...';
    const toDate = filterState.dateRange.soldDateTo || '...';
    chips.push({
      key: 'sold-date-range',
      label: 'Sold Date',
      value: `${fromDate} to ${toDate}`,
      onRemove: () => onRemoveFilter('dateRange'),
    });
  }

  // Price range chips
  if (filterState.priceRange.purchaseMin !== undefined || filterState.priceRange.purchaseMax !== undefined) {
    const min = filterState.priceRange.purchaseMin !== undefined ? `$${filterState.priceRange.purchaseMin}` : '$0';
    const max = filterState.priceRange.purchaseMax !== undefined ? `$${filterState.priceRange.purchaseMax}` : '$∞';
    chips.push({
      key: 'purchase-price-range',
      label: 'Purchase Price',
      value: `${min} - ${max}`,
      onRemove: () => onRemoveFilter('priceRange'),
    });
  }

  if (filterState.priceRange.profitMin !== undefined || filterState.priceRange.profitMax !== undefined) {
    const min = filterState.priceRange.profitMin !== undefined ? `$${filterState.priceRange.profitMin}` : '$-∞';
    const max = filterState.priceRange.profitMax !== undefined ? `$${filterState.priceRange.profitMax}` : '$∞';
    chips.push({
      key: 'profit-range',
      label: 'Profit',
      value: `${min} - ${max}`,
      onRemove: () => onRemoveFilter('priceRange'),
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className='text-xs text-platinum-silver/60 uppercase tracking-wide'>Active Filters:</span>

      {chips.map((chip) => (
        <div
          key={chip.key}
          className='inline-flex items-center gap-1 px-2 py-1 bg-champagne-gold/20 text-champagne-gold text-xs rounded-full border border-champagne-gold/30'
        >
          <span className='font-medium'>{chip.label}:</span>
          <span>{chip.value}</span>
          <button
            onClick={chip.onRemove}
            className='ml-1 hover:bg-champagne-gold/30 rounded-full p-0.5 transition-colors'
            aria-label={`Remove ${chip.label} filter`}
          >
            <X size={10} />
          </button>
        </div>
      ))}

      {chips.length > 1 && (
        <button
          onClick={onClearAll}
          className='text-xs text-crimson-red hover:text-red-400 px-2 py-1 rounded transition-colors'
        >
          Clear All
        </button>
      )}
    </div>
  );
};

export default FilterChips;
