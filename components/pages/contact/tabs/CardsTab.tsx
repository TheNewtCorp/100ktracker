import React from 'react';
import { Trash2, CreditCard } from 'lucide-react';
import { Card } from '../../../../types';
import { useTheme } from '../../../../hooks/useTheme';

interface CardsTabProps {
  cards: Card[];
  newCard: {
    cardholderName: string;
    cardNumber: string;
    expiry: string;
    cvc: string;
  };
  onNewCardChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddCard: () => void;
  onRemoveCard: (id: string) => void;
  cardError: string;
}

const CardsTab: React.FC<CardsTabProps> = ({ cards, newCard, onNewCardChange, onAddCard, onRemoveCard, cardError }) => {
  const { theme } = useTheme();

  const inputClass =
    theme === 'light'
      ? 'appearance-none relative block w-full px-3 py-2.5 bg-white border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors'
      : 'appearance-none relative block w-full px-3 py-2.5 bg-obsidian-black border border-champagne-gold/20 placeholder-platinum-silver/50 text-platinum-silver rounded-md focus:outline-none focus:ring-champagne-gold focus:border-champagne-gold sm:text-sm transition-colors';

  const labelClass =
    theme === 'light'
      ? 'block text-sm font-medium text-gray-700 mb-1'
      : 'block text-sm font-medium text-platinum-silver/80 mb-1';

  return (
    <div className='space-y-6'>
      <div>
        <h3 className={`text-lg font-semibold mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
          Saved Cards
        </h3>
        <div className='space-y-2 mb-4'>
          {cards.map((card) => (
            <div
              key={card.id}
              className={`flex items-center justify-between p-3 rounded-md border ${
                theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-obsidian-black border-champagne-gold/20'
              }`}
            >
              <div className='flex items-center gap-3'>
                <CreditCard className={theme === 'light' ? 'text-blue-600' : 'text-champagne-gold'} size={20} />
                <div>
                  <p className={`font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver/90'}`}>
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
                onClick={() => onRemoveCard(card.id)}
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
      </div>

      <div
        className={`p-4 rounded-lg space-y-3 ${
          theme === 'light'
            ? 'bg-gray-50 border border-gray-200'
            : 'bg-obsidian-black/50 border border-champagne-gold/10'
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
              onChange={onNewCardChange}
              className={inputClass}
            />
          </div>
          <div className='lg:col-span-3'>
            <label className={labelClass}>Card Number</label>
            <input
              type='text'
              name='cardNumber'
              value={newCard.cardNumber}
              onChange={onNewCardChange}
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
              onChange={onNewCardChange}
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
              onChange={onNewCardChange}
              className={inputClass}
              placeholder='•••'
            />
          </div>
          <div className='lg:col-span-1 flex items-end h-full'>
            <button
              type='button'
              onClick={onAddCard}
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
  );
};

export default CardsTab;
