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

  // Customer mode: 'existing' or 'manual'
  const [customerMode, setCustomerMode] = useState<'existing' | 'manual'>('existing');

  // Form state
  const [selectedContactId, setSelectedContactId] = useState<string>('');

  // Manual customer info
  const [manualCustomer, setManualCustomer] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });

  const [selectedWatches, setSelectedWatches] = useState<InvoiceWatchItem[]>([]);
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [collectionMethod, setCollectionMethod] = useState<'charge_automatically' | 'send_invoice'>(
    'charge_automatically',
  );

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

  const updateManualCustomer = (field: keyof typeof manualCustomer, value: string) => {
    setManualCustomer((prev) => ({ ...prev, [field]: value }));
  };

  const isManualCustomerValid = (): boolean => {
    return !!(manualCustomer.email && manualCustomer.firstName && manualCustomer.lastName);
  };

  const hasValidEmail = (): boolean => {
    if (customerMode === 'existing' && selectedContactId) {
      const selectedContact = contacts.find((c) => c.id === selectedContactId);
      return !!selectedContact?.email;
    }
    return !!manualCustomer.email;
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

    // Client-side validation for due date requirement
    if (collectionMethod === 'send_invoice' && !dueDate) {
      alert('If sending an invoice to the client, you must specify a due date.');
      return;
    }

    // Get selected contact if in existing mode for email validation
    const selectedContact =
      customerMode === 'existing' && selectedContactId ? contacts.find((c) => c.id === selectedContactId) : null;

    // Client-side validation for email requirement when sending invoice
    const customerEmail = customerMode === 'existing' ? selectedContact?.email : manualCustomer.email;
    if (collectionMethod === 'send_invoice' && !customerEmail) {
      alert('If sending an invoice to the client, you must specify an email address.');
      return;
    }

    setSubmitting(true);
    try {
      // Prepare customer info
      const customerInfo: any = {
        email: customerEmail,
        name:
          customerMode === 'existing'
            ? `${selectedContact?.firstName || ''} ${selectedContact?.lastName || ''}`.trim()
            : `${manualCustomer.firstName} ${manualCustomer.lastName}`.trim(),
        phone: customerMode === 'existing' ? selectedContact?.phone : manualCustomer.phone,
      };

      // Add address if provided
      if (customerMode === 'existing') {
        if (
          selectedContact?.streetAddress ||
          selectedContact?.city ||
          selectedContact?.state ||
          selectedContact?.postalCode
        ) {
          customerInfo.address = {
            line1: selectedContact.streetAddress || undefined,
            city: selectedContact.city || undefined,
            state: selectedContact.state || undefined,
            postal_code: selectedContact.postalCode || undefined,
            country: 'US', // Default since Contact doesn't have country field
          };
        }
      } else {
        if (
          manualCustomer.address ||
          manualCustomer.city ||
          manualCustomer.state ||
          manualCustomer.zipCode ||
          manualCustomer.country
        ) {
          customerInfo.address = {
            line1: manualCustomer.address || undefined,
            city: manualCustomer.city || undefined,
            state: manualCustomer.state || undefined,
            postal_code: manualCustomer.zipCode || undefined,
            country: manualCustomer.country || undefined,
          };
        }
      }

      // Prepare invoice items from selected watches
      const items = selectedWatches.map((item) => ({
        description: item.watch
          ? `${item.watch.brand} ${item.watch.model} - ${item.watch.referenceNumber}`
          : `Watch ID ${item.watchId}`,
        quantity: item.quantity,
        price: item.price,
        watch_id: item.watchId,
      }));

      const invoiceData = {
        customerInfo,
        items,
        dueDate: dueDate || undefined,
        notes: notes || '',
        taxRate: taxRate || 0,
        contactId: customerMode === 'existing' ? selectedContactId : undefined,
        existingStripeCustomerId:
          customerMode === 'existing' ? (selectedContact as any)?.stripe_customer_id : undefined,
        collectionMethod,
      };

      await onSubmit(invoiceData);

      // Reset form
      setSelectedContactId('');
      setManualCustomer({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US',
      });
      setSelectedWatches([]);
      setNotes('');
      setDueDate('');
      setTaxRate(0);
    } catch (error) {
      console.error('Error submitting invoice:', error);
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

          {/* Customer Mode Toggle */}
          <div className='mb-6'>
            <div className='flex space-x-4'>
              <button
                type='button'
                onClick={() => setCustomerMode('existing')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  customerMode === 'existing'
                    ? 'bg-champagne-gold text-rich-black font-medium'
                    : 'bg-rich-black border border-platinum-silver/20 text-platinum-silver hover:border-champagne-gold/50'
                }`}
              >
                Select Existing Customer
              </button>
              <button
                type='button'
                onClick={() => setCustomerMode('manual')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  customerMode === 'manual'
                    ? 'bg-champagne-gold text-rich-black font-medium'
                    : 'bg-rich-black border border-platinum-silver/20 text-platinum-silver hover:border-champagne-gold/50'
                }`}
              >
                Enter Customer Details
              </button>
            </div>
          </div>

          {/* Existing Customer Selection */}
          {customerMode === 'existing' && (
            <div>
              <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>Select Customer *</label>
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                required
                className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-champagne-gold [&>option]:text-black [&>option]:bg-white'
              >
                <option value=''>Choose a customer...</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.firstName} {contact.lastName} ({contact.email || 'No email'})
                  </option>
                ))}
              </select>
              {collectionMethod === 'send_invoice' && selectedContactId && !hasValidEmail() && (
                <p className='text-red-400 text-xs mt-1'>
                  Selected customer has no email address. Email is required when sending invoice to customer.
                </p>
              )}
            </div>
          )}

          {/* Manual Customer Entry */}
          {customerMode === 'manual' && (
            <div className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>First Name *</label>
                  <input
                    type='text'
                    value={manualCustomer.firstName}
                    onChange={(e) => updateManualCustomer('firstName', e.target.value)}
                    required
                    className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-champagne-gold'
                    placeholder='Enter first name'
                  />
                </div>
                <div>
                  <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>Last Name *</label>
                  <input
                    type='text'
                    value={manualCustomer.lastName}
                    onChange={(e) => updateManualCustomer('lastName', e.target.value)}
                    required
                    className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-champagne-gold'
                    placeholder='Enter last name'
                  />
                </div>
              </div>

              <div>
                <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>
                  Email Address{' '}
                  {(collectionMethod === 'send_invoice' || customerMode === 'manual') && (
                    <span className='text-red-400'>*</span>
                  )}
                </label>
                <input
                  type='email'
                  value={manualCustomer.email}
                  onChange={(e) => updateManualCustomer('email', e.target.value)}
                  required={collectionMethod === 'send_invoice' || customerMode === 'manual'}
                  className={`w-full bg-rich-black border rounded-lg px-4 py-2 text-black focus:outline-none focus:border-champagne-gold ${
                    collectionMethod === 'send_invoice' && !manualCustomer.email
                      ? 'border-red-400/50'
                      : 'border-platinum-silver/20'
                  }`}
                  placeholder='customer@example.com'
                />
                {collectionMethod === 'send_invoice' && !manualCustomer.email && (
                  <p className='text-red-400 text-xs mt-1'>Email is required when sending invoice to customer</p>
                )}
              </div>

              <div>
                <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>Phone Number</label>
                <input
                  type='tel'
                  value={manualCustomer.phone}
                  onChange={(e) => updateManualCustomer('phone', e.target.value)}
                  className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-champagne-gold'
                  placeholder='(555) 123-4567'
                />
              </div>

              <div>
                <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>Address</label>
                <input
                  type='text'
                  value={manualCustomer.address}
                  onChange={(e) => updateManualCustomer('address', e.target.value)}
                  className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-champagne-gold'
                  placeholder='123 Main Street'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>City</label>
                  <input
                    type='text'
                    value={manualCustomer.city}
                    onChange={(e) => updateManualCustomer('city', e.target.value)}
                    className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-champagne-gold'
                    placeholder='New York'
                  />
                </div>
                <div>
                  <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>State</label>
                  <input
                    type='text'
                    value={manualCustomer.state}
                    onChange={(e) => updateManualCustomer('state', e.target.value)}
                    className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-champagne-gold'
                    placeholder='NY'
                  />
                </div>
                <div>
                  <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>ZIP Code</label>
                  <input
                    type='text'
                    value={manualCustomer.zipCode}
                    onChange={(e) => updateManualCustomer('zipCode', e.target.value)}
                    className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-champagne-gold'
                    placeholder='10001'
                  />
                </div>
              </div>

              <div>
                <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>Country</label>
                <select
                  value={manualCustomer.country}
                  onChange={(e) => updateManualCustomer('country', e.target.value)}
                  className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-champagne-gold [&>option]:text-black [&>option]:bg-white'
                >
                  <option value='US'>United States</option>
                  <option value='CA'>Canada</option>
                  <option value='GB'>United Kingdom</option>
                  <option value='AU'>Australia</option>
                  <option value='DE'>Germany</option>
                  <option value='FR'>France</option>
                  <option value='IT'>Italy</option>
                  <option value='ES'>Spain</option>
                  <option value='JP'>Japan</option>
                  <option value='OTHER'>Other</option>
                </select>
              </div>
            </div>
          )}
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
                        className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-3 py-2 text-platinum-silver focus:outline-none focus:border-champagne-gold [&>option]:text-black [&>option]:bg-white'
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
              <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>
                Due Date {collectionMethod === 'send_invoice' && <span className='text-red-400'>*</span>}
              </label>
              <input
                type='date'
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required={collectionMethod === 'send_invoice'}
                className={`w-full bg-rich-black border rounded-lg px-4 py-2 text-black focus:outline-none focus:border-champagne-gold ${
                  collectionMethod === 'send_invoice' && !dueDate ? 'border-red-400/50' : 'border-platinum-silver/20'
                }`}
              />
              {collectionMethod === 'send_invoice' && !dueDate && (
                <p className='text-red-400 text-xs mt-1'>Due date is required when sending invoice to customer</p>
              )}
            </div>

            <div>
              <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>Payment Method</label>
              <select
                value={collectionMethod}
                onChange={(e) => setCollectionMethod(e.target.value as 'charge_automatically' | 'send_invoice')}
                className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-champagne-gold [&>option]:text-black [&>option]:bg-white'
              >
                <option value='charge_automatically'>Charge Immediately (Hosted Payment)</option>
                <option value='send_invoice'>Send Invoice to Customer</option>
              </select>
              <p className='text-platinum-silver/60 text-xs mt-1'>
                {collectionMethod === 'charge_automatically'
                  ? 'Customer can pay immediately via hosted payment page'
                  : 'Invoice will be emailed to customer for later payment'}
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
            <div>
              <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>Tax Rate (%)</label>
              <input
                type='number'
                min='0'
                max='100'
                step='0.01'
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-champagne-gold'
                placeholder='0.00'
              />
            </div>
          </div>

          <div className='mt-6'>
            <label className='block text-platinum-silver/80 text-sm font-medium mb-2'>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className='w-full bg-rich-black border border-platinum-silver/20 rounded-lg px-4 py-2 text-black focus:outline-none focus:border-champagne-gold resize-vertical'
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
            disabled={
              submitting ||
              selectedWatches.length === 0 ||
              (customerMode === 'existing' && !selectedContactId) ||
              (customerMode === 'manual' && !isManualCustomerValid()) ||
              (collectionMethod === 'send_invoice' && !dueDate) ||
              (collectionMethod === 'send_invoice' && !hasValidEmail())
            }
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
