import React, { useState, useEffect } from 'react';
import InvoiceCreator from './payments/InvoiceCreator';
import InvoiceList from './payments/InvoiceList';
import InvoiceDetails from './payments/InvoiceDetails';
import { Invoice, InvoiceItem } from '../../types';
import { apiService } from '../../services/apiService';

interface PaymentsPageProps {}

const PaymentsPage: React.FC<PaymentsPageProps> = () => {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'details'>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load invoices on component mount
  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get('/invoices');
      setInvoices(response.invoices || []);
    } catch (err: any) {
      console.error('Error loading invoices:', err);
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (invoiceData: any) => {
    try {
      setError(null);
      const response = await apiService.post('/invoices/create', invoiceData);
      await loadInvoices(); // Reload the list
      setCurrentView('list');
      return response;
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      setError(err.message || 'Failed to create invoice');
      throw err;
    }
  };

  const handleViewDetails = async (invoice: Invoice) => {
    try {
      setError(null);
      const response = await apiService.get(`/invoices/${invoice.id}`);
      setSelectedInvoice({
        ...response.invoice,
        items: response.items || [],
      });
      setCurrentView('details');
    } catch (err: any) {
      console.error('Error loading invoice details:', err);
      setError(err.message || 'Failed to load invoice details');
    }
  };

  const handleSendInvoice = async (invoiceId: number) => {
    try {
      setError(null);
      await apiService.post(`/invoices/${invoiceId}/send`);
      await loadInvoices(); // Reload to get updated status
    } catch (err: any) {
      console.error('Error sending invoice:', err);
      setError(err.message || 'Failed to send invoice');
      throw err;
    }
  };

  const handleVoidInvoice = async (invoiceId: number) => {
    try {
      setError(null);
      await apiService.post(`/invoices/${invoiceId}/void`);
      await loadInvoices(); // Reload to get updated status
    } catch (err: any) {
      console.error('Error voiding invoice:', err);
      setError(err.message || 'Failed to void invoice');
      throw err;
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'create':
        return <InvoiceCreator onCancel={() => setCurrentView('list')} onSubmit={handleCreateInvoice} error={error} />;

      case 'details':
        return selectedInvoice ? (
          <InvoiceDetails
            invoice={selectedInvoice}
            onBack={() => setCurrentView('list')}
            onSend={handleSendInvoice}
            onVoid={handleVoidInvoice}
            error={error}
          />
        ) : (
          <div className='text-platinum-silver/60'>Invoice not found</div>
        );

      case 'list':
      default:
        return (
          <InvoiceList
            invoices={invoices}
            loading={loading}
            onCreateNew={() => setCurrentView('create')}
            onViewDetails={handleViewDetails}
            onSend={handleSendInvoice}
            onVoid={handleVoidInvoice}
            error={error}
          />
        );
    }
  };

  return (
    <div className='max-w-7xl mx-auto'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-platinum-silver mb-2'>Invoice Management</h1>
        <p className='text-platinum-silver/80'>Create and manage customer invoices using Stripe integration.</p>
      </div>

      {/* Error Display */}
      {error && currentView !== 'create' && currentView !== 'details' && (
        <div className='mb-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg'>
          <p className='text-red-400'>{error}</p>
        </div>
      )}

      {/* Main Content */}
      {renderView()}
    </div>
  );
};

export default PaymentsPage;
