import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';

interface PaymentResultProps {
  onBack: () => void;
}

const PaymentResult: React.FC<PaymentResultProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'processing' | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handlePaymentResult = async () => {
      try {
        setLoading(true);

        // Get parameters from URL
        const invoiceId = searchParams.get('invoice_id');
        const paymentIntent = searchParams.get('payment_intent');
        const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
        const redirectStatus = searchParams.get('redirect_status');

        if (!invoiceId) {
          setError('No invoice ID provided');
          setLoading(false);
          return;
        }

        // Determine payment status from redirect status
        let status: 'success' | 'failed' | 'processing' = 'processing';

        switch (redirectStatus) {
          case 'succeeded':
            status = 'success';
            break;
          case 'failed':
            status = 'failed';
            break;
          case 'processing':
            status = 'processing';
            break;
          default:
            // Try to determine status from invoice
            break;
        }

        setPaymentStatus(status);

        // Fetch invoice details to confirm status
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (currentUser.token) {
          const response = await fetch(`/api/invoices/${invoiceId}`, {
            headers: {
              Authorization: `Bearer ${currentUser.token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setInvoiceDetails(data.invoice);

            // Update status based on invoice data
            if (data.invoice.status === 'paid') {
              setPaymentStatus('success');
            } else if (data.invoice.status === 'payment_failed') {
              setPaymentStatus('failed');
            }
          }
        }
      } catch (error) {
        console.error('Error handling payment result:', error);
        setError('Failed to process payment result');
      } finally {
        setLoading(false);
      }
    };

    handlePaymentResult();
  }, [searchParams]);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Stripe amounts are in cents
  };

  if (loading) {
    return (
      <div className='max-w-2xl mx-auto'>
        <div
          className={`rounded-lg p-8 text-center ${isDark ? 'bg-rich-black/60' : 'bg-gray-50 border border-gray-200'}`}
        >
          <div
            className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${isDark ? 'border-champagne-gold' : 'border-blue-600'}`}
          ></div>
          <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
            Processing Payment Result
          </h2>
          <p className={isDark ? 'text-platinum-silver/60' : 'text-gray-600'}>
            Please wait while we confirm your payment status...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='max-w-2xl mx-auto'>
        <div
          className={`rounded-lg p-8 text-center ${isDark ? 'bg-rich-black/60' : 'bg-gray-50 border border-gray-200'}`}
        >
          <div className={`text-4xl mb-4 ${isDark ? 'text-red-400' : 'text-red-600'}`}>⚠️</div>
          <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>Error</h2>
          <p className={`mb-6 ${isDark ? 'text-platinum-silver/80' : 'text-gray-600'}`}>{error}</p>
          <button
            onClick={onBack}
            className={
              isDark
                ? 'bg-champagne-gold hover:bg-champagne-gold/80 text-rich-black font-medium px-6 py-2 rounded-lg transition-colors'
                : 'bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors'
            }
          >
            Return to Invoices
          </button>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'processing':
        return '⏳';
      default:
        return '❓';
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'success':
        return isDark ? 'text-green-400' : 'text-green-600';
      case 'failed':
        return isDark ? 'text-red-400' : 'text-red-600';
      case 'processing':
        return isDark ? 'text-yellow-400' : 'text-yellow-600';
      default:
        return isDark ? 'text-platinum-silver' : 'text-gray-600';
    }
  };

  const getStatusTitle = () => {
    switch (paymentStatus) {
      case 'success':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      case 'processing':
        return 'Payment Processing';
      default:
        return 'Payment Status Unknown';
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'success':
        return 'Your payment has been processed successfully. Thank you for your payment!';
      case 'failed':
        return 'We were unable to process your payment. Please try again or contact support.';
      case 'processing':
        return 'Your payment is being processed. This may take a few minutes to complete.';
      default:
        return 'We could not determine the status of your payment. Please contact support if needed.';
    }
  };

  return (
    <div className='max-w-2xl mx-auto'>
      <div className={`rounded-lg p-8 ${isDark ? 'bg-rich-black/60' : 'bg-gray-50 border border-gray-200'}`}>
        <div className='text-center mb-8'>
          <div className='text-6xl mb-4'>{getStatusIcon()}</div>
          <h2 className={`text-2xl font-semibold mb-2 ${getStatusColor()}`}>{getStatusTitle()}</h2>
          <p className={`text-lg ${isDark ? 'text-platinum-silver/80' : 'text-gray-600'}`}>{getStatusMessage()}</p>
        </div>

        {invoiceDetails && (
          <div className={`rounded-lg p-6 mb-6 ${isDark ? 'bg-rich-black/40' : 'bg-white border border-gray-200'}`}>
            <h3 className={`text-lg font-medium mb-4 ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
              Invoice Details
            </h3>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span className={isDark ? 'text-platinum-silver/60' : 'text-gray-600'}>Invoice ID:</span>
                <span className={`font-mono ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                  {invoiceDetails.id}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className={isDark ? 'text-platinum-silver/60' : 'text-gray-600'}>Amount:</span>
                <span className={`font-mono ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                  {formatCurrency(invoiceDetails.amount_due || invoiceDetails.total, invoiceDetails.currency)}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className={isDark ? 'text-platinum-silver/60' : 'text-gray-600'}>Status:</span>
                <span className={`font-medium ${getStatusColor()}`}>
                  {invoiceDetails.status.charAt(0).toUpperCase() + invoiceDetails.status.slice(1)}
                </span>
              </div>
              {invoiceDetails.customer && (
                <div className='flex justify-between'>
                  <span className={isDark ? 'text-platinum-silver/60' : 'text-gray-600'}>Customer:</span>
                  <span className={isDark ? 'text-platinum-silver' : 'text-gray-900'}>
                    {invoiceDetails.customer.name || invoiceDetails.customer.email}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <button
            onClick={onBack}
            className={
              isDark
                ? 'bg-champagne-gold hover:bg-champagne-gold/80 text-rich-black font-medium px-6 py-3 rounded-lg transition-colors'
                : 'bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors'
            }
          >
            Return to Invoices
          </button>

          {paymentStatus === 'failed' && invoiceDetails?.hosted_invoice_url && (
            <button
              onClick={() => window.open(invoiceDetails.hosted_invoice_url, '_blank')}
              className={
                isDark
                  ? 'bg-rich-black border border-champagne-gold text-champagne-gold hover:bg-champagne-gold hover:text-rich-black font-medium px-6 py-3 rounded-lg transition-colors'
                  : 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-medium px-6 py-3 rounded-lg transition-colors'
              }
            >
              Try Payment Again
            </button>
          )}

          {paymentStatus === 'success' && invoiceDetails?.invoice_pdf && (
            <button
              onClick={() => window.open(invoiceDetails.invoice_pdf, '_blank')}
              className={
                isDark
                  ? 'bg-rich-black border border-champagne-gold text-champagne-gold hover:bg-champagne-gold hover:text-rich-black font-medium px-6 py-3 rounded-lg transition-colors'
                  : 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-medium px-6 py-3 rounded-lg transition-colors'
              }
            >
              Download Receipt
            </button>
          )}
        </div>

        {paymentStatus === 'processing' && (
          <div
            className={`mt-6 p-4 rounded-lg border ${isDark ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'}`}
          >
            <p className={`text-sm text-center ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
              <strong>Note:</strong> If your payment is still processing after 10 minutes, please contact support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentResult;
