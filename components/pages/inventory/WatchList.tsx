import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Users, Trash2 } from 'lucide-react';
import { Watch } from '../../../types';

interface WatchListProps {
  watches: (Watch & { totalIn?: number; netProfit?: number; profitPercentage?: number; holdTime?: string })[];
  onEdit: (watch: Watch) => void;
  onShowAssociations: (watch: Watch) => void;
  onDelete: (watch: Watch) => void;
}

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const WatchList: React.FC<WatchListProps> = ({ watches, onEdit, onShowAssociations, onDelete }) => {
  if (watches.length === 0) {
    return (
      <div className='p-8 border-2 border-dashed border-champagne-gold/20 rounded-lg text-center text-platinum-silver/60'>
        You have no watches in your inventory. Click "Add New Watch" to get started.
      </div>
    );
  }

  const headers = [
    'In Date',
    'Brand',
    'Model',
    'Ref #',
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
      <div className='overflow-x-auto'>
        <table className='w-full text-sm text-left text-platinum-silver/80'>
          <thead className='text-xs text-champagne-gold uppercase bg-obsidian-black/50'>
            <tr>
              {headers.map((header) => (
                <th key={header} scope='col' className='px-6 py-3 whitespace-nowrap'>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <motion.tbody variants={{ show: { transition: { staggerChildren: 0.03 } } }} initial='hidden' animate='show'>
            {watches.map((watch) => (
              <motion.tr
                key={watch.id}
                className='border-b border-champagne-gold/10 hover:bg-obsidian-black/30 transition-colors'
                variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
              >
                <td className='px-6 py-4 whitespace-nowrap'>{watch.inDate || '-'}</td>
                <td className='px-6 py-4 font-semibold text-platinum-silver whitespace-nowrap'>{watch.brand}</td>
                <td className='px-6 py-4 whitespace-nowrap'>{watch.model}</td>
                <td className='px-6 py-4 whitespace-nowrap'>{watch.referenceNumber}</td>
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
