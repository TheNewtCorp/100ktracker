import React, { useState, useEffect } from 'react';
import InvoiceCreator from './payments/InvoiceCreator';
import InvoiceList from './payments/InvoiceList';
import InvoiceDetails from './payments/InvoiceDetails';
import InvoiceStatusTracker from '../payments/InvoiceStatusTracker';
import { Invoice, InvoiceItem, InvoiceStatus } from '../../types';
import { apiService } from '../../services/apiService';
import { useTheme } from '../../hooks/useTheme';

interface PaymentsPageProps {}

const PaymentsPage: React.FC<PaymentsPageProps> = () => {
  const { theme } = useTheme();
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
      const response = await apiService.post('/invoices', invoiceData);
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

  const handleStatusUpdate = async (invoiceId: number, newStatus: InvoiceStatus) => {
    try {
      setError(null);
      await apiService.put(`/invoices/${invoiceId}/status`, { status: newStatus });
      await loadInvoices(); // Reload to get updated status

      // If viewing details of this invoice, update the selected invoice too
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err: any) {
      console.error('Error updating invoice status:', err);
      setError(err.message || 'Failed to update invoice status');
      throw err;
    }
  };

  const handleNotesUpdate = async (invoiceId: number, notes: string) => {
    try {
      setError(null);
      // Use the current status with new notes
      const currentStatus = selectedInvoice?.status || InvoiceStatus.Created;
      await apiService.put(`/invoices/${invoiceId}/status`, { status: currentStatus, notes });
      await loadInvoices(); // Reload to get updated invoice

      // If viewing details of this invoice, update the selected invoice too
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice((prev) => (prev ? { ...prev, notes } : null));
      }
    } catch (err: any) {
      console.error('Error updating invoice notes:', err);
      setError(err.message || 'Failed to update invoice notes');
      throw err;
    }
  };

  const handleVoidInvoice = async (invoiceId: number) => {
    try {
      setError(null);
      await apiService.delete(`/invoices/${invoiceId}`);
      await loadInvoices(); // Reload to get updated status

      // If viewing details of this invoice, go back to list since it's voided
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setCurrentView('list');
        setSelectedInvoice(null);
      }
    } catch (err: any) {
      console.error('Error voiding invoice:', err);
      setError(err.message || 'Failed to void invoice');
      throw err;
    }
  };

  const handlePaymentSuccess = async (invoiceId: number, paymentId: string) => {
    try {
      setError(null);
      // Update the invoice status to fulfilled and record payment info
      await apiService.post(`/invoices/${invoiceId}/payment`, {
        payment_id: paymentId,
        status: InvoiceStatus.Fulfilled,
      });
      await loadInvoices(); // Reload to get updated status

      // If viewing details of this invoice, update the selected invoice too
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice((prev) =>
          prev
            ? {
                ...prev,
                status: InvoiceStatus.Fulfilled,
                payment_id: paymentId,
              }
            : null,
        );
      }
    } catch (err: any) {
      console.error('Error recording payment:', err);
      setError(err.message || 'Failed to record payment');
      throw err;
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'create':
        return <InvoiceCreator onCancel={() => setCurrentView('list')} onSubmit={handleCreateInvoice} error={error} />;

      case 'details':
        return selectedInvoice ? (
          <div className='space-y-6'>
            <InvoiceDetails
              invoice={selectedInvoice}
              onBack={() => setCurrentView('list')}
              onVoid={handleVoidInvoice}
              error={error}
            />
            <InvoiceStatusTracker
              invoice={selectedInvoice}
              onStatusUpdate={(newStatus: InvoiceStatus, notes?: string) =>
                handleStatusUpdate(selectedInvoice.id, newStatus)
              }
              onNotesUpdate={(notes: string) => handleNotesUpdate(selectedInvoice.id, notes)}
            />
          </div>
        ) : (
          <div className={theme === 'light' ? 'text-gray-500' : 'text-platinum-silver/60'}>Invoice not found</div>
        );

      case 'list':
      default:
        return (
          <InvoiceList
            invoices={invoices}
            loading={loading}
            onCreateNew={() => setCurrentView('create')}
            onViewDetails={handleViewDetails}
            onStatusUpdate={handleStatusUpdate}
            onPaymentSuccess={handlePaymentSuccess}
            error={error}
          />
        );
    }
  };

  return (
    <div className='max-w-7xl mx-auto'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className={`text-2xl font-bold mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
          Invoice Management
        </h1>
        <p className={theme === 'light' ? 'text-gray-600' : 'text-platinum-silver/80'}>
          Create professional invoices with PDF generation and Square payment integration.
        </p>
      </div>

      {/* Error Display */}
      {error && currentView !== 'create' && currentView !== 'details' && (
        <div
          className={`mb-4 p-4 border rounded-lg ${
            theme === 'light' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-900/20 border-red-500/30 text-red-400'
          }`}
        >
          <p>{error}</p>
        </div>
      )}

      {/* Main Content */}
      {renderView()}
    </div>
  );
};

export default PaymentsPage;
