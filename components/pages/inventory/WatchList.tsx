import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Users, Trash2, Square, CheckSquare, Trash, History } from 'lucide-react';
import { Watch } from '../../../types';
import SetBadge from './preview/SetBadge';
import NotesPreview from './preview/NotesPreview';
import { useTheme } from '../../../hooks/useTheme';
import WatchHistoryModal from './WatchHistoryModal';

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
  const { theme } = useTheme();
  const [selectedWatches, setSelectedWatches] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [historyWatch, setHistoryWatch] = useState<Watch | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

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

  const handleShowHistory = (watch: Watch) => {
    setHistoryWatch(watch);
    setIsHistoryModalOpen(true);
  };

  const handleCloseHistory = () => {
    setIsHistoryModalOpen(false);
    setHistoryWatch(null);
  };

  if (watches.length === 0) {
    return (
      <div
        className={`p-8 border-2 border-dashed rounded-lg text-center ${
          theme === 'light' ? 'border-blue-600/20 text-gray-600' : 'border-champagne-gold/20 text-platinum-silver/60'
        }`}
      >
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
    <div
      className={`rounded-xl overflow-hidden border ${
        theme === 'light' ? 'bg-white border-gray-300' : 'bg-charcoal-slate border-champagne-gold/10'
      }`}
    >
      {/* Bulk Actions Bar */}
      {isSelectMode && (
        <div
          className={`px-6 py-4 border-b ${
            theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-obsidian-black/50 border-champagne-gold/10'
          }`}
        >
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <button
                onClick={toggleSelectAll}
                className={`flex items-center gap-2 transition-colors ${
                  theme === 'light'
                    ? 'text-blue-600 hover:text-blue-700'
                    : 'text-champagne-gold hover:text-champagne-gold/80'
                }`}
              >
                {selectedWatches.size === watches.length ? <CheckSquare size={20} /> : <Square size={20} />}
                <span className='text-sm'>
                  {selectedWatches.size === watches.length ? 'Deselect All' : 'Select All'}
                </span>
              </button>
              <span className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-platinum-silver/60'}`}>
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
                className={`text-sm px-3 py-2 rounded-lg transition-colors ${
                  theme === 'light'
                    ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    : 'text-platinum-silver/60 hover:text-platinum-silver hover:bg-charcoal-slate/50'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selection Toggle Button */}
      {!isSelectMode && (
        <div
          className={`px-6 py-3 border-b ${
            theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-obsidian-black/30 border-champagne-gold/10'
          }`}
        >
          <button
            onClick={toggleSelectMode}
            className={`flex items-center gap-2 transition-colors text-sm ${
              theme === 'light'
                ? 'text-blue-600 hover:text-blue-700'
                : 'text-champagne-gold hover:text-champagne-gold/80'
            }`}
          >
            <Square size={16} />
            Select Multiple
          </button>
        </div>
      )}

      <div className='overflow-x-auto'>
        <table
          className={`w-full text-sm text-left ${theme === 'light' ? 'text-gray-800' : 'text-platinum-silver/80'}`}
        >
          <thead
            className={`text-xs uppercase ${
              theme === 'light' ? 'text-blue-600 bg-gray-100' : 'text-champagne-gold bg-obsidian-black/50'
            }`}
          >
            <tr>
              {headers.map((header) => (
                <th key={header} scope='col' className='px-6 py-3 whitespace-nowrap'>
                  {header === 'Select' && isSelectMode ? (
                    <button
                      onClick={toggleSelectAll}
                      className={`flex items-center transition-colors ${
                        theme === 'light'
                          ? 'text-blue-600 hover:text-blue-700'
                          : 'text-champagne-gold hover:text-champagne-gold/80'
                      }`}
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
                className={`border-b transition-colors ${
                  theme === 'light'
                    ? `border-gray-200 hover:bg-gray-50 ${selectedWatches.has(watch.id) ? 'bg-blue-50' : ''}`
                    : `border-champagne-gold/10 hover:bg-obsidian-black/30 ${
                        selectedWatches.has(watch.id) ? 'bg-champagne-gold/10' : ''
                      }`
                }`}
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
              >
                {isSelectMode && (
                  <td className='px-6 py-4'>
                    <button
                      onClick={() => toggleSelectWatch(watch.id)}
                      className={`transition-colors ${
                        theme === 'light'
                          ? 'text-blue-600 hover:text-blue-700'
                          : 'text-champagne-gold hover:text-champagne-gold/80'
                      }`}
                    >
                      {selectedWatches.has(watch.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </td>
                )}
                <td className='px-6 py-4 whitespace-nowrap'>{watch.inDate || '-'}</td>
                <td
                  className={`px-6 py-4 font-semibold whitespace-nowrap ${
                    theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'
                  }`}
                >
                  {watch.brand}
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>{watch.model}</td>
                <td className='px-6 py-4 whitespace-nowrap'>{watch.referenceNumber}</td>
                <td className='px-6 py-4'>
                  <SetBadge watchSet={watch.watchSet} />
                </td>
                <td className='px-6 py-4 max-w-48'>
                  <NotesPreview notes={watch.notes} />
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>{formatCurrency(watch.purchasePrice)}</td>
                <td
                  className={`px-6 py-4 font-medium whitespace-nowrap ${
                    theme === 'light' ? 'text-blue-600' : 'text-champagne-gold'
                  }`}
                >
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
                        className={`p-1.5 rounded-md transition-colors ${
                          theme === 'light'
                            ? 'hover:bg-blue-100 text-blue-600'
                            : 'hover:bg-champagne-gold/20 text-champagne-gold'
                        }`}
                        aria-label='View Associations'
                        title='View Associations'
                      >
                        <Users size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleShowHistory(watch)}
                      className={`p-1.5 rounded-md transition-colors ${
                        theme === 'light'
                          ? 'hover:bg-purple-100 text-purple-600'
                          : 'hover:bg-purple-500/20 text-purple-400'
                      }`}
                      aria-label='Watch History'
                      title='Watch History'
                    >
                      <History size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(watch)}
                      className={`p-1.5 rounded-md transition-colors ${
                        theme === 'light'
                          ? 'hover:bg-blue-100 text-blue-600'
                          : 'hover:bg-champagne-gold/20 text-champagne-gold'
                      }`}
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

      {/* Watch History Modal */}
      {historyWatch && (
        <WatchHistoryModal watch={historyWatch} isOpen={isHistoryModalOpen} onClose={handleCloseHistory} />
      )}
    </div>
  );
};

export default WatchList;
