import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Watch } from '../../../types';

interface BulkDeleteModalProps {
  watches: Watch[];
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const BulkDeleteModal: React.FC<BulkDeleteModalProps> = ({ watches, onClose, onConfirm, isDeleting }) => {
  const watchCount = watches.length;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className='bg-charcoal-slate border border-champagne-gold/20 rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto'
      >
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-crimson-red/20 rounded-lg'>
              <AlertTriangle size={24} className='text-crimson-red' />
            </div>
            <h3 className='text-xl font-semibold text-platinum-silver'>Confirm Bulk Delete</h3>
          </div>
          <button
            onClick={onClose}
            className='text-platinum-silver/60 hover:text-platinum-silver transition-colors'
            disabled={isDeleting}
          >
            <X size={24} />
          </button>
        </div>

        <div className='mb-6'>
          <p className='text-platinum-silver/80 mb-4'>
            Are you sure you want to delete <strong className='text-crimson-red'>{watchCount}</strong> watch
            {watchCount > 1 ? 'es' : ''}? This action cannot be undone.
          </p>

          {/* List of watches to be deleted */}
          <div className='bg-obsidian-black/50 rounded-lg p-4 max-h-48 overflow-y-auto'>
            <h4 className='text-sm font-medium text-champagne-gold mb-2'>Watches to be deleted:</h4>
            <div className='space-y-1'>
              {watches.map((watch) => (
                <div key={watch.id} className='text-sm text-platinum-silver/70 flex items-center gap-2'>
                  <span className='w-2 h-2 bg-crimson-red rounded-full flex-shrink-0'></span>
                  <span className='truncate'>
                    {watch.brand} {watch.model} {watch.referenceNumber ? `(${watch.referenceNumber})` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className='flex gap-3 justify-end'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-platinum-silver/80 hover:text-platinum-silver border border-platinum-silver/20 hover:border-platinum-silver/40 rounded-lg transition-all duration-300'
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className='px-4 py-2 bg-crimson-red hover:bg-red-700 text-white rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
            disabled={isDeleting}
          >
            {isDeleting && (
              <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
            )}
            {isDeleting ? 'Deleting...' : `Delete ${watchCount} Watch${watchCount > 1 ? 'es' : ''}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BulkDeleteModal;
