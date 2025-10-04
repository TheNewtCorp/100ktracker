import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, RotateCcw, ArrowUpDown } from 'lucide-react';
import { SortOption, SORT_OPTIONS } from '../../../../hooks/useInventorySort';
import { useTheme } from '../../../../hooks/useTheme';

interface SortDropdownProps {
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
  onClearSort: () => void;
  className?: string;
}

const SortDropdown: React.FC<SortDropdownProps> = ({ sortOption, onSortChange, onClearSort, className = '' }) => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSortSelect = (option: SortOption) => {
    onSortChange(option);
    setIsOpen(false);
  };

  const isDefaultSort = sortOption.key === 'default';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className='flex items-center gap-2'>
        {/* Sort Dropdown Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all duration-200 min-w-[200px] justify-between ${
            theme === 'light'
              ? 'bg-white border-gray-300 text-gray-900 hover:border-blue-500'
              : 'bg-charcoal-slate border-champagne-gold/20 text-platinum-silver hover:border-champagne-gold/50'
          }`}
        >
          <div className='flex items-center gap-2'>
            <ArrowUpDown size={16} className={`${theme === 'light' ? 'text-blue-600/60' : 'text-champagne-gold/60'}`} />
            <span className='text-sm'>{isDefaultSort ? 'Sort by...' : sortOption.label}</span>
          </div>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
              theme === 'light' ? 'text-blue-600/60' : 'text-champagne-gold/60'
            }`}
          />
        </button>

        {/* Clear Sort Button */}
        {!isDefaultSort && (
          <button
            onClick={onClearSort}
            className={`p-2 rounded-lg transition-all duration-200 ${
              theme === 'light'
                ? 'text-blue-600/60 hover:text-blue-600 hover:bg-blue-100'
                : 'text-champagne-gold/60 hover:text-champagne-gold hover:bg-champagne-gold/10'
            }`}
            title='Clear sort'
            aria-label='Clear sort'
          >
            <RotateCcw size={16} />
          </button>
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-1 w-full border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto ${
            theme === 'light' ? 'bg-white border-gray-300' : 'bg-obsidian-black border-champagne-gold/20'
          }`}
        >
          <div className='py-2'>
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => handleSortSelect(option)}
                className={`w-full px-4 py-2 text-left text-sm transition-colors duration-150 ${
                  option.key === sortOption.key
                    ? theme === 'light'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-champagne-gold/20 text-champagne-gold'
                    : theme === 'light'
                      ? 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                      : 'text-platinum-silver hover:bg-champagne-gold/10 hover:text-champagne-gold'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <span>{option.label}</span>
                  {option.key === sortOption.key && (
                    <div
                      className={`w-2 h-2 rounded-full ${theme === 'light' ? 'bg-blue-600' : 'bg-champagne-gold'}`}
                    ></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SortDropdown;
