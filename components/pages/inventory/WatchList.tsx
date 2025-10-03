import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Users, Trash2, Square, CheckSquare, Trash } from 'lucide-react';
import { Watch } from '../../../types';
import SetBadge from './preview/SetBadge';
import NotesPreview from './preview/NotesPreview';

interface WatchListProps {
  watches: (Watch & { totalIn?: number; netProfit?: number; profitPercentage?: number; holdTime?: string })[];
  onEdit: (watch: Watch) => void;
  onShowAssociations: (watch: Watch) => void;
  onDelete: (watch: Watch) => void;
  onBulkDelete: (watchIds: string[]) => void;
}

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const WatchList: React.FC<WatchListProps> = ({ watches, onEdit, onShowAssociations, onDelete, onBulkDelete }) => {
  const [selectedWatches, setSelectedWatches] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Reset selection when watches change
  useEffect(() => {
    setSelectedWatches(new Set());
  }, [watches]);

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedWatches(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedWatches.size === watches.length) {
      setSelectedWatches(new Set());
    } else {
      setSelectedWatches(new Set(watches.map((w) => w.id)));
    }
  };

  const toggleSelectWatch = (watchId: string) => {
    const newSelected = new Set(selectedWatches);
    if (newSelected.has(watchId)) {
      newSelected.delete(watchId);
    } else {
      newSelected.add(watchId);
    }
    setSelectedWatches(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedWatches.size > 0) {
      onBulkDelete(Array.from(selectedWatches));
      setSelectedWatches(new Set());
      setIsSelectMode(false);
    }
  };

  if (watches.length === 0) {
    return (
      <div className='p-8 border-2 border-dashed border-champagne-gold/20 rounded-lg text-center text-platinum-silver/60'>
        You have no watches in your inventory. Click "Add New Watch" to get started.
      </div>
    );
  }

  const headers = [
    ...(isSelectMode ? ['Select'] : []),
    'In Date',
    'Brand',
    'Model',
    'Ref #',
    'Set',
    'Notes',
    'Purchase Price',
    'Total In',
    'Date Sold',
    'Price Sold',
    'Net Profit',
    'Profit (%)',
    'Hold Time',
    'Actions',
  ];

  return (
    <div className='bg-charcoal-slate rounded-xl overflow-hidden border border-champagne-gold/10'>
      {/* Bulk Actions Bar */}
      {isSelectMode && (
        <div className='bg-obsidian-black/50 px-6 py-4 border-b border-champagne-gold/10'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <button
                onClick={toggleSelectAll}
                className='flex items-center gap-2 text-champagne-gold hover:text-champagne-gold/80 transition-colors'
              >
                {selectedWatches.size === watches.length ? <CheckSquare size={20} /> : <Square size={20} />}
                <span className='text-sm'>
                  {selectedWatches.size === watches.length ? 'Deselect All' : 'Select All'}
                </span>
              </button>
              <span className='text-platinum-silver/60 text-sm'>
                {selectedWatches.size} of {watches.length} selected
              </span>
            </div>
            <div className='flex items-center gap-3'>
              {selectedWatches.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className='flex items-center gap-2 bg-crimson-red hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors'
                >
                  <Trash size={16} />
                  Delete Selected ({selectedWatches.size})
                </button>
              )}
              <button
                onClick={toggleSelectMode}
                className='text-platinum-silver/60 hover:text-platinum-silver text-sm px-3 py-2 rounded-lg hover:bg-charcoal-slate/50 transition-colors'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Toggle Button */}
      {!isSelectMode && (
        <div className='bg-obsidian-black/30 px-6 py-3 border-b border-champagne-gold/10'>
          <button
            onClick={toggleSelectMode}
            className='flex items-center gap-2 text-champagne-gold hover:text-champagne-gold/80 transition-colors text-sm'
          >
            <Square size={16} />
            Select Multiple
          </button>
        </div>
      )}

      <div className='overflow-x-auto'>
        <table className='w-full text-sm text-left text-platinum-silver/80'>
          <thead className='text-xs text-champagne-gold uppercase bg-obsidian-black/50'>
            <tr>
              {headers.map((header) => (
                <th key={header} scope='col' className='px-6 py-3 whitespace-nowrap'>
                  {header === 'Select' && isSelectMode ? (
                    <button
                      onClick={toggleSelectAll}
                      className='flex items-center text-champagne-gold hover:text-champagne-gold/80'
                    >
                      {selectedWatches.size === watches.length ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  ) : (
                    header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <motion.tbody variants={{ show: { transition: { staggerChildren: 0.03 } } }} initial='hidden' animate='show'>
            {watches.map((watch) => (
              <motion.tr
                key={watch.id}
                className={`border-b border-champagne-gold/10 hover:bg-obsidian-black/30 transition-colors ${
                  selectedWatches.has(watch.id) ? 'bg-champagne-gold/10' : ''
                }`}
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
              >
                {isSelectMode && (
                  <td className='px-6 py-4'>
                    <button
                      onClick={() => toggleSelectWatch(watch.id)}
                      className='text-champagne-gold hover:text-champagne-gold/80 transition-colors'
                    >
                      {selectedWatches.has(watch.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </td>
                )}
                <td className='px-6 py-4 whitespace-nowrap'>{watch.inDate || '-'}</td>
                <td className='px-6 py-4 font-semibold text-platinum-silver whitespace-nowrap'>{watch.brand}</td>
                <td className='px-6 py-4 whitespace-nowrap'>{watch.model}</td>
                <td className='px-6 py-4 whitespace-nowrap'>{watch.referenceNumber}</td>
                <td className='px-6 py-4'>
                  <SetBadge watchSet={watch.watchSet} />
                </td>
                <td className='px-6 py-4 max-w-48'>
                  <NotesPreview notes={watch.notes} />
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>{formatCurrency(watch.purchasePrice)}</td>
                <td className='px-6 py-4 font-medium text-champagne-gold whitespace-nowrap'>
                  {formatCurrency(watch.totalIn)}
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>{watch.dateSold || '-'}</td>
                <td className='px-6 py-4 whitespace-nowrap'>{formatCurrency(watch.priceSold)}</td>
                <td
                  className={`px-6 py-4 font-medium whitespace-nowrap ${watch.netProfit !== undefined ? (watch.netProfit > 0 ? 'text-money-green' : 'text-crimson-red') : ''}`}
                >
                  {watch.netProfit !== undefined ? formatCurrency(watch.netProfit) : '-'}
                </td>
                <td
                  className={`px-6 py-4 font-medium whitespace-nowrap ${watch.profitPercentage !== undefined ? (watch.profitPercentage > 0 ? 'text-money-green' : 'text-crimson-red') : ''}`}
                >
                  {watch.profitPercentage !== undefined ? `${watch.profitPercentage.toFixed(2)}%` : '-'}
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>{watch.holdTime || '-'}</td>
                <td className='px-6 py-4'>
                  <div className='flex items-center gap-1'>
                    {(watch.buyerContactId || watch.sellerContactId) && (
                      <button
                        onClick={() => onShowAssociations(watch)}
                        className='p-1.5 rounded-md hover:bg-champagne-gold/20 text-champagne-gold transition-colors'
                        aria-label='View Associations'
                        title='View Associations'
                      >
                        <Users size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(watch)}
                      className='p-1.5 rounded-md hover:bg-champagne-gold/20 text-champagne-gold transition-colors'
                      aria-label='Edit Watch'
                      title='Edit Watch'
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(watch)}
                      className='p-1.5 rounded-md hover:bg-crimson-red/20 text-crimson-red transition-colors'
                      aria-label='Delete Watch'
                      title='Delete Watch'
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
};

export default WatchList;
