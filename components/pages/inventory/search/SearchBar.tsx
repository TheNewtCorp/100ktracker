import React from 'react';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchBarProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  onClearSearch: () => void;
  isSearching: boolean;
  resultsCount: number;
  totalCount: number;
  placeholder?: string;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchText,
  onSearchChange,
  onClearSearch,
  isSearching,
  resultsCount,
  totalCount,
  placeholder = 'Search inventory...',
  className = '',
}) => {
  const hasSearch = searchText.trim().length > 0;
  const showResults = hasSearch && !isSearching;

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className='relative'>
        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
          {isSearching ? (
            <Loader2 size={20} className='text-champagne-gold/60 animate-spin' />
          ) : (
            <Search size={20} className='text-champagne-gold/60' />
          )}
        </div>

        <input
          type='text'
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className='w-full pl-10 pr-10 py-3 bg-charcoal-slate border border-champagne-gold/20 rounded-lg text-platinum-silver placeholder-platinum-silver/50 focus:ring-2 focus:ring-champagne-gold/50 focus:border-champagne-gold/50 transition-all duration-200'
        />

        {hasSearch && (
          <button
            onClick={onClearSearch}
            className='absolute inset-y-0 right-0 pr-3 flex items-center text-champagne-gold/60 hover:text-champagne-gold transition-colors'
            aria-label='Clear search'
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Search Results Indicator */}
      {showResults && (
        <div className='absolute top-full left-0 right-0 mt-1 px-3 py-2 bg-obsidian-black/90 border border-champagne-gold/20 rounded-lg text-sm'>
          <span className='text-platinum-silver/70'>
            {resultsCount === 0 ? (
              'No watches found'
            ) : resultsCount === totalCount ? (
              `Showing all ${totalCount} watches`
            ) : (
              <>
                Showing <span className='text-champagne-gold font-medium'>{resultsCount}</span> of{' '}
                <span className='text-platinum-silver'>{totalCount}</span> watches
              </>
            )}
          </span>
          {resultsCount === 0 && (
            <div className='mt-1 text-xs text-platinum-silver/50'>
              Try searching for brand, model, reference number, or notes
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
