import React, { useState } from 'react';
import { Invoice, InvoiceStatus } from '../../../types';

interface InvoiceDetailsProps {
  invoice: Invoice;
  onBack: () => void;
  onSend: (invoiceId: number) => Promise<void>;
  onVoid: (invoiceId: number) => Promise<void>;
  error: string | null;
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({ invoice, onBack, onSend, onVoid, error }) => {
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: InvoiceStatus): string => {
    switch (status) {
      case InvoiceStatus.Paid:
        return 'text-green-400 bg-green-900/20 border-green-500/30';
      case InvoiceStatus.Open:
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case InvoiceStatus.Void:
        return 'text-red-400 bg-red-900/20 border-red-500/30';
      case InvoiceStatus.Draft:
        return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      case InvoiceStatus.Uncollectible:
        return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
      default:
        return 'text-platinum-silver/60 bg-platinum-silver/10 border-platinum-silver/20';
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

  const handleAction = async (action: 'send' | 'void') => {
    try {
      setLoading(true);
      if (action === 'send') {
        await onSend(invoice.id);
      } else {
        await onVoid(invoice.id);
      }
    } catch (err) {
      // Error handling managed by parent
    } finally {
      setLoading(false);
    }
  };

  const canSend = invoice.status === InvoiceStatus.Draft || invoice.status === InvoiceStatus.Open;
  const canVoid = invoice.status === InvoiceStatus.Draft || invoice.status === InvoiceStatus.Open;

  return (
    <div className='max-w-4xl mx-auto'>
      <div className='mb-6'>
        <button onClick={onBack} className='text-platinum-silver/60 hover:text-platinum-silver transition-colors mb-4'>
          ← Back to Invoices
        </button>
        <div className='flex justify-between items-start'>
          <div>
            <h2 className='text-2xl font-semibold text-platinum-silver'>Invoice Details</h2>
            <p className='text-platinum-silver/60 mt-1'>
              Invoice #{invoice.id} • Created {formatDate(invoice.created_at)}
            </p>
          </div>
          <div className='flex space-x-3'>
            {canSend && (
              <button
                onClick={() => handleAction('send')}
                disabled={loading}
                className='bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-medium px-4 py-2 rounded-lg transition-colors'
              >
                {loading ? 'Sending...' : 'Send Invoice'}
              </button>
            )}
            {canVoid && (
              <button
                onClick={() => handleAction('void')}
                disabled={loading}
                className='bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-medium px-4 py-2 rounded-lg transition-colors'
              >
                {loading ? 'Voiding...' : 'Void Invoice'}
              </button>
            )}
            {invoice.stripe_details?.hosted_invoice_url && (
              <a
                href={invoice.stripe_details.hosted_invoice_url}
                target='_blank'
                rel='noopener noreferrer'
                className='bg-champagne-gold hover:bg-champagne-gold/80 text-rich-black font-medium px-4 py-2 rounded-lg transition-colors'
              >
                View in Stripe
              </a>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className='mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg'>
          <p className='text-red-400'>{error}</p>
        </div>
      )}

      <div className='space-y-6'>
        {/* Invoice Header */}
        <div className='bg-rich-black/60 rounded-lg p-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <h3 className='text-lg font-medium text-platinum-silver mb-4'>Customer Information</h3>
              <div className='space-y-2 text-platinum-silver/80'>
                <div>
                  <span className='font-medium text-platinum-silver'>{invoice.contact_name || 'Unknown Customer'}</span>
                </div>
                {invoice.contact_email && <div>{invoice.contact_email}</div>}
              </div>
            </div>

            <div>
              <h3 className='text-lg font-medium text-platinum-silver mb-4'>Invoice Status</h3>
              <div className='space-y-2'>
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(invoice.status)}`}
                  >
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </div>
                {invoice.due_date && (
                  <div className='text-platinum-silver/80 text-sm'>Due: {formatDate(invoice.due_date)}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        {invoice.items && invoice.items.length > 0 && (
          <div className='bg-rich-black/60 rounded-lg p-6'>
            <h3 className='text-lg font-medium text-platinum-silver mb-4'>Items</h3>

            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='border-b border-platinum-silver/10'>
                  <tr>
                    <th className='text-left py-2 text-platinum-silver/80 font-medium'>Description</th>
                    <th className='text-center py-2 text-platinum-silver/80 font-medium'>Qty</th>
                    <th className='text-right py-2 text-platinum-silver/80 font-medium'>Unit Price</th>
                    <th className='text-right py-2 text-platinum-silver/80 font-medium'>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className='border-b border-platinum-silver/5'>
                      <td className='py-3 text-platinum-silver'>{item.description}</td>
                      <td className='py-3 text-center text-platinum-silver/80'>{item.quantity}</td>
                      <td className='py-3 text-right text-platinum-silver/80 font-mono'>
                        {formatCurrency(item.unit_price, invoice.currency)}
                      </td>
                      <td className='py-3 text-right text-platinum-silver font-mono'>
                        {formatCurrency(item.total_amount, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice Total */}
            <div className='border-t border-platinum-silver/20 mt-4 pt-4'>
              <div className='flex justify-end'>
                <div className='text-right space-y-1'>
                  <div className='text-xl font-semibold text-platinum-silver'>
                    Total: <span className='font-mono'>{formatCurrency(invoice.total_amount, invoice.currency)}</span>
                  </div>
                  <div className='text-platinum-silver/60 text-sm'>{invoice.currency.toUpperCase()}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Notes */}
        {invoice.notes && (
          <div className='bg-rich-black/60 rounded-lg p-6'>
            <h3 className='text-lg font-medium text-platinum-silver mb-4'>Notes</h3>
            <div className='text-platinum-silver/80 whitespace-pre-wrap'>{invoice.notes}</div>
          </div>
        )}

        {/* Stripe Information */}
        {invoice.stripe_details && (
          <div className='bg-rich-black/60 rounded-lg p-6'>
            <h3 className='text-lg font-medium text-platinum-silver mb-4'>Payment Information</h3>

            <div className='space-y-3'>
              {invoice.stripe_details.hosted_invoice_url && (
                <div>
                  <span className='text-platinum-silver/80'>Customer Portal:</span>
                  <br />
                  <a
                    href={invoice.stripe_details.hosted_invoice_url}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-champagne-gold hover:text-champagne-gold/80 transition-colors break-all'
                  >
                    {invoice.stripe_details.hosted_invoice_url}
                  </a>
                </div>
              )}

              {invoice.stripe_details.invoice_pdf && (
                <div>
                  <span className='text-platinum-silver/80'>PDF Download:</span>
                  <br />
                  <a
                    href={invoice.stripe_details.invoice_pdf}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-champagne-gold hover:text-champagne-gold/80 transition-colors'
                  >
                    Download PDF
                  </a>
                </div>
              )}

              <div className='text-xs text-platinum-silver/60 pt-2 border-t border-platinum-silver/10'>
                Stripe Invoice ID: {invoice.stripe_invoice_id}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetails;
