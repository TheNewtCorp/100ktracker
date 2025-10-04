import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Watch, WatchSet, Contact } from '../../../types';
import { useTheme } from '../../../hooks/useTheme';

interface WatchFormModalProps {
  onClose: () => void;
  onSave: (watch: Omit<Watch, 'id'> | Watch) => void;
  watch: Watch | null;
  contacts: Contact[];
}

const initialWatchState: Omit<Watch, 'id'> = {
  brand: '',
  model: '',
  referenceNumber: '',
  inDate: '',
  serialNumber: '',
  watchSet: WatchSet.WatchOnly,
  platformPurchased: '',
  purchasePrice: undefined,
  liquidationPrice: undefined,
  accessories: '',
  accessoriesCost: undefined,
  dateSold: '',
  platformSold: '',
  priceSold: undefined,
  fees: undefined,
  shipping: undefined,
  taxes: undefined,
  notes: '',
  buyerContactId: null,
  sellerContactId: null,
};

const WatchFormModal: React.FC<WatchFormModalProps> = ({ onClose, onSave, watch, contacts }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState(watch || initialWatchState);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(watch ? { ...initialWatchState, ...watch } : initialWatchState);
  }, [watch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isNumberField = [
      'purchasePrice',
      'liquidationPrice',
      'accessoriesCost',
      'priceSold',
      'fees',
      'shipping',
      'taxes',
    ].includes(name);

    if (name === 'sellerContactId' || name === 'buyerContactId') {
      setFormData((prev) => ({ ...prev, [name]: value || null }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' || isNumberField ? (value === '' ? undefined : parseFloat(value)) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brand.trim() || !formData.model.trim() || !formData.referenceNumber.trim()) {
      setError('Brand, Model, and Reference Number are required.');
      return;
    }
    setError('');
    onSave(formData);
  };

  const inputClass = `appearance-none relative block w-full px-3 py-2.5 border rounded-md focus:outline-none sm:text-sm transition-colors ${
    theme === 'light'
      ? 'bg-white border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
      : 'bg-obsidian-black border-champagne-gold/20 placeholder-platinum-silver/50 text-platinum-silver focus:ring-champagne-gold focus:border-champagne-gold'
  }`;
  const labelClass = `block text-sm font-medium mb-1 ${
    theme === 'light' ? 'text-gray-700' : 'text-platinum-silver/80'
  }`;

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
          theme === 'light' ? 'bg-white' : 'bg-charcoal-slate'
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
            {watch ? 'Edit Watch' : 'Add New Watch'}
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-full transition-colors ${
              theme === 'light' ? 'hover:bg-gray-100' : 'hover:bg-obsidian-black/50'
            }`}
          >
            <X size={24} className={theme === 'light' ? 'text-gray-600' : 'text-platinum-silver'} />
          </button>
        </header>
        <div className='flex-grow overflow-y-auto p-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Core Info */}
            <div className={`pb-4 border-b ${theme === 'light' ? 'border-gray-200' : 'border-champagne-gold/10'}`}>
              <h3
                className={`text-lg font-semibold mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}
              >
                Watch Details
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4'>
                <div>
                  <label htmlFor='brand' className={labelClass}>
                    Brand <span className='text-crimson-red'>*</span>
                  </label>
                  <input
                    type='text'
                    name='brand'
                    value={formData.brand}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor='model' className={labelClass}>
                    Model <span className='text-crimson-red'>*</span>
                  </label>
                  <input
                    type='text'
                    name='model'
                    value={formData.model}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor='referenceNumber' className={labelClass}>
                    Reference # <span className='text-crimson-red'>*</span>
                  </label>
                  <input
                    type='text'
                    name='referenceNumber'
                    value={formData.referenceNumber}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label htmlFor='serialNumber' className={labelClass}>
                    Serial Number
                  </label>
                  <input
                    type='text'
                    name='serialNumber'
                    value={formData.serialNumber || ''}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor='watchSet' className={labelClass}>
                    Set
                  </label>
                  <select name='watchSet' value={formData.watchSet} onChange={handleChange} className={inputClass}>
                    {Object.values(WatchSet).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {/* Purchase Info */}
            <div className={`pb-4 border-b ${theme === 'light' ? 'border-gray-200' : 'border-champagne-gold/10'}`}>
              <h3
                className={`text-lg font-semibold mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}
              >
                Acquisition
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4'>
                <div>
                  <label htmlFor='inDate' className={labelClass}>
                    In Date
                  </label>
                  <input
                    type='date'
                    name='inDate'
                    value={formData.inDate || ''}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor='platformPurchased' className={labelClass}>
                    Platform Purchased
                  </label>
                  <input
                    type='text'
                    name='platformPurchased'
                    value={formData.platformPurchased || ''}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor='purchasePrice' className={labelClass}>
                    Purchase Price
                  </label>
                  <input
                    type='number'
                    name='purchasePrice'
                    value={formData.purchasePrice || ''}
                    onChange={handleChange}
                    className={inputClass}
                    step='0.01'
                  />
                </div>
                <div>
                  <label htmlFor='liquidationPrice' className={labelClass}>
                    Liquidation Price
                  </label>
                  <input
                    type='number'
                    name='liquidationPrice'
                    value={formData.liquidationPrice || ''}
                    onChange={handleChange}
                    className={inputClass}
                    step='0.01'
                  />
                </div>
                <div className='md:col-span-2'>
                  <label htmlFor='accessories' className={labelClass}>
                    Accessories
                  </label>
                  <input
                    type='text'
                    name='accessories'
                    value={formData.accessories || ''}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor='accessoriesCost' className={labelClass}>
                    Accessories Cost
                  </label>
                  <input
                    type='number'
                    name='accessoriesCost'
                    value={formData.accessoriesCost || ''}
                    onChange={handleChange}
                    className={inputClass}
                    step='0.01'
                  />
                </div>
              </div>
            </div>
            {/* Associations */}
            <div className={`pb-4 border-b ${theme === 'light' ? 'border-gray-200' : 'border-champagne-gold/10'}`}>
              <h3
                className={`text-lg font-semibold mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}
              >
                Associations
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4'>
                <div>
                  <label htmlFor='sellerContactId' className={labelClass}>
                    Seller
                  </label>
                  <select
                    name='sellerContactId'
                    id='sellerContactId'
                    value={formData.sellerContactId || ''}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value=''>None</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName || ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor='buyerContactId' className={labelClass}>
                    Buyer
                  </label>
                  <select
                    name='buyerContactId'
                    id='buyerContactId'
                    value={formData.buyerContactId || ''}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value=''>None</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName || ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {/* Sale Info */}
            <div>
              <h3
                className={`text-lg font-semibold mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}
              >
                Sale
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4'>
                <div>
                  <label htmlFor='dateSold' className={labelClass}>
                    Date Sold
                  </label>
                  <input
                    type='date'
                    name='dateSold'
                    value={formData.dateSold || ''}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor='platformSold' className={labelClass}>
                    Platform Sold
                  </label>
                  <input
                    type='text'
                    name='platformSold'
                    value={formData.platformSold || ''}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor='priceSold' className={labelClass}>
                    Price Sold
                  </label>
                  <input
                    type='number'
                    name='priceSold'
                    value={formData.priceSold || ''}
                    onChange={handleChange}
                    className={inputClass}
                    step='0.01'
                  />
                </div>
                <div>
                  <label htmlFor='fees' className={labelClass}>
                    Fees
                  </label>
                  <input
                    type='number'
                    name='fees'
                    value={formData.fees || ''}
                    onChange={handleChange}
                    className={inputClass}
                    step='0.01'
                  />
                </div>
                <div>
                  <label htmlFor='shipping' className={labelClass}>
                    Shipping
                  </label>
                  <input
                    type='number'
                    name='shipping'
                    value={formData.shipping || ''}
                    onChange={handleChange}
                    className={inputClass}
                    step='0.01'
                  />
                </div>
                <div>
                  <label htmlFor='taxes' className={labelClass}>
                    Taxes
                  </label>
                  <input
                    type='number'
                    name='taxes'
                    value={formData.taxes || ''}
                    onChange={handleChange}
                    className={inputClass}
                    step='0.01'
                  />
                </div>
              </div>
            </div>
            {/* Notes */}
            <div className={`pt-4 border-t ${theme === 'light' ? 'border-gray-200' : 'border-champagne-gold/10'}`}>
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
            Save Watch
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
};

export default WatchFormModal;
