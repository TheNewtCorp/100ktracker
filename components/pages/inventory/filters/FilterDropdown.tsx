import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

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
        className={`flex items-center justify-between w-full px-3 py-2 text-sm bg-charcoal-slate border rounded-lg transition-all duration-200 ${
          hasSelections
            ? 'border-champagne-gold/50 text-champagne-gold'
            : 'border-champagne-gold/20 text-platinum-silver hover:border-champagne-gold/50'
        }`}
      >
        <div className='flex items-center gap-2'>
          <span className='text-xs text-platinum-silver/60 uppercase tracking-wide'>{label}:</span>
          <span className={hasSelections ? 'text-champagne-gold' : 'text-platinum-silver/70'}>{getDisplayText()}</span>
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
            hasSelections ? 'text-champagne-gold/60' : 'text-platinum-silver/60'
          }`}
        />
      </button>

      {isOpen && (
        <div className='absolute top-full left-0 mt-1 w-full bg-obsidian-black border border-champagne-gold/20 rounded-lg shadow-xl z-50 max-h-60 overflow-hidden'>
          {/* Header with controls */}
          <div className='px-3 py-2 border-b border-champagne-gold/10 flex justify-between items-center'>
            <span className='text-xs text-platinum-silver/60 uppercase tracking-wide'>{label}</span>
            <div className='flex gap-2'>
              <button
                onClick={selectAll}
                className='text-xs text-champagne-gold/60 hover:text-champagne-gold transition-colors'
                disabled={selectedValues.length === options.length}
              >
                All
              </button>
              <span className='text-platinum-silver/30'>|</span>
              <button
                onClick={clearAll}
                className='text-xs text-champagne-gold/60 hover:text-champagne-gold transition-colors'
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
                        ? 'bg-champagne-gold/20 text-champagne-gold'
                        : 'text-platinum-silver hover:bg-champagne-gold/10 hover:text-champagne-gold'
                    }`}
                  >
                    <span>{option}</span>
                    {isSelected && <Check size={14} className='text-champagne-gold' />}
                  </button>
                );
              })
            ) : (
              <div className='px-3 py-4 text-center text-sm text-platinum-silver/60'>No options available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
