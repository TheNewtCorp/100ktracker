import React from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, AlertTriangle, Package, CreditCard, Users } from 'lucide-react';
import { Contact, ContactType } from '../../../types';
import { useTheme } from '../../../hooks/useTheme';

interface ConfirmDeleteContactModalProps {
  onClose: () => void;
  onConfirm: () => void;
  contact: Contact;
  isDeleting?: boolean;
}

const getTypeColor = (type?: ContactType, theme: 'light' | 'dark' = 'dark') => {
  if (theme === 'light') {
    switch (type) {
      case ContactType.Lead:
        return 'bg-blue-100 text-blue-700';
      case ContactType.Customer:
        return 'bg-green-100 text-green-700';
      case ContactType.WatchTrader:
        return 'bg-purple-100 text-purple-700';
      case ContactType.Jeweler:
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  } else {
    switch (type) {
      case ContactType.Lead:
        return 'bg-blue-500/20 text-blue-300';
      case ContactType.Customer:
        return 'bg-green-500/20 text-green-300';
      case ContactType.WatchTrader:
        return 'bg-purple-500/20 text-purple-300';
      case ContactType.Jeweler:
        return 'bg-yellow-500/20 text-yellow-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  }
};

const ConfirmDeleteContactModal: React.FC<ConfirmDeleteContactModalProps> = ({
  onClose,
  onConfirm,
  contact,
  isDeleting = false,
}) => {
  const { theme } = useTheme();
  const hasWatchAssociations = contact.watchAssociations && contact.watchAssociations.length > 0;
  const hasCards = contact.cards && contact.cards.length > 0;
  const isCustomer = contact.contactType === ContactType.Customer;

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
        className={`rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col ${
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
              Confirm Contact Deletion
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
        <div className='flex-grow overflow-y-auto p-6'>
          <div className='mb-4'>
            <p className={`mb-4 ${theme === 'light' ? 'text-gray-700' : 'text-platinum-silver'}`}>
              Are you sure you want to delete this contact? This action cannot be undone.
            </p>

            {/* Contact Details */}
            <div
              className={`rounded-lg p-4 border mb-4 ${
                theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-obsidian-black/30 border-champagne-gold/10'
              }`}
            >
              <div className='flex items-center gap-2 mb-3'>
                <Users size={16} className='text-crimson-red' />
                <span className={`font-semibold text-sm ${theme === 'light' ? 'text-red-600' : 'text-champagne-gold'}`}>
                  CONTACT TO DELETE
                </span>
              </div>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <p className={`font-medium text-lg ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
                    {contact.firstName} {contact.lastName}
                  </p>
                  {contact.contactType && (
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(contact.contactType, theme)}`}
                    >
                      {contact.contactType}
                    </span>
                  )}
                </div>
                {contact.businessName && (
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-platinum-silver/70'}`}>
                    Business: {contact.businessName}
                  </p>
                )}
                {contact.email && (
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-platinum-silver/70'}`}>
                    Email: {contact.email}
                  </p>
                )}
                {contact.phone && (
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-platinum-silver/70'}`}>
                    Phone: {contact.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Warnings Section */}
            <div className='space-y-3'>
              {/* Watch Associations Warning */}
              {hasWatchAssociations && (
                <div
                  className={`border rounded-lg p-4 ${
                    theme === 'light' ? 'bg-yellow-50 border-yellow-200' : 'bg-yellow-500/10 border-yellow-500/20'
                  }`}
                >
                  <div className='flex items-center gap-2 mb-2'>
                    <Package size={16} className='text-yellow-500' />
                    <span className='text-yellow-500 font-semibold text-sm'>WATCH ASSOCIATIONS IMPACT</span>
                  </div>
                  <p className={`text-sm mb-2 ${theme === 'light' ? 'text-yellow-700' : 'text-yellow-500/90'}`}>
                    This contact is associated with {contact.watchAssociations!.length} watch(es). Deleting this contact
                    will remove these associations:
                  </p>
                  <div className='max-h-24 overflow-y-auto space-y-1'>
                    {contact.watchAssociations!.map((assoc, index) => (
                      <div
                        key={index}
                        className={`text-xs pl-4 ${theme === 'light' ? 'text-yellow-700' : 'text-yellow-500/80'}`}
                      >
                        • {assoc.watchIdentifier} ({assoc.role})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved Cards Warning */}
              {hasCards && (
                <div
                  className={`border rounded-lg p-4 ${
                    theme === 'light' ? 'bg-purple-50 border-purple-200' : 'bg-purple-500/10 border-purple-500/20'
                  }`}
                >
                  <div className='flex items-center gap-2 mb-2'>
                    <CreditCard size={16} className='text-purple-500' />
                    <span className='text-purple-500 font-semibold text-sm'>PAYMENT CARDS IMPACT</span>
                  </div>
                  <p className={`text-sm ${theme === 'light' ? 'text-purple-700' : 'text-purple-500/90'}`}>
                    This contact has {contact.cards!.length} saved payment card(s) that will also be permanently
                    deleted.
                  </p>
                </div>
              )}

              {/* Customer Relationship Warning */}
              {isCustomer && (
                <div
                  className={`border rounded-lg p-4 ${
                    theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/10 border-blue-500/20'
                  }`}
                >
                  <div className='flex items-center gap-2 mb-2'>
                    <Users size={16} className='text-blue-500' />
                    <span className='text-blue-500 font-semibold text-sm'>CUSTOMER RELATIONSHIP</span>
                  </div>
                  <p className={`text-sm ${theme === 'light' ? 'text-blue-700' : 'text-blue-500/90'}`}>
                    You're about to delete a customer contact. This will permanently remove their purchase history and
                    relationship data.
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
                  ⚠️ This action is irreversible. All contact information, associated data, and relationship history
                  will be permanently lost.
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
            className='flex items-center gap-2 py-2 px-4 rounded-lg bg-crimson-red text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isDeleting ? (
              <>
                <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                Deleting Contact...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete Contact
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ConfirmDeleteContactModal;
