import React, { useState, useEffect } from 'react';
import { Contact, Watch } from '../../../types';
import { apiService } from '../../../services/apiService';

interface InvoiceCreatorProps {
  onCancel: () => void;
  onSubmit: (invoiceData: any) => Promise<any>;
  error: string | null;
}

interface InvoiceWatchItem {
  watchId: number;
  watch?: Watch;
  quantity: number;
  price: number;
}

const InvoiceCreator: React.FC<InvoiceCreatorProps> = ({ onCancel, onSubmit, error }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Form state
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [selectedWatches, setSelectedWatches] = useState<InvoiceWatchItem[]>([]);
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadingError(null);

      const [contactsResponse, watchesResponse] = await Promise.all([
        apiService.getContacts({ limit: 1000 }),
        apiService.getWatches({ limit: 1000, status: 'unsold' }),
      ]);

      setContacts(contactsResponse.contacts || []);
      setWatches(watchesResponse.watches || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setLoadingError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const addWatch = () => {
    setSelectedWatches([
      ...selectedWatches,
      {
        watchId: 0,
        quantity: 1,
        price: 0,
      },
    ]);
  };

  const removeWatch = (index: number) => {
    setSelectedWatches(selectedWatches.filter((_, i) => i !== index));
  };

  const updateWatchItem = (index: number, field: keyof InvoiceWatchItem, value: any) => {
    const updated = [...selectedWatches];
    updated[index] = { ...updated[index], [field]: value };

    // If watchId changed, find and set the watch object and default price
    if (field === 'watchId') {
      const watch = watches.find((w) => w.id === value.toString());
      updated[index].watch = watch;
      if (watch && watch.purchasePrice) {
        updated[index].price = watch.purchasePrice;
      }
    }

    setSelectedWatches(updated);
  };

  const calculateSubtotal = (): number => {
    return selectedWatches.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateTax = (): number => {
    return calculateSubtotal() * (taxRate / 100);
  };

  const calculateTotal = (): number => {
    return calculateSubtotal() + calculateTax();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedContactId) {
      alert('Please select a customer');
      return;
    }

    if (selectedWatches.length === 0) {
      alert('Please add at least one watch');
      return;
    }

    if (selectedWatches.some((w) => !w.watchId || w.price <= 0)) {
      alert('Please select valid watches with prices');
      return;
    }

    try {
      setSubmitting(true);

      const invoiceData = {
        contactId: parseInt(selectedContactId),
        watches: selectedWatches.map((w) => ({
          watchId: parseInt(w.watchId.toString()),
          quantity: w.quantity,
          price: w.price,
        })),
        notes: notes.trim() || undefined,
        dueDate: dueDate || undefined,
        taxRate: taxRate > 0 ? taxRate : undefined,
      };

      await onSubmit(invoiceData);
    } catch (err) {
      // Error handling is managed by parent
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-platinum-silver/60'>Loading form data...</div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className='text-center py-12'>
        <div className='text-red-400 mb-4'>{loadingError}</div>
        <button onClick={loadData} className='text-champagne-gold hover:text-champagne-gold/80 transition-colors'>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto'>
      <div className='mb-6'>
        <button
          onClick={onCancel}
          className='text-platinum-silver/60 hover:text-platinum-silver transition-colors mb-4'
        >
          ← Back to Invoices
        </button>
        <h2 className='text-2xl font-semibold text-platinum-silver'>Create New Invoice</h2>
      </div>

      {error && (
        <div className='mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg'>
          <p className='text-red-400'>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Customer Selection */}
        <div className='bg-rich-black/60 rounded-lg p-6'>
          <h3 className='text-lg font-medium text-platinum-silver mb-4'>Customer Information</h3>
          <div>
            <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>Select Customer *</label>
            <select
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              required
              className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-4 py-2 text-platinum-silver focus:outline-none focus:border-champagne-gold'
            >
              <option value=''>Choose a customer...</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.firstName} {contact.lastName} ({contact.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Watch Selection */}
        <div className='bg-rich-black/60 rounded-lg p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h3 className='text-lg font-medium text-platinum-silver'>Invoice Items</h3>
            <button
              type='button'
              onClick={addWatch}
              className='bg-champagne-gold hover:bg-champagne-gold/80 text-rich-black font-medium px-4 py-2 rounded-lg transition-colors'
            >
              Add Watch
            </button>
          </div>

          {selectedWatches.length === 0 ? (
            <div className='text-platinum-silver/60 text-center py-8'>
              No watches added. Click "Add Watch" to get started.
            </div>
          ) : (
            <div className='space-y-4'>
              {selectedWatches.map((item, index) => (
                <div key={index} className='bg-rich-black/40 rounded-lg p-4 border border-platinum-silver/10'>
                  <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                    <div className='md:col-span-2'>
                      <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>Watch *</label>
                      <select
                        value={item.watchId}
                        onChange={(e) => updateWatchItem(index, 'watchId', parseInt(e.target.value))}
                        required
                        className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-3 py-2 text-platinum-silver focus:outline-none focus:border-champagne-gold'
                      >
                        <option value={0}>Select a watch...</option>
                        {watches.map((watch) => (
                          <option key={watch.id} value={watch.id}>
                            {watch.brand} {watch.model} - {watch.referenceNumber}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>Quantity *</label>
                      <input
                        type='number'
                        min='1'
                        value={item.quantity}
                        onChange={(e) => updateWatchItem(index, 'quantity', parseInt(e.target.value))}
                        required
                        className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-3 py-2 text-platinum-silver focus:outline-none focus:border-champagne-gold'
                      />
                    </div>

                    <div>
                      <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>Price *</label>
                      <div className='flex'>
                        <input
                          type='number'
                          min='0'
                          step='0.01'
                          value={item.price}
                          onChange={(e) => updateWatchItem(index, 'price', parseFloat(e.target.value) || 0)}
                          required
                          className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-3 py-2 text-platinum-silver focus:outline-none focus:border-champagne-gold'
                        />
                        <button
                          type='button'
                          onClick={() => removeWatch(index)}
                          className='ml-2 text-red-400 hover:text-red-300 transition-colors p-2'
                          title='Remove watch'
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invoice Details */}
        <div className='bg-rich-black/60 rounded-lg p-6'>
          <h3 className='text-lg font-medium text-platinum-silver mb-4'>Invoice Details</h3>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>Due Date</label>
              <input
                type='date'
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-4 py-2 text-platinum-silver focus:outline-none focus:border-champagne-gold'
              />
            </div>

            <div>
              <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>Tax Rate (%)</label>
              <input
                type='number'
                min='0'
                max='100'
                step='0.01'
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-4 py-2 text-platinum-silver focus:outline-none focus:border-champagne-gold'
              />
            </div>
          </div>

          <div className='mt-6'>
            <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-4 py-2 text-platinum-silver focus:outline-none focus:border-champagne-gold resize-vertical'
              placeholder='Add any additional notes or terms...'
            />
          </div>
        </div>

        {/* Invoice Summary */}
        {selectedWatches.length > 0 && (
          <div className='bg-rich-black/60 rounded-lg p-6'>
            <h3 className='text-lg font-medium text-platinum-silver mb-4'>Invoice Summary</h3>

            <div className='space-y-2 text-platinum-silver'>
              <div className='flex justify-between'>
                <span>Subtotal:</span>
                <span className='font-mono'>${calculateSubtotal().toFixed(2)}</span>
              </div>

              {taxRate > 0 && (
                <div className='flex justify-between'>
                  <span>Tax ({taxRate}%):</span>
                  <span className='font-mono'>${calculateTax().toFixed(2)}</span>
                </div>
              )}

              <div className='border-t border-platinum-silver/20 pt-2 mt-2'>
                <div className='flex justify-between text-lg font-semibold'>
                  <span>Total:</span>
                  <span className='font-mono'>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className='flex justify-end space-x-4 pt-6'>
          <button
            type='button'
            onClick={onCancel}
            disabled={submitting}
            className='px-6 py-2 text-platinum-silver/80 hover:text-platinum-silver transition-colors disabled:opacity-50'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={submitting || selectedWatches.length === 0}
            className='bg-champagne-gold hover:bg-champagne-gold/80 disabled:bg-champagne-gold/50 text-rich-black font-medium px-6 py-2 rounded-lg transition-colors'
          >
            {submitting ? 'Creating Invoice...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceCreator;
