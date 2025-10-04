import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Lead, LeadStatus, Contact } from '../../../types';
import { useTheme } from '../../../hooks/useTheme';

interface LeadFormModalProps {
  onClose: () => void;
  onSave: (lead: Omit<Lead, 'id'> | Lead) => void;
  lead: Lead | null;
  contacts: Contact[];
}

const initialLeadState: Omit<Lead, 'id'> = {
  title: '',
  status: LeadStatus.Monitoring,
  contactId: null,
  watchReference: '',
  notes: '',
  reminderDate: '',
};

const LeadFormModal: React.FC<LeadFormModalProps> = ({ onClose, onSave, lead, contacts }) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState(lead || initialLeadState);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(lead ? { ...initialLeadState, ...lead } : initialLeadState);
  }, [lead]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'contactId') {
      setFormData((prev) => ({ ...prev, [name]: value || null }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Title is required.');
      return;
    }
    setError('');
    onSave(formData);
  };

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
        className={`rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col ${
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
            {lead ? 'Edit Lead' : 'Create New Lead'}
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
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label htmlFor='title' className={labelClass}>
                Title <span className='text-crimson-red'>*</span>
              </label>
              <input
                type='text'
                name='title'
                id='title'
                value={formData.title}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label htmlFor='status' className={labelClass}>
                  Status
                </label>
                <select
                  name='status'
                  id='status'
                  value={formData.status}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {Object.values(LeadStatus).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor='contactId' className={labelClass}>
                  Associated Contact
                </label>
                <select
                  name='contactId'
                  id='contactId'
                  value={formData.contactId || ''}
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

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label htmlFor='watchReference' className={labelClass}>
                  Watch Reference #
                </label>
                <input
                  type='text'
                  name='watchReference'
                  id='watchReference'
                  value={formData.watchReference || ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor='reminderDate' className={labelClass}>
                  Reminder Date
                </label>
                <input
                  type='date'
                  name='reminderDate'
                  id='reminderDate'
                  value={formData.reminderDate || ''}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor='notes' className={labelClass}>
                Notes
              </label>
              <textarea
                name='notes'
                id='notes'
                value={formData.notes || ''}
                onChange={handleChange}
                rows={5}
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
            Save Lead
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
};

export default LeadFormModal;
