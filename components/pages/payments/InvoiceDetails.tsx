import React, { useState } from 'react';
import { Invoice, InvoiceStatus } from '../../../types';
import { useTheme } from '../../../hooks/useTheme';

interface InvoiceDetailsProps {
  invoice: Invoice;
  onBack: () => void;
  onVoid: (invoiceId: number) => Promise<void>;
  error: string | null;
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ invoice, onBack, onVoid, error }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: InvoiceStatus): string => {
    switch (status) {
      case InvoiceStatus.Fulfilled:
        return isDark
          ? 'text-green-400 bg-green-900/20 border-green-500/30'
          : 'text-green-700 bg-green-100 border-green-300';
      case InvoiceStatus.Sent:
        return isDark
          ? 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30'
          : 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case InvoiceStatus.Cancelled:
        return isDark ? 'text-red-400 bg-red-900/20 border-red-500/30' : 'text-red-700 bg-red-100 border-red-300';
      case InvoiceStatus.Created:
        return isDark ? 'text-blue-400 bg-blue-900/20 border-blue-500/30' : 'text-blue-700 bg-blue-100 border-blue-300';
      case InvoiceStatus.Overdue:
        return isDark ? 'text-red-400 bg-red-900/20 border-red-500/30' : 'text-red-600 bg-red-100 border-red-300';
      default:
        return isDark
          ? 'text-platinum-silver/60 bg-platinum-silver/10 border-platinum-silver/20'
          : 'text-gray-500 bg-gray-100 border-gray-300';
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
      month: 'long',
      day: 'numeric',
    });
  };

  const handleAction = async (action: 'void') => {
    try {
      setLoading(true);
      await onVoid(invoice.id);
    } catch (err) {
      // Error handling managed by parent
    } finally {
      setLoading(false);
    }
  };

  const canVoid = invoice.status === InvoiceStatus.Created || invoice.status === InvoiceStatus.Sent;

  return (
    <div className='max-w-4xl mx-auto'>
      <div className='mb-6'>
        <button
          onClick={onBack}
          className={
            isDark
              ? 'text-platinum-silver/60 hover:text-platinum-silver transition-colors mb-4'
              : 'text-gray-500 hover:text-gray-700 transition-colors mb-4'
          }
        >
          ← Back to Invoices
        </button>
        <div className='flex justify-between items-start'>
          <div>
            <h2 className={`text-2xl font-semibold ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
              Invoice Details
            </h2>
            <p className={`mt-1 ${isDark ? 'text-platinum-silver/60' : 'text-gray-600'}`}>
              Invoice #{invoice.id} • Created {formatDate(invoice.created_at)}
            </p>
          </div>
          <div className='flex space-x-3'>
            {canVoid && (
              <button
                onClick={() => handleAction('void')}
                disabled={loading}
                className={
                  isDark
                    ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-medium px-4 py-2 rounded-lg transition-colors'
                    : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium px-4 py-2 rounded-lg transition-colors'
                }
              >
                {loading ? 'Voiding...' : 'Void Invoice'}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div
          className={`mb-6 p-4 rounded-lg border ${isDark ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'}`}
        >
          <p className={isDark ? 'text-red-400' : 'text-red-700'}>{error}</p>
        </div>
      )}

      <div className='space-y-6'>
        {/* Invoice Header */}
        <div className={`rounded-lg p-6 ${isDark ? 'bg-rich-black/60' : 'bg-gray-50 border border-gray-200'}`}>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                Customer Information
              </h3>
              <div className={`space-y-2 ${isDark ? 'text-platinum-silver/80' : 'text-gray-600'}`}>
                <div>
                  <span className={`font-medium ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                    {invoice.contact_name || 'Unknown Customer'}
                  </span>
                </div>
                {invoice.contact_email && <div>{invoice.contact_email}</div>}
              </div>
            </div>

            <div>
              <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                Invoice Status
              </h3>
              <div className='space-y-2'>
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(invoice.status)}`}
                  >
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </div>
                {invoice.due_date && (
                  <div className={`text-sm ${isDark ? 'text-platinum-silver/80' : 'text-gray-600'}`}>
                    Due: {formatDate(invoice.due_date)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        {invoice.items && invoice.items.length > 0 && (
          <div className={`rounded-lg p-6 ${isDark ? 'bg-rich-black/60' : 'bg-gray-50 border border-gray-200'}`}>
            <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>Items</h3>

            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className={`border-b ${isDark ? 'border-platinum-silver/10' : 'border-gray-200'}`}>
                  <tr>
                    <th
                      className={`text-left py-2 font-medium ${isDark ? 'text-platinum-silver/80' : 'text-gray-700'}`}
                    >
                      Description
                    </th>
                    <th
                      className={`text-center py-2 font-medium ${isDark ? 'text-platinum-silver/80' : 'text-gray-700'}`}
                    >
                      Qty
                    </th>
                    <th
                      className={`text-right py-2 font-medium ${isDark ? 'text-platinum-silver/80' : 'text-gray-700'}`}
                    >
                      Unit Price
                    </th>
                    <th
                      className={`text-right py-2 font-medium ${isDark ? 'text-platinum-silver/80' : 'text-gray-700'}`}
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className={`border-b ${isDark ? 'border-platinum-silver/5' : 'border-gray-100'}`}>
                      <td className={`py-3 ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                        {item.description}
                      </td>
                      <td className={`py-3 text-center ${isDark ? 'text-platinum-silver/80' : 'text-gray-600'}`}>
                        {item.quantity}
                      </td>
                      <td
                        className={`py-3 text-right font-mono ${isDark ? 'text-platinum-silver/80' : 'text-gray-600'}`}
                      >
                        {formatCurrency(item.unit_price, invoice.currency)}
                      </td>
                      <td className={`py-3 text-right font-mono ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                        {formatCurrency(item.total_amount, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice Total */}
            <div className={`border-t mt-4 pt-4 ${isDark ? 'border-platinum-silver/20' : 'border-gray-200'}`}>
              <div className='flex justify-end'>
                <div className='text-right space-y-1'>
                  <div className={`text-xl font-semibold ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                    Total: <span className='font-mono'>{formatCurrency(invoice.total_amount, invoice.currency)}</span>
                  </div>
                  <div className={`text-sm ${isDark ? 'text-platinum-silver/60' : 'text-gray-600'}`}>
                    {invoice.currency.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Notes */}
        {invoice.notes && (
          <div className={`rounded-lg p-6 ${isDark ? 'bg-rich-black/60' : 'bg-gray-50 border border-gray-200'}`}>
            <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>Notes</h3>
            <div className={`whitespace-pre-wrap ${isDark ? 'text-platinum-silver/80' : 'text-gray-600'}`}>
              {invoice.notes}
            </div>
          </div>
        )}

        {/* Payment Information */}
        {(invoice.payment_processor || invoice.payment_id || invoice.stripe_invoice_id) && (
          <div className={`rounded-lg p-6 ${isDark ? 'bg-rich-black/60' : 'bg-gray-50 border border-gray-200'}`}>
            <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
              Payment Information
            </h3>

            <div className='space-y-3'>
              {invoice.payment_processor && (
                <div>
                  <span className={isDark ? 'text-platinum-silver/80' : 'text-gray-600'}>Payment Processor:</span>
                  <br />
                  <span className={`capitalize ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                    {invoice.payment_processor}
                  </span>
                </div>
              )}

              {invoice.payment_id && (
                <div>
                  <span className={isDark ? 'text-platinum-silver/80' : 'text-gray-600'}>Payment ID:</span>
                  <br />
                  <span className={`font-mono text-sm ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                    {invoice.payment_id}
                  </span>
                </div>
              )}

              {invoice.stripe_invoice_id && (
                <div
                  className={`text-xs pt-2 border-t ${isDark ? 'text-platinum-silver/60 border-platinum-silver/10' : 'text-gray-500 border-gray-200'}`}
                >
                  Legacy Stripe Invoice ID: {invoice.stripe_invoice_id}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetails;
