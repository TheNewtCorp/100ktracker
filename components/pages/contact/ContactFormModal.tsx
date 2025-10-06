import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, User, Watch, BarChart3, CreditCard } from 'lucide-react';
import { Contact, ContactType, Watch as WatchType, AssociationRole, WatchAssociation, Card } from '../../../types';
import { useTheme } from '../../../hooks/useTheme';
import TabNavigation, { TabId } from '../../ui/TabNavigation';
import GeneralTab from './tabs/GeneralTab';
import WatchesTab from './tabs/WatchesTab';
import MetricsTab from './tabs/MetricsTab';
import CardsTab from './tabs/CardsTab';

interface ContactFormModalProps {
  onClose: () => void;
  onSave: (contact: Omit<Contact, 'id'> | Contact, associations: WatchAssociation[], cards: Card[]) => void;
  contact: Contact | null;
  watches: WatchType[];
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
  const [activeTab, setActiveTab] = useState<TabId>('general');
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

  // Tab configuration
  const tabs = [
    { id: 'general' as TabId, label: 'General', icon: User },
    { id: 'watches' as TabId, label: 'Watches', icon: Watch, badge: associations.length },
    { id: 'metrics' as TabId, label: 'Metrics', icon: BarChart3 },
    { id: 'cards' as TabId, label: 'Cards', icon: CreditCard, badge: cards.length },
  ];

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

  const handleAddAssociation = (watchId: string, role: AssociationRole) => {
    const watch = watches.find((w) => w.id === watchId);
    if (!watch) return;

    setAssociations((prev) => [
      ...prev,
      {
        watchId,
        role,
        watchIdentifier: `${watch.brand} ${watch.model} (${watch.referenceNumber})`,
      },
    ]);
    setSelectedWatchId('');
  };

  const handleRemoveAssociation = (watchId: string, role: AssociationRole) => {
    setAssociations((prev) => prev.filter((a) => !(a.watchId === watchId && a.role === role)));
  };

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
        className={`rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col ${
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

        {/* Tab Navigation */}
        <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className='flex-grow overflow-y-auto'>
          <form onSubmit={handleSubmit}>
            <div className='p-6'>
              {activeTab === 'general' && <GeneralTab formData={formData} onChange={handleChange} error={error} />}

              {activeTab === 'watches' && (
                <WatchesTab
                  contact={contact}
                  watches={watches}
                  contacts={contacts}
                  associations={associations}
                  onAddAssociation={handleAddAssociation}
                  onRemoveAssociation={handleRemoveAssociation}
                  selectedWatchId={selectedWatchId}
                  selectedRole={selectedRole}
                  onWatchIdChange={setSelectedWatchId}
                  onRoleChange={setSelectedRole}
                />
              )}

              {activeTab === 'metrics' && (
                <MetricsTab contact={contact} watches={watches} associations={associations} />
              )}

              {activeTab === 'cards' && (
                <CardsTab
                  cards={cards}
                  newCard={newCard}
                  onNewCardChange={handleNewCardChange}
                  onAddCard={handleAddCard}
                  onRemoveCard={handleRemoveCard}
                  cardError={cardError}
                />
              )}
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
