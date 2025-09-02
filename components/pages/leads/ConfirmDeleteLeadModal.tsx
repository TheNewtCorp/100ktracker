import React from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, AlertTriangle, Clock, User } from 'lucide-react';
import { Lead, Contact } from '../../../types';

interface ConfirmDeleteLeadModalProps {
  onClose: () => void;
  onConfirm: () => void;
  lead: Lead;
  contact?: Contact;
  isDeleting?: boolean;
}

const ConfirmDeleteLeadModal: React.FC<ConfirmDeleteLeadModalProps> = ({
  onClose,
  onConfirm,
  lead,
  contact,
  isDeleting = false,
}) => {
  const hasReminder = !!lead.reminderDate;
  const hasContact = !!contact;
  const hasWatchReference = !!lead.watchReference;

  return (
    <motion.div
      className='fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className='bg-charcoal-slate rounded-2xl w-full max-w-lg'
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
            <h2 className='text-xl font-bold text-platinum-silver'>Confirm Lead Deletion</h2>
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
            <p className='text-platinum-silver mb-4'>
              Are you sure you want to delete this lead? This action cannot be undone.
            </p>

            {/* Lead Details */}
            <div className='bg-obsidian-black/30 rounded-lg p-4 border border-champagne-gold/10 mb-4'>
              <div className='flex items-center gap-2 mb-3'>
                <Trash2 size={16} className='text-crimson-red' />
                <span className='text-champagne-gold font-semibold text-sm'>LEAD TO DELETE</span>
              </div>
              <div className='space-y-2'>
                <p className='text-platinum-silver font-medium text-lg'>{lead.title}</p>
                <div className='flex items-center gap-4 text-sm text-platinum-silver/70'>
                  <span className='px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs font-medium'>
                    {lead.status}
                  </span>
                  {hasWatchReference && <span className='text-platinum-silver/60'>Watch: {lead.watchReference}</span>}
                </div>
                {hasContact && (
                  <p className='text-platinum-silver/70 text-sm flex items-center gap-1'>
                    <User size={14} />
                    Contact: {contact.firstName} {contact.lastName}
                  </p>
                )}
                {lead.notes && <p className='text-platinum-silver/60 text-xs italic'>"{lead.notes}"</p>}
              </div>
            </div>

            {/* Warnings Section */}
            <div className='space-y-3'>
              {/* Reminder Warning */}
              {hasReminder && (
                <div className='bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Clock size={16} className='text-yellow-500' />
                    <span className='text-yellow-500 font-semibold text-sm'>REMINDER WILL BE LOST</span>
                  </div>
                  <p className='text-yellow-500/90 text-sm'>
                    This lead has a reminder set for{' '}
                    <strong>
                      {new Date(lead.reminderDate!).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </strong>
                    . The reminder will be permanently deleted along with this lead.
                  </p>
                </div>
              )}

              {/* Progress Warning */}
              {lead.status !== 'Monitoring' && (
                <div className='bg-blue-500/10 border border-blue-500/20 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <AlertTriangle size={16} className='text-blue-500' />
                    <span className='text-blue-500 font-semibold text-sm'>ACTIVE LEAD PROGRESS</span>
                  </div>
                  <p className='text-blue-500/90 text-sm'>
                    This lead is in "{lead.status}" status, indicating active progress. Deleting it will permanently
                    lose all associated progress and history.
                  </p>
                </div>
              )}

              {/* Main Warning */}
              <div className='bg-crimson-red/10 border border-crimson-red/20 rounded-lg p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <Trash2 size={16} className='text-crimson-red' />
                  <span className='text-crimson-red font-semibold text-sm'>PERMANENT DELETION</span>
                </div>
                <p className='text-crimson-red/90 text-sm'>
                  ⚠️ This action is irreversible. The lead, its progress, notes, and any associated reminders will be
                  permanently lost.
                </p>
              </div>
            </div>
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
                Deleting Lead...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete Lead
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfirmDeleteLeadModal;
