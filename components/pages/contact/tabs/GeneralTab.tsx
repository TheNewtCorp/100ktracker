import React from 'react';
import { Contact, ContactType } from '../../../../types';
import { useTheme } from '../../../../hooks/useTheme';

interface GeneralTabProps {
  formData: Omit<Contact, 'id' | 'watchAssociations' | 'cards'>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  error: string;
}

const GeneralTab: React.FC<GeneralTabProps> = ({ formData, onChange, error }) => {
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
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
            onChange={onChange}
            rows={3}
            className={inputClass}
          ></textarea>
        </div>
      </div>
      {error && <p className='text-sm text-crimson-red'>{error}</p>}
    </div>
  );
};

export default GeneralTab;
