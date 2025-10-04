import React from 'react';
import { Invoice, InvoiceStatus } from '../../../types';
import { useTheme } from '../../../hooks/useTheme';

interface InvoiceListProps {
  invoices: Invoice[];
  loading: boolean;
  onCreateNew: () => void;
  onViewDetails: (invoice: Invoice) => void;
  onSend: (invoiceId: number) => Promise<void>;
  onVoid: (invoiceId: number) => Promise<void>;
  error: string | null;
}

const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  loading,
  onCreateNew,
  onViewDetails,
  onSend,
  onVoid,
  error,
}) => {
  const { theme } = useTheme();

  const getStatusColor = (status: InvoiceStatus): string => {
    if (theme === 'light') {
      switch (status) {
        case InvoiceStatus.Paid:
          return 'text-green-700 bg-green-100';
        case InvoiceStatus.Open:
          return 'text-yellow-700 bg-yellow-100';
        case InvoiceStatus.Void:
          return 'text-red-700 bg-red-100';
        case InvoiceStatus.Draft:
          return 'text-blue-700 bg-blue-100';
        case InvoiceStatus.Uncollectible:
          return 'text-gray-700 bg-gray-100';
        default:
          return 'text-gray-600 bg-gray-100';
      }
    } else {
      switch (status) {
        case InvoiceStatus.Paid:
          return 'text-green-400 bg-green-900/20';
        case InvoiceStatus.Open:
          return 'text-yellow-400 bg-yellow-900/20';
        case InvoiceStatus.Void:
          return 'text-red-400 bg-red-900/20';
        case InvoiceStatus.Draft:
          return 'text-blue-400 bg-blue-900/20';
        case InvoiceStatus.Uncollectible:
          return 'text-gray-400 bg-gray-900/20';
        default:
          return 'text-platinum-silver/60 bg-platinum-silver/10';
      }
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleActionClick = async (action: 'send' | 'void', invoiceId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (action === 'send') {
        await onSend(invoiceId);
      } else {
        await onVoid(invoiceId);
      }
    } catch (error) {
      // Error handling is managed by parent component
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className={theme === 'light' ? 'text-gray-500' : 'text-platinum-silver/60'}>Loading invoices...</div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header with Create Button */}
      <div className='flex justify-between items-center'>
        <div>
          <h2 className={`text-xl font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
            All Invoices
          </h2>
          <p className={`text-sm mt-1 ${theme === 'light' ? 'text-gray-600' : 'text-platinum-silver/60'}`}>
            {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <button
          onClick={onCreateNew}
          className={`font-medium px-4 py-2 rounded-lg transition-colors ${
            theme === 'light'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-champagne-gold hover:bg-champagne-gold/80 text-rich-black'
          }`}
        >
          Create Invoice
        </button>
      </div>

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <div className='text-center py-12'>
          <div className={`mb-4 ${theme === 'light' ? 'text-gray-400' : 'text-platinum-silver/40'}`}>
            No invoices found
          </div>
          <button
            onClick={onCreateNew}
            className={`transition-colors ${
              theme === 'light'
                ? 'text-blue-600 hover:text-blue-700'
                : 'text-champagne-gold hover:text-champagne-gold/80'
            }`}
          >
            Create your first invoice
          </button>
        </div>
      ) : (
        <div
          className={`rounded-lg overflow-hidden ${
            theme === 'light' ? 'bg-white border border-gray-200' : 'bg-rich-black/60'
          }`}
        >
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead
                className={`border-b ${
                  theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-rich-black/40 border-platinum-silver/10'
                }`}
              >
                <tr>
                  <th
                    className={`text-left py-3 px-4 font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-platinum-silver/80'
                    }`}
                  >
                    Customer
                  </th>
                  <th
                    className={`text-left py-3 px-4 font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-platinum-silver/80'
                    }`}
                  >
                    Status
                  </th>
                  <th
                    className={`text-right py-3 px-4 font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-platinum-silver/80'
                    }`}
                  >
                    Amount
                  </th>
                  <th
                    className={`text-left py-3 px-4 font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-platinum-silver/80'
                    }`}
                  >
                    Created
                  </th>
                  <th
                    className={`text-left py-3 px-4 font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-platinum-silver/80'
                    }`}
                  >
                    Due Date
                  </th>
                  <th
                    className={`text-center py-3 px-4 font-medium ${
                      theme === 'light' ? 'text-gray-700' : 'text-platinum-silver/80'
                    }`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={() => onViewDetails(invoice)}
                    className={`border-b cursor-pointer transition-colors ${
                      theme === 'light'
                        ? 'border-gray-200 hover:bg-gray-50'
                        : 'border-platinum-silver/5 hover:bg-platinum-silver/5'
                    }`}
                  >
                    <td className='py-3 px-4'>
                      <div>
                        <div className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
                          {invoice.contact_name || 'Unknown Customer'}
                        </div>
                        <div className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-platinum-silver/60'}`}>
                          {invoice.contact_email}
                        </div>
                      </div>
                    </td>
                    <td className='py-3 px-4'>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-4 text-right font-mono ${
                        theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'
                      }`}
                    >
                      {formatCurrency(invoice.total_amount, invoice.currency)}
                    </td>
                    <td className={`py-3 px-4 ${theme === 'light' ? 'text-gray-700' : 'text-platinum-silver/80'}`}>
                      {formatDate(invoice.created_at)}
                    </td>
                    <td className={`py-3 px-4 ${theme === 'light' ? 'text-gray-700' : 'text-platinum-silver/80'}`}>
                      {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                    </td>
                    <td className='py-3 px-4'>
                      <div className='flex justify-center space-x-2'>
                        {(invoice.status === InvoiceStatus.Draft || invoice.status === InvoiceStatus.Open) && (
                          <button
                            onClick={(e) => handleActionClick('send', invoice.id, e)}
                            className={`text-sm transition-colors ${
                              theme === 'light'
                                ? 'text-blue-600 hover:text-blue-700'
                                : 'text-blue-400 hover:text-blue-300'
                            }`}
                            title='Send Invoice'
                          >
                            Send
                          </button>
                        )}
                        {(invoice.status === InvoiceStatus.Draft || invoice.status === InvoiceStatus.Open) && (
                          <button
                            onClick={(e) => handleActionClick('void', invoice.id, e)}
                            className={`text-sm transition-colors ${
                              theme === 'light' ? 'text-red-600 hover:text-red-700' : 'text-red-400 hover:text-red-300'
                            }`}
                            title='Void Invoice'
                          >
                            Void
                          </button>
                        )}
                        {(invoice.status === InvoiceStatus.Paid || invoice.status === InvoiceStatus.Void) && (
                          <span
                            className={`text-sm ${theme === 'light' ? 'text-gray-400' : 'text-platinum-silver/40'}`}
                          >
                            -
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
