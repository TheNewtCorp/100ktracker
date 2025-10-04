import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Package, CreditCard, DollarSign, Trash2 } from 'lucide-react';
import { Contact, ContactType } from '../../../types';
import { useTheme } from '../../../hooks/useTheme';

interface ContactListProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onCreateInvoice: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

const getTypeColor = (type?: ContactType, theme?: string) => {
  const isLight = theme === 'light';
  switch (type) {
    case ContactType.Lead:
      return isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-300';
    case ContactType.Customer:
      return isLight ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-300';
    case ContactType.WatchTrader:
      return isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/20 text-purple-300';
    case ContactType.Jeweler:
      return isLight ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-500/20 text-yellow-300';
    default:
      return isLight ? 'bg-gray-100 text-gray-700' : 'bg-gray-500/20 text-gray-300';
  }
};

const ContactList: React.FC<ContactListProps> = ({ contacts, onEdit, onCreateInvoice, onDelete }) => {
  const { theme } = useTheme();

  if (contacts.length === 0) {
    return (
      <div
        className={`p-8 border-2 border-dashed rounded-lg text-center ${
          theme === 'light' ? 'border-blue-600/20 text-gray-600' : 'border-champagne-gold/20 text-platinum-silver/60'
        }`}
      >
        You have no contacts yet. Click "Add New Contact" to get started.
      </div>
    );
  }

  return (
    <motion.div
      className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.05 },
        },
      }}
      initial='hidden'
      animate='show'
    >
      {contacts.map((contact) => (
        <motion.div
          key={contact.id}
          variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          className={`p-5 rounded-xl relative overflow-hidden group border transition-colors duration-300 flex flex-col justify-between ${
            theme === 'light'
              ? 'bg-white border-gray-300 hover:border-blue-400'
              : 'bg-charcoal-slate border-champagne-gold/10 hover:border-champagne-gold/30'
          }`}
        >
          <div>
            <div className='flex justify-between items-start'>
              <div>
                <h3
                  className={`font-bold text-xl truncate ${
                    theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'
                  }`}
                >
                  {contact.firstName} {contact.lastName}
                </h3>
                {contact.businessName && (
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-platinum-silver/60'}`}>
                    {contact.businessName}
                  </p>
                )}
              </div>
              {contact.contactType && (
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(contact.contactType, theme)}`}
                >
                  {contact.contactType}
                </span>
              )}
            </div>

            <div
              className={`mt-4 space-y-2 text-sm ${theme === 'light' ? 'text-gray-700' : 'text-platinum-silver/80'}`}
            >
              {contact.email && (
                <p className='truncate'>
                  <strong>Email:</strong> {contact.email}
                </p>
              )}
              {contact.phone && (
                <p>
                  <strong>Phone:</strong> {contact.phone}
                </p>
              )}
            </div>
          </div>

          <div
            className={`mt-4 pt-3 border-t flex items-center gap-4 text-xs ${
              theme === 'light' ? 'border-gray-200 text-gray-600' : 'border-champagne-gold/10 text-platinum-silver/60'
            }`}
          >
            {contact.watchAssociations && contact.watchAssociations.length > 0 && (
              <div
                className='flex items-center gap-2'
                title={`${contact.watchAssociations.length} associated watch(es)`}
              >
                <Package size={14} />
                <span>{contact.watchAssociations.length}</span>
              </div>
            )}
            {contact.cards && contact.cards.length > 0 && (
              <div className='flex items-center gap-2' title={`${contact.cards.length} saved card(s)`}>
                <CreditCard size={14} />
                <span>{contact.cards.length}</span>
              </div>
            )}
          </div>

          <div className='absolute top-4 right-4 flex flex-col gap-2'>
            <button
              onClick={() => onEdit(contact)}
              className={`p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all ${
                theme === 'light'
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-obsidian-black/50 text-platinum-silver/60'
              }`}
              aria-label={`Edit ${contact.firstName}`}
              title='Edit Contact'
            >
              <Edit2 size={16} />
            </button>
            {contact.cards && contact.cards.length > 0 && (
              <button
                onClick={() => onCreateInvoice(contact)}
                className={`p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all delay-75 ${
                  theme === 'light'
                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                    : 'bg-obsidian-black/50 text-money-green/70'
                }`}
                aria-label={`Create invoice for ${contact.firstName}`}
                title='Create Invoice'
              >
                <DollarSign size={16} />
              </button>
            )}
            <button
              onClick={() => onDelete(contact)}
              className={`p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all delay-150 ${
                theme === 'light'
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-obsidian-black/50 text-crimson-red/70'
              }`}
              aria-label={`Delete ${contact.firstName}`}
              title='Delete Contact'
            >
              <Trash2 size={16} />
            </button>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ContactList;
