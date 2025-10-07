import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Edit, Plus, Trash } from 'lucide-react';
import { Watch } from '../../../types';
import { useTheme } from '../../../hooks/useTheme';
import { apiService } from '../../../services/apiService';

interface WatchHistoryEntry {
  id: number;
  watch_id: number;
  user_id: number;
  change_type: 'created' | 'updated' | 'deleted';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  timestamp: string;
}

interface WatchHistoryModalProps {
  watch: Watch;
  isOpen: boolean;
  onClose: () => void;
}

const formatFieldName = (fieldName: string): string => {
  const fieldNameMap: { [key: string]: string } = {
    brand: 'Brand',
    model: 'Model',
    reference_number: 'Reference Number',
    in_date: 'In Date',
    serial_number: 'Serial Number',
    watch_set: 'Watch Set',
    platform_purchased: 'Platform Purchased',
    purchase_price: 'Purchase Price',
    liquidation_price: 'Liquidation Price',
    accessories: 'Accessories',
    accessories_cost: 'Accessories Cost',
    date_sold: 'Date Sold',
    platform_sold: 'Platform Sold',
    price_sold: 'Price Sold',
    fees: 'Fees',
    shipping: 'Shipping',
    taxes: 'Taxes',
    notes: 'Notes',
    buyer_contact_id: 'Buyer Contact',
    seller_contact_id: 'Seller Contact',
  };

  return fieldNameMap[fieldName] || fieldName;
};

const formatValue = (value: string | null, fieldName?: string): string => {
  if (value === null || value === undefined || value === '') return 'None';

  // Format currency fields
  if (
    fieldName &&
    ['purchase_price', 'liquidation_price', 'accessories_cost', 'price_sold', 'fees', 'shipping', 'taxes'].includes(
      fieldName,
    )
  ) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
    }
  }

  return value;
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const getChangeIcon = (changeType: string) => {
  switch (changeType) {
    case 'created':
      return <Plus size={16} className='text-money-green' />;
    case 'updated':
      return <Edit size={16} className='text-blue-500' />;
    case 'deleted':
      return <Trash size={16} className='text-crimson-red' />;
    default:
      return <Clock size={16} className='text-gray-500' />;
  }
};

const getChangeDescription = (entry: WatchHistoryEntry): string => {
  switch (entry.change_type) {
    case 'created':
      return 'Watch was created';
    case 'deleted':
      return 'Watch was deleted';
    case 'updated':
      if (entry.field_name) {
        const fieldDisplay = formatFieldName(entry.field_name);
        const oldVal = formatValue(entry.old_value, entry.field_name);
        const newVal = formatValue(entry.new_value, entry.field_name);
        return `${fieldDisplay} changed from "${oldVal}" to "${newVal}"`;
      }
      return 'Watch was updated';
    default:
      return 'Unknown change';
  }
};

const WatchHistoryModal: React.FC<WatchHistoryModalProps> = ({ watch, isOpen, onClose }) => {
  const { theme } = useTheme();
  const [history, setHistory] = useState<WatchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && watch.id) {
      fetchWatchHistory();
    }
  }, [isOpen, watch.id]);

  const fetchWatchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.get(`/watches/${watch.id}/history`);
      setHistory(response.history || []);
    } catch (err) {
      console.error('Failed to fetch watch history:', err);
      setError('Failed to load watch history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-2xl mx-4 rounded-xl shadow-2xl max-h-[90vh] overflow-hidden ${
              theme === 'light' ? 'bg-white' : 'bg-charcoal-slate border border-champagne-gold/20'
            }`}
          >
            {/* Header */}
            <div
              className={`px-6 py-4 border-b ${
                theme === 'light' ? 'border-gray-200 bg-gray-50' : 'border-champagne-gold/20 bg-obsidian-black/50'
              }`}
            >
              <div className='flex items-center justify-between'>
                <div>
                  <h2
                    className={`text-lg font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}
                  >
                    Watch History
                  </h2>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-platinum-silver/60'}`}>
                    {watch.brand} {watch.model} - {watch.referenceNumber}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors ${
                    theme === 'light'
                      ? 'hover:bg-gray-100 text-gray-500'
                      : 'hover:bg-charcoal-slate text-platinum-silver/60'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className='px-6 py-4 overflow-y-auto max-h-[calc(90vh-120px)]'>
              {loading && (
                <div className='flex justify-center py-8'>
                  <div
                    className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                      theme === 'light' ? 'border-blue-600' : 'border-champagne-gold'
                    }`}
                  />
                </div>
              )}

              {error && (
                <div
                  className={`p-4 rounded-lg text-center ${
                    theme === 'light' ? 'bg-red-50 text-red-600' : 'bg-crimson-red/20 text-crimson-red'
                  }`}
                >
                  {error}
                </div>
              )}

              {!loading && !error && history.length === 0 && (
                <div className={`text-center py-8 ${theme === 'light' ? 'text-gray-500' : 'text-platinum-silver/60'}`}>
                  No history found for this watch.
                </div>
              )}

              {!loading && !error && history.length > 0 && (
                <div className='space-y-4'>
                  {history.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex gap-4 p-4 rounded-lg border ${
                        theme === 'light'
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-obsidian-black/30 border-champagne-gold/10'
                      }`}
                    >
                      {/* Icon */}
                      <div className='flex-shrink-0 mt-1'>{getChangeIcon(entry.change_type)}</div>

                      {/* Content */}
                      <div className='flex-1 min-w-0'>
                        <p
                          className={`text-sm font-medium ${
                            theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'
                          }`}
                        >
                          {getChangeDescription(entry)}
                        </p>
                        <p
                          className={`text-xs mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-platinum-silver/60'}`}
                        >
                          {formatTimestamp(entry.timestamp)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WatchHistoryModal;
