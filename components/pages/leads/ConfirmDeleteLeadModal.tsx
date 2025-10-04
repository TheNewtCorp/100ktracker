import React from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, AlertTriangle, Clock, User } from 'lucide-react';
import { Lead, Contact } from '../../../types';
import { useTheme } from '../../../hooks/useTheme';

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
  const { theme } = useTheme();
  const hasReminder = !!lead.reminderDate;
  const hasContact = !!contact;
  const hasWatchReference = !!lead.watchReference;

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        theme === 'light' ? 'bg-black/50' : 'bg-black/70'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={`rounded-2xl w-full max-w-lg ${
          theme === 'light' ? 'bg-white border border-gray-200' : 'bg-charcoal-slate'
        }`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            theme === 'light' ? 'border-gray-200' : 'border-champagne-gold/10'
          }`}
        >
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-full bg-crimson-red/20'>
              <AlertTriangle size={20} className='text-crimson-red' />
            </div>
            <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
              Confirm Lead Deletion
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-full transition-colors ${
              theme === 'light'
                ? 'hover:bg-gray-100 text-gray-600'
                : 'hover:bg-obsidian-black/50 text-platinum-silver/60'
            }`}
            disabled={isDeleting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className='p-6'>
          <div className='mb-4'>
            <p className={`mb-4 ${theme === 'light' ? 'text-gray-700' : 'text-platinum-silver'}`}>
              Are you sure you want to delete this lead? This action cannot be undone.
            </p>

            {/* Lead Details */}
            <div
              className={`rounded-lg p-4 border mb-4 ${
                theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-obsidian-black/30 border-champagne-gold/10'
              }`}
            >
              <div className='flex items-center gap-2 mb-3'>
                <Trash2 size={16} className='text-crimson-red' />
                <span className={`font-semibold text-sm ${theme === 'light' ? 'text-red-600' : 'text-champagne-gold'}`}>
                  LEAD TO DELETE
                </span>
              </div>
              <div className='space-y-2'>
                <p className={`font-medium text-lg ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
                  {lead.title}
                </p>
                <div
                  className={`flex items-center gap-4 text-sm ${
                    theme === 'light' ? 'text-gray-600' : 'text-platinum-silver/70'
                  }`}
                >
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      theme === 'light' ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {lead.status}
                  </span>
                  {hasWatchReference && (
                    <span className={theme === 'light' ? 'text-gray-600' : 'text-platinum-silver/60'}>
                      Watch: {lead.watchReference}
                    </span>
                  )}
                </div>
                {hasContact && (
                  <p
                    className={`text-sm flex items-center gap-1 ${
                      theme === 'light' ? 'text-gray-600' : 'text-platinum-silver/70'
                    }`}
                  >
                    <User size={14} />
                    Contact: {contact.firstName} {contact.lastName}
                  </p>
                )}
                {lead.notes && (
                  <p className={`text-xs italic ${theme === 'light' ? 'text-gray-500' : 'text-platinum-silver/60'}`}>
                    "{lead.notes}"
                  </p>
                )}
              </div>
            </div>

            {/* Warnings Section */}
            <div className='space-y-3'>
              {/* Reminder Warning */}
              {hasReminder && (
                <div
                  className={`border rounded-lg p-4 ${
                    theme === 'light' ? 'bg-yellow-50 border-yellow-200' : 'bg-yellow-500/10 border-yellow-500/20'
                  }`}
                >
                  <div className='flex items-center gap-2 mb-2'>
                    <Clock size={16} className='text-yellow-500' />
                    <span className='text-yellow-500 font-semibold text-sm'>REMINDER WILL BE LOST</span>
                  </div>
                  <p className={`text-sm ${theme === 'light' ? 'text-yellow-700' : 'text-yellow-500/90'}`}>
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
                <div
                  className={`border rounded-lg p-4 ${
                    theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/20'
                  }`}
                >
                  <div className='flex items-center gap-2 mb-2'>
                    <AlertTriangle size={16} className='text-blue-500' />
                    <span className='text-blue-500 font-semibold text-sm'>ACTIVE LEAD PROGRESS</span>
                  </div>
                  <p className={`text-sm ${theme === 'light' ? 'text-blue-700' : 'text-blue-500/90'}`}>
                    This lead is in "{lead.status}" status, indicating active progress. Deleting it will permanently
                    lose all associated progress and history.
                  </p>
                </div>
              )}

              {/* Main Warning */}
              <div
                className={`border rounded-lg p-4 ${
                  theme === 'light' ? 'bg-red-50 border-red-200' : 'bg-crimson-red/10 border-crimson-red/20'
                }`}
              >
                <div className='flex items-center gap-2 mb-2'>
                  <Trash2 size={16} className='text-crimson-red' />
                  <span className='text-crimson-red font-semibold text-sm'>PERMANENT DELETION</span>
                </div>
                <p className={`text-sm ${theme === 'light' ? 'text-red-700' : 'text-crimson-red/90'}`}>
                  ⚠️ This action is irreversible. The lead, its progress, notes, and any associated reminders will be
                  permanently lost.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-6 border-t flex justify-end items-center gap-3 ${
            theme === 'light' ? 'border-gray-200' : 'border-champagne-gold/10'
          }`}
        >
          <button
            type='button'
            onClick={onClose}
            className={`py-2 px-4 rounded-lg transition-colors ${
              theme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-platinum-silver hover:bg-obsidian-black/50'
            }`}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === 'light'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-crimson-red text-white hover:bg-red-700'
            }`}
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
