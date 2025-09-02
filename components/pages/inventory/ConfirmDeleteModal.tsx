import React from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { Watch } from '../../../types';

interface ConfirmDeleteModalProps {
  onClose: () => void;
  onConfirm: () => void;
  watch: Watch;
  isDeleting?: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ onClose, onConfirm, watch, isDeleting = false }) => {
  return (
    <motion.div
      className='fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className='bg-charcoal-slate rounded-2xl w-full max-w-md'
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-champagne-gold/10'>
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-full bg-crimson-red/20'>
              <AlertTriangle size={20} className='text-crimson-red' />
            </div>
            <h2 className='text-xl font-bold text-platinum-silver'>Confirm Delete</h2>
          </div>
          <button
            onClick={onClose}
            className='p-1 rounded-full hover:bg-obsidian-black/50 transition-colors'
            disabled={isDeleting}
          >
            <X size={24} className='text-platinum-silver/60' />
          </button>
        </div>

        {/* Content */}
        <div className='p-6'>
          <div className='mb-4'>
            <p className='text-platinum-silver mb-3'>Are you sure you want to delete this watch from your inventory?</p>

            {/* Watch Details */}
            <div className='bg-obsidian-black/30 rounded-lg p-4 border border-champagne-gold/10'>
              <div className='flex items-center gap-2 mb-2'>
                <Trash2 size={16} className='text-crimson-red' />
                <span className='text-champagne-gold font-semibold text-sm'>WATCH TO DELETE</span>
              </div>
              <div className='space-y-1'>
                <p className='text-platinum-silver font-medium'>
                  {watch.brand} {watch.model}
                </p>
                <p className='text-platinum-silver/70 text-sm'>Ref: {watch.referenceNumber}</p>
                {watch.serialNumber && <p className='text-platinum-silver/70 text-sm'>Serial: {watch.serialNumber}</p>}
                {watch.inDate && <p className='text-platinum-silver/70 text-sm'>In Date: {watch.inDate}</p>}
              </div>
            </div>
          </div>

          <div className='bg-crimson-red/10 border border-crimson-red/20 rounded-lg p-3 mb-4'>
            <p className='text-crimson-red text-sm font-medium'>
              ⚠️ This action cannot be undone. All data associated with this watch will be permanently removed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className='p-6 border-t border-champagne-gold/10 flex justify-end items-center gap-3'>
          <button
            type='button'
            onClick={onClose}
            className='py-2 px-4 rounded-lg text-platinum-silver hover:bg-obsidian-black/50 transition-colors'
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className='flex items-center gap-2 py-2 px-4 rounded-lg bg-crimson-red text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isDeleting ? (
              <>
                <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete Watch
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfirmDeleteModal;
