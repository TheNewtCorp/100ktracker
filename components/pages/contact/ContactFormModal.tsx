import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, AlertTriangle, CreditCard } from 'lucide-react';
import { Contact, ContactType, Watch, AssociationRole, WatchAssociation, Card } from '../../../types';
import { useTheme } from '../../../hooks/useTheme';

interface ContactFormModalProps {
  onClose: () => void;
  onSave: (contact: Omit<Contact, 'id'> | Contact, associations: WatchAssociation[], cards: Card[]) => void;
  contact: Contact | null;
  watches: Watch[];
  contacts: Contact[];
}

const initialContactState: Omit<Contact, 'id' | 'watchAssociations' | 'cards'> = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  contactSource: '',
  contactType: ContactType.Lead,
  businessName: '',
  streetAddress: '',
  city: '',
  state: '',
  postalCode: '',
  website: '',
  timeZone: '',
  notes: '',
};

const NewCardInitialState = {
  cardholderName: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
};

const ContactFormModal: React.FC<ContactFormModalProps> = ({ onClose, onSave, contact, watches, contacts }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState(contact || initialContactState);
  const [associations, setAssociations] = useState<WatchAssociation[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [newCard, setNewCard] = useState(NewCardInitialState);
  const [cardError, setCardError] = useState('');
  const [error, setError] = useState('');

  const [selectedWatchId, setSelectedWatchId] = useState('');
  const [selectedRole, setSelectedRole] = useState<AssociationRole>(AssociationRole.Buyer);

  useEffect(() => {
    setFormData(contact ? { ...initialContactState, ...contact } : initialContactState);
    setAssociations(contact?.watchAssociations || []);
    setCards(contact?.cards || []);
  }, [contact]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'cardNumber') {
      setNewCard((prev) => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 16) }));
    } else if (name === 'expiry') {
      setNewCard((prev) => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 4) }));
    } else if (name === 'cvc') {
      setNewCard((prev) => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 4) }));
    } else {
      setNewCard((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddCard = () => {
    setCardError('');
    if (!newCard.cardholderName.trim()) {
      setCardError('Cardholder Name is required.');
      return;
    }
    if (newCard.cardNumber.length < 15) {
      setCardError('Invalid Card Number.');
      return;
    }
    if (newCard.expiry.length !== 4) {
      setCardError('Invalid Expiry Date (MMYY).');
      return;
    }
    if (newCard.cvc.length < 3) {
      setCardError('Invalid CVC.');
      return;
    }

    const [month, year] = [newCard.expiry.slice(0, 2), `20${newCard.expiry.slice(2, 4)}`];
    if (parseInt(month) < 1 || parseInt(month) > 12) {
      setCardError('Invalid Expiry Month.');
      return;
    }

    const newCardData: Card = {
      id: new Date().toISOString(),
      cardholderName: newCard.cardholderName,
      last4: newCard.cardNumber.slice(-4),
      expiryMonth: month,
      expiryYear: year,
    };
    setCards((prev) => [...prev, newCardData]);
    setNewCard(NewCardInitialState);
  };

  const handleRemoveCard = (id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim()) {
      setError('First Name is required.');
      return;
    }
    setError('');
    onSave(formData, associations, cards);
  };

  const handleAddAssociation = () => {
    if (!selectedWatchId) return;
    const watch = watches.find((w) => w.id === selectedWatchId);
    if (!watch) return;

    setAssociations((prev) => [
      ...prev,
      {
        watchId: selectedWatchId,
        role: selectedRole,
        watchIdentifier: `${watch.brand} ${watch.model} (${watch.referenceNumber})`,
      },
    ]);
    setSelectedWatchId('');
  };

  const handleRemoveAssociation = (watchId: string, role: AssociationRole) => {
    setAssociations((prev) => prev.filter((a) => !(a.watchId === watchId && a.role === role)));
  };

  const associationConflict = useMemo(() => {
    if (!selectedWatchId) return null;
    const watch = watches.find((w) => w.id === selectedWatchId);
    if (!watch) return null;

    const conflictingContactId = selectedRole === AssociationRole.Buyer ? watch.buyerContactId : watch.sellerContactId;
    if (conflictingContactId && conflictingContactId !== contact?.id) {
      const conflictingContact = contacts.find((c) => c.id === conflictingContactId);
      return `${conflictingContact?.firstName || 'Another contact'} is already assigned as the ${selectedRole}. This will be overwritten.`;
    }
    return null;
  }, [selectedWatchId, selectedRole, watches, contacts, contact]);

  const availableWatches = useMemo(
    () => watches.filter((w) => !associations.some((a) => a.watchId === w.id)),
    [watches, associations],
  );

  const inputClass =
    theme === 'light'
      ? 'appearance-none relative block w-full px-3 py-2.5 bg-white border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors'
      : 'appearance-none relative block w-full px-3 py-2.5 bg-obsidian-black border border-champagne-gold/20 placeholder-platinum-silver/50 text-platinum-silver rounded-md focus:outline-none focus:ring-champagne-gold focus:border-champagne-gold sm:text-sm transition-colors';

  const labelClass =
    theme === 'light'
      ? 'block text-sm font-medium text-gray-700 mb-1'
      : 'block text-sm font-medium text-platinum-silver/80 mb-1';

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
        className={`rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col ${
          theme === 'light' ? 'bg-white border border-gray-200' : 'bg-charcoal-slate'
        }`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          className={`flex items-center justify-between p-4 border-b ${
            theme === 'light' ? 'border-gray-200' : 'border-champagne-gold/10'
          }`}
        >
          <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-champagne-gold'}`}>
            {contact ? 'Edit Contact' : 'Create New Contact'}
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full transition-colors ${
              theme === 'light' ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-obsidian-black/50 text-platinum-silver'
            }`}
          >
            <X size={24} />
          </button>
        </header>
        <div className='flex-grow overflow-y-auto p-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4'>
              <div>
                <label htmlFor='firstName' className={labelClass}>
                  First Name <span className='text-crimson-red'>*</span>
                </label>
                <input
                  type='text'
                  name='firstName'
                  id='firstName'
                  value={formData.firstName || ''}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor='lastName' className={labelClass}>
                  Last Name
                </label>
                <input
                  type='text'
                  name='lastName'
                  id='lastName'
                  value={formData.lastName || ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor='email' className={labelClass}>
                  Email
                </label>
                <input
                  type='email'
                  name='email'
                  id='email'
                  value={formData.email || ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor='phone' className={labelClass}>
                  Phone
                </label>
                <input
                  type='tel'
                  name='phone'
                  id='phone'
                  value={formData.phone || ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor='contactSource' className={labelClass}>
                  Contact Source
                </label>
                <input
                  type='text'
                  name='contactSource'
                  id='contactSource'
                  value={formData.contactSource || ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor='contactType' className={labelClass}>
                  Contact Type
                </label>
                <select
                  name='contactType'
                  id='contactType'
                  value={formData.contactType || ContactType.Lead}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {Object.values(ContactType).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className='md:col-span-2'>
                <label htmlFor='businessName' className={labelClass}>
                  Business Name
                </label>
                <input
                  type='text'
                  name='businessName'
                  id='businessName'
                  value={formData.businessName || ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className='md:col-span-2'>
                <label htmlFor='streetAddress' className={labelClass}>
                  Street Address
                </label>
                <input
                  type='text'
                  name='streetAddress'
                  id='streetAddress'
                  value={formData.streetAddress || ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor='city' className={labelClass}>
                  City
                </label>
                <input
                  type='text'
                  name='city'
                  id='city'
                  value={formData.city || ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor='state' className={labelClass}>
                  State
                </label>
                <input
                  type='text'
                  name='state'
                  id='state'
                  value={formData.state || ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor='postalCode' className={labelClass}>
                  Postal Code
                </label>
                <input
                  type='text'
                  name='postalCode'
                  id='postalCode'
                  value={formData.postalCode || ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor='website' className={labelClass}>
                  Website
                </label>
                <input
                  type='url'
                  name='website'
                  id='website'
                  value={formData.website || ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className='md:col-span-2'>
                <label htmlFor='timeZone' className={labelClass}>
                  Time Zone
                </label>
                <input
                  type='text'
                  name='timeZone'
                  id='timeZone'
                  value={formData.timeZone || ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className='md:col-span-2'>
                <label htmlFor='notes' className={labelClass}>
                  Notes
                </label>
                <textarea
                  name='notes'
                  id='notes'
                  value={formData.notes || ''}
                  onChange={handleChange}
                  rows={3}
                  className={inputClass}
                ></textarea>
              </div>
            </div>
            <div className={`pt-4 border-t ${theme === 'light' ? 'border-gray-200' : 'border-champagne-gold/10'}`}>
              <h3
                className={`text-lg font-semibold mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}
              >
                Watch Associations
              </h3>
              <div className='space-y-2 mb-4'>
                {associations.map((assoc) => (
                  <div
                    key={`${assoc.watchId}-${assoc.role}`}
                    className={`flex items-center justify-between p-2 rounded-md text-sm ${
                      theme === 'light' ? 'bg-gray-50 border border-gray-200' : 'bg-obsidian-black'
                    }`}
                  >
                    <div>
                      <span
                        className={`font-semibold ${
                          assoc.role === AssociationRole.Buyer
                            ? theme === 'light'
                              ? 'text-green-600'
                              : 'text-money-green'
                            : theme === 'light'
                              ? 'text-blue-600'
                              : 'text-arctic-blue'
                        }`}
                      >
                        {assoc.role}:
                      </span>
                      <span className={theme === 'light' ? 'text-gray-700' : 'text-platinum-silver/80'}>
                        {assoc.watchIdentifier}
                      </span>
                    </div>
                    <button
                      type='button'
                      onClick={() => handleRemoveAssociation(assoc.watchId, assoc.role)}
                      className='text-crimson-red/70 hover:text-crimson-red p-1'
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {associations.length === 0 && (
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-platinum-silver/60'}`}>
                    No watches associated.
                  </p>
                )}
              </div>{' '}
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end'>
                <div className='sm:col-span-2 md:col-span-2'>
                  <label htmlFor='watch' className={labelClass}>
                    Associate Watch
                  </label>
                  <select
                    id='watch'
                    value={selectedWatchId}
                    onChange={(e) => setSelectedWatchId(e.target.value)}
                    className={inputClass}
                  >
                    <option value=''>Select a watch...</option>
                    {availableWatches.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.brand} {w.model}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor='role' className={labelClass}>
                    As
                  </label>
                  <select
                    id='role'
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as AssociationRole)}
                    className={inputClass}
                  >
                    {Object.values(AssociationRole).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='md:col-span-2'>
                  <button
                    type='button'
                    onClick={handleAddAssociation}
                    disabled={!selectedWatchId}
                    className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      theme === 'light'
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-champagne-gold/20 text-champagne-gold hover:bg-champagne-gold/30'
                    }`}
                  >
                    Add Association
                  </button>
                </div>
              </div>
              {associationConflict && (
                <div
                  className={`mt-3 p-2 text-xs rounded-md flex items-center gap-2 ${
                    theme === 'light'
                      ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      : 'bg-yellow-900/50 text-yellow-300'
                  }`}
                >
                  <AlertTriangle size={16} />
                  <span>{associationConflict}</span>
                </div>
              )}
            </div>
            <div className={`pt-4 border-t ${theme === 'light' ? 'border-gray-200' : 'border-champagne-gold/10'}`}>
              <h3
                className={`text-lg font-semibold mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}
              >
                Saved Cards
              </h3>
              <div className='space-y-2 mb-4'>
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className={`flex items-center justify-between p-2 rounded-md text-sm ${
                      theme === 'light' ? 'bg-gray-50 border border-gray-200' : 'bg-obsidian-black'
                    }`}
                  >
                    <div className='flex items-center gap-3'>
                      <CreditCard className={theme === 'light' ? 'text-blue-600' : 'text-champagne-gold'} size={20} />
                      <div>
                        <p
                          className={`font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver/90'}`}
                        >
                          {card.cardholderName}
                        </p>
                        <p className={theme === 'light' ? 'text-gray-600' : 'text-platinum-silver/60'}>
                          Card ending in •••• {card.last4}
                          <span className='ml-2'>
                            Expires {card.expiryMonth}/{card.expiryYear.slice(-2)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      type='button'
                      onClick={() => handleRemoveCard(card.id)}
                      className='text-crimson-red/70 hover:text-crimson-red p-1'
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {cards.length === 0 && (
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-platinum-silver/60'}`}>
                    No cards on file.
                  </p>
                )}
              </div>
              <div
                className={`p-4 rounded-lg space-y-3 ${
                  theme === 'light' ? 'bg-gray-50 border border-gray-200' : 'bg-obsidian-black/50'
                }`}
              >
                <h4 className={`font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
                  Add a New Card
                </h4>
                <div className='grid grid-cols-1 lg:grid-cols-6 gap-3 items-start'>
                  <div className='lg:col-span-6'>
                    <label className={labelClass}>Cardholder Name</label>
                    <input
                      type='text'
                      name='cardholderName'
                      value={newCard.cardholderName}
                      onChange={handleNewCardChange}
                      className={inputClass}
                    />
                  </div>
                  <div className='lg:col-span-3'>
                    <label className={labelClass}>Card Number</label>
                    <input
                      type='text'
                      name='cardNumber'
                      value={newCard.cardNumber}
                      onChange={handleNewCardChange}
                      className={inputClass}
                      placeholder='•••• •••• •••• ••••'
                    />
                  </div>
                  <div className='lg:col-span-1'>
                    <label className={labelClass}>Expiry</label>
                    <input
                      type='text'
                      name='expiry'
                      value={newCard.expiry}
                      onChange={handleNewCardChange}
                      className={inputClass}
                      placeholder='MMYY'
                    />
                  </div>
                  <div className='lg:col-span-1'>
                    <label className={labelClass}>CVC</label>
                    <input
                      type='text'
                      name='cvc'
                      value={newCard.cvc}
                      onChange={handleNewCardChange}
                      className={inputClass}
                      placeholder='•••'
                    />
                  </div>
                  <div className='lg:col-span-1 flex items-end h-full'>
                    <button
                      type='button'
                      onClick={handleAddCard}
                      className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-colors ${
                        theme === 'light'
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-champagne-gold/20 text-champagne-gold hover:bg-champagne-gold/30'
                      }`}
                    >
                      Add
                    </button>
                  </div>
                </div>
                {cardError && <p className='text-xs text-crimson-red mt-1'>{cardError}</p>}
              </div>
            </div>
          </form>
        </div>
        <footer
          className={`p-4 border-t flex justify-end items-center gap-4 ${
            theme === 'light' ? 'border-gray-200' : 'border-champagne-gold/10'
          }`}
        >
          {error && <p className='text-sm text-crimson-red mr-auto'>{error}</p>}
          <button
            type='button'
            onClick={onClose}
            className={`py-2 px-4 rounded-lg transition-colors ${
              theme === 'light' ? 'text-gray-700 hover:bg-gray-100' : 'text-platinum-silver hover:bg-obsidian-black/50'
            }`}
          >
            Cancel
          </button>
          <button
            type='submit'
            onClick={handleSubmit}
            className={`py-2 px-4 rounded-lg font-bold transition-colors ${
              theme === 'light'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-champagne-gold text-obsidian-black hover:bg-opacity-90'
            }`}
          >
            Save Contact
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
};

export default ContactFormModal;
