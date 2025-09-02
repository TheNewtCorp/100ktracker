import React from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, AlertTriangle, Package, CreditCard, Users } from 'lucide-react';
import { Contact, ContactType } from '../../../types';

interface ConfirmDeleteContactModalProps {
  onClose: () => void;
  onConfirm: () => void;
  contact: Contact;
  isDeleting?: boolean;
}

const getTypeColor = (type?: ContactType) => {
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
};

const ConfirmDeleteContactModal: React.FC<ConfirmDeleteContactModalProps> = ({
  onClose,
  onConfirm,
  contact,
  isDeleting = false,
}) => {
  const hasWatchAssociations = contact.watchAssociations && contact.watchAssociations.length > 0;
  const hasCards = contact.cards && contact.cards.length > 0;
  const isCustomer = contact.contactType === ContactType.Customer;

  return (
    <motion.div
      className='fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4'
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className='bg-charcoal-slate rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col'
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
            <h2 className='text-xl font-bold text-platinum-silver'>Confirm Contact Deletion</h2>
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
        <div className='flex-grow overflow-y-auto p-6'>
          <div className='mb-4'>
            <p className='text-platinum-silver mb-4'>
              Are you sure you want to delete this contact? This action cannot be undone.
            </p>

            {/* Contact Details */}
            <div className='bg-obsidian-black/30 rounded-lg p-4 border border-champagne-gold/10 mb-4'>
              <div className='flex items-center gap-2 mb-3'>
                <Users size={16} className='text-crimson-red' />
                <span className='text-champagne-gold font-semibold text-sm'>CONTACT TO DELETE</span>
              </div>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <p className='text-platinum-silver font-medium text-lg'>
                    {contact.firstName} {contact.lastName}
                  </p>
                  {contact.contactType && (
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(contact.contactType)}`}
                    >
                      {contact.contactType}
                    </span>
                  )}
                </div>
                {contact.businessName && (
                  <p className='text-platinum-silver/70 text-sm'>Business: {contact.businessName}</p>
                )}
                {contact.email && <p className='text-platinum-silver/70 text-sm'>Email: {contact.email}</p>}
                {contact.phone && <p className='text-platinum-silver/70 text-sm'>Phone: {contact.phone}</p>}
              </div>
            </div>

            {/* Warnings Section */}
            <div className='space-y-3'>
              {/* Watch Associations Warning */}
              {hasWatchAssociations && (
                <div className='bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Package size={16} className='text-yellow-500' />
                    <span className='text-yellow-500 font-semibold text-sm'>WATCH ASSOCIATIONS IMPACT</span>
                  </div>
                  <p className='text-yellow-500/90 text-sm mb-2'>
                    This contact is associated with {contact.watchAssociations!.length} watch(es). Deleting this contact
                    will remove these associations:
                  </p>
                  <div className='max-h-24 overflow-y-auto space-y-1'>
                    {contact.watchAssociations!.map((assoc, index) => (
                      <div key={index} className='text-xs text-yellow-500/80 pl-4'>
                        • {assoc.watchIdentifier} ({assoc.role})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved Cards Warning */}
              {hasCards && (
                <div className='bg-purple-500/10 border border-purple-500/20 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <CreditCard size={16} className='text-purple-500' />
                    <span className='text-purple-500 font-semibold text-sm'>PAYMENT CARDS IMPACT</span>
                  </div>
                  <p className='text-purple-500/90 text-sm'>
                    This contact has {contact.cards!.length} saved payment card(s) that will also be permanently
                    deleted.
                  </p>
                </div>
              )}

              {/* Customer Relationship Warning */}
              {isCustomer && (
                <div className='bg-blue-500/10 border border-blue-500/20 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-2'>
                    <Users size={16} className='text-blue-500' />
                    <span className='text-blue-500 font-semibold text-sm'>CUSTOMER RELATIONSHIP</span>
                  </div>
                  <p className='text-blue-500/90 text-sm'>
                    You're about to delete a customer contact. This will permanently remove their purchase history and
                    relationship data.
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
                  ⚠️ This action is irreversible. All contact information, associated data, and relationship history
                  will be permanently lost.
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
