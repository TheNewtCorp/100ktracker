import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../../../../hooks/useTheme';

interface FilterDropdownProps {
  label: string;
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  options,
  selectedValues,
  onSelectionChange,
  placeholder = 'Select...',
  className = '',
}) => {
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

  const toggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onSelectionChange(selectedValues.filter((v) => v !== option));
    } else {
      onSelectionChange([...selectedValues, option]);
    }
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const selectAll = () => {
    onSelectionChange(options);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) return selectedValues[0];
    return `${selectedValues.length} selected`;
  };

  const hasSelections = selectedValues.length > 0;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full px-3 py-2 text-sm border rounded-lg transition-all duration-200 ${
          hasSelections
            ? theme === 'light'
              ? 'border-blue-500 text-blue-600 bg-white'
              : 'border-champagne-gold/50 text-champagne-gold bg-charcoal-slate'
            : theme === 'light'
              ? 'border-gray-300 text-gray-700 hover:border-blue-500 bg-white'
              : 'border-champagne-gold/20 text-platinum-silver hover:border-champagne-gold/50 bg-charcoal-slate'
        }`}
      >
        <div className='flex items-center gap-2'>
          <span
            className={`text-xs uppercase tracking-wide ${
              theme === 'light' ? 'text-gray-500' : 'text-platinum-silver/60'
            }`}
          >
            {label}:
          </span>
          <span
            className={
              hasSelections
                ? theme === 'light'
                  ? 'text-blue-600'
                  : 'text-champagne-gold'
                : theme === 'light'
                  ? 'text-gray-600'
                  : 'text-platinum-silver/70'
            }
          >
            {getDisplayText()}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
            hasSelections
              ? theme === 'light'
                ? 'text-blue-600/60'
                : 'text-champagne-gold/60'
              : theme === 'light'
                ? 'text-gray-500'
                : 'text-platinum-silver/60'
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-1 w-full border rounded-lg shadow-xl z-50 max-h-60 overflow-hidden ${
            theme === 'light' ? 'bg-white border-gray-300' : 'bg-obsidian-black border-champagne-gold/20'
          }`}
        >
          {/* Header with controls */}
          <div
            className={`px-3 py-2 border-b flex justify-between items-center ${
              theme === 'light' ? 'border-gray-200' : 'border-champagne-gold/10'
            }`}
          >
            <span
              className={`text-xs uppercase tracking-wide ${
                theme === 'light' ? 'text-gray-500' : 'text-platinum-silver/60'
              }`}
            >
              {label}
            </span>
            <div className='flex gap-2'>
              <button
                onClick={selectAll}
                className={`text-xs transition-colors ${
                  theme === 'light'
                    ? 'text-blue-600/60 hover:text-blue-600'
                    : 'text-champagne-gold/60 hover:text-champagne-gold'
                }`}
                disabled={selectedValues.length === options.length}
              >
                All
              </button>
              <span className={`${theme === 'light' ? 'text-gray-300' : 'text-platinum-silver/30'}`}>|</span>
              <button
                onClick={clearAll}
                className={`text-xs transition-colors ${
                  theme === 'light'
                    ? 'text-blue-600/60 hover:text-blue-600'
                    : 'text-champagne-gold/60 hover:text-champagne-gold'
                }`}
                disabled={selectedValues.length === 0}
              >
                None
              </button>
            </div>
          </div>

          {/* Options list */}
          <div className='max-h-48 overflow-y-auto'>
            {options.length > 0 ? (
              options.map((option) => {
                const isSelected = selectedValues.includes(option);
                return (
                  <button
                    key={option}
                    onClick={() => toggleOption(option)}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors duration-150 ${
                      isSelected
                        ? theme === 'light'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-champagne-gold/20 text-champagne-gold'
                        : theme === 'light'
                          ? 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                          : 'text-platinum-silver hover:bg-champagne-gold/10 hover:text-champagne-gold'
                    }`}
                  >
                    <span>{option}</span>
                    {isSelected && (
                      <Check size={14} className={`${theme === 'light' ? 'text-blue-600' : 'text-champagne-gold'}`} />
                    )}
                  </button>
                );
              })
            ) : (
              <div
                className={`px-3 py-4 text-center text-sm ${
                  theme === 'light' ? 'text-gray-500' : 'text-platinum-silver/60'
                }`}
              >
                No options available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
