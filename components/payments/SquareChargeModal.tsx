import React, { useState, useEffect, useRef } from 'react';
import { X, CreditCard, Loader2, DollarSign, User, Mail } from 'lucide-react';
import { Invoice, SquareChargeData } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { loadSquareSDK, getSquareConfig, UserSquareConfig } from '../../utils/squareConfig';
import { apiService } from '../../services/apiService';

interface SquareChargeModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
}

const SquareChargeModal: React.FC<SquareChargeModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [squareSDK, setSquareSDK] = useState<any>(null);
  const [cardForm, setCardForm] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Card form container ref
  const cardContainerRef = useRef<HTMLDivElement>(null);
  const cardAttached = useRef(false);

  // Customer information for payment
  const [customerInfo, setCustomerInfo] = useState({
    name: invoice.contact_name || invoice.customer_info?.name || '',
    email: invoice.contact_email || invoice.customer_info?.email || '',
  });

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  // Initialize Square SDK when modal opens
  useEffect(() => {
    if (isOpen && !squareSDK) {
      initializeSquare();
    }
  }, [isOpen]);

  // Attach card form when SDK is ready
  useEffect(() => {
    if (squareSDK && cardForm && !cardAttached.current && isOpen) {
      attachCardForm();
    }
  }, [squareSDK, cardForm, isOpen]);

  const initializeSquare = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Initializing Square SDK for invoice charging...');

      // Fetch user's Square configuration from API
      const response = await apiService.get('/account/square');
      if (!response.hasSquareConfig) {
        throw new Error('Square configuration not found. Please configure Square in Account Settings.');
      }

      const userConfig: UserSquareConfig = {
        applicationId: response.applicationId,
        locationId: response.locationId,
        environment: response.environment,
      };

      // Get Square configuration with user data
      const squareConfig = getSquareConfig({ context: 'user', userConfig });
      if (!squareConfig) {
        throw new Error('Square configuration not found. Please configure Square in Account Settings.');
      }

      const sdk = await loadSquareSDK({ context: 'user', userConfig });
      setSquareSDK(sdk);

      // Create card form
      const card = await sdk.card();
      setCardForm(card);
      console.log('✅ Square card form created successfully');
    } catch (err: any) {
      console.error('❌ Failed to initialize Square SDK:', err);
      setError(`Failed to load Square payment form: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const attachCardForm = async () => {
    if (!cardForm || !cardContainerRef.current || cardAttached.current) return;

    try {
      await cardForm.attach('#square-card-container');
      cardAttached.current = true;
      console.log('✅ Square card form attached successfully');
    } catch (err: any) {
      console.error('❌ Failed to attach card form:', err);
      setError(`Failed to attach payment form: ${err.message}`);
    }
  };

  const handlePayment = async () => {
    if (!cardForm || !squareSDK) {
      setError('Payment form not ready. Please try again.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Validate customer info
      if (!customerInfo.name.trim()) {
        setError('Customer name is required');
        setIsProcessing(false);
        return;
      }

      console.log('🔄 Processing Square payment for invoice:', invoice.invoice_number);

      // Tokenize the card
      const tokenResult = await cardForm.tokenize();
      if (tokenResult.status !== 'OK') {
        throw new Error(tokenResult.errors?.[0]?.message || 'Card tokenization failed');
      }

      const paymentToken = tokenResult.token;
      console.log('✅ Card tokenized successfully');

      // Prepare payment data
      const chargeData: SquareChargeData = {
        amount: invoice.total_amount,
        currency: invoice.currency || 'USD',
        invoice_id: invoice.id,
        customer_info: {
          name: customerInfo.name,
          email: customerInfo.email || undefined,
        },
      };

      // Call backend to process payment
      const response = await apiService.post('/invoices/charge', {
        ...chargeData,
        payment_token: paymentToken,
        idempotency_key: `invoice-${invoice.id}-${Date.now()}`,
      });

      if (response.success && response.payment_id) {
        console.log('✅ Payment processed successfully:', response.payment_id);
        onPaymentSuccess(response.payment_id);
        onClose();
      } else {
        throw new Error(response.message || 'Payment processing failed');
      }
    } catch (err: any) {
      console.error('❌ Payment processing failed:', err);
      const errorMessage = err.message || 'Payment failed. Please try again.';
      setError(errorMessage);
      onPaymentError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    // Cleanup Square form
    if (cardForm && cardAttached.current) {
      try {
        cardForm.destroy();
      } catch (err) {
        console.warn('Error destroying card form:', err);
      }
    }

    cardAttached.current = false;
    setSquareSDK(null);
    setCardForm(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
      <div className={`w-full max-w-lg rounded-xl shadow-2xl ${isDark ? 'bg-charcoal-slate' : 'bg-white'}`}>
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDark ? 'border-champagne-gold/20' : 'border-gray-200'
          }`}
        >
          <div className='flex items-center gap-3'>
            <CreditCard size={24} className={isDark ? 'text-champagne-gold' : 'text-blue-600'} />
            <div>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                Charge Invoice
              </h2>
              <p className={`text-sm ${isDark ? 'text-platinum-silver/70' : 'text-gray-600'}`}>
                Invoice #{invoice.invoice_number}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-champagne-gold/10 text-platinum-silver/60 hover:text-platinum-silver'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className='p-6 space-y-6'>
          {/* Invoice Summary */}
          <div
            className={`p-4 rounded-lg border ${
              isDark ? 'bg-obsidian-black border-champagne-gold/20' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className='flex items-center gap-2 mb-3'>
              <DollarSign size={16} className={isDark ? 'text-champagne-gold' : 'text-blue-600'} />
              <span className={`font-medium ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                Payment Summary
              </span>
            </div>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className={isDark ? 'text-platinum-silver/70' : 'text-gray-600'}>Amount:</span>
                <span className={`font-semibold ${isDark ? 'text-champagne-gold' : 'text-blue-600'}`}>
                  {formatCurrency(invoice.total_amount, invoice.currency)}
                </span>
              </div>
              {invoice.due_date && (
                <div className='flex justify-between'>
                  <span className={isDark ? 'text-platinum-silver/70' : 'text-gray-600'}>Due Date:</span>
                  <span className={isDark ? 'text-platinum-silver' : 'text-gray-900'}>
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <User size={16} className={isDark ? 'text-champagne-gold' : 'text-blue-600'} />
              <span className={`font-medium ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                Customer Information
              </span>
            </div>

            <div className='space-y-3'>
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${isDark ? 'text-platinum-silver/80' : 'text-gray-700'}`}
                >
                  Name *
                </label>
                <input
                  type='text'
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg transition-colors focus:outline-none ${
                    isDark
                      ? 'bg-obsidian-black border-champagne-gold/20 text-platinum-silver placeholder-platinum-silver/40 focus:border-champagne-gold'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  }`}
                  placeholder='Customer name'
                  required
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${isDark ? 'text-platinum-silver/80' : 'text-gray-700'}`}
                >
                  Email (Optional)
                </label>
                <div className='relative'>
                  <Mail
                    size={16}
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                      isDark ? 'text-platinum-silver/40' : 'text-gray-400'
                    }`}
                  />
                  <input
                    type='email'
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg transition-colors focus:outline-none ${
                      isDark
                        ? 'bg-obsidian-black border-champagne-gold/20 text-platinum-silver placeholder-platinum-silver/40 focus:border-champagne-gold'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    }`}
                    placeholder='customer@email.com'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Square Card Form */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <CreditCard size={16} className={isDark ? 'text-champagne-gold' : 'text-blue-600'} />
              <span className={`font-medium ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                Payment Information
              </span>
            </div>

            {isLoading ? (
              <div className='flex items-center justify-center py-8'>
                <Loader2 size={24} className='animate-spin text-champagne-gold' />
                <span className={`ml-2 ${isDark ? 'text-platinum-silver/70' : 'text-gray-600'}`}>
                  Loading payment form...
                </span>
              </div>
            ) : (
              <div
                className={`p-4 border rounded-lg min-h-[120px] ${
                  isDark ? 'border-champagne-gold/20 bg-obsidian-black' : 'border-gray-300 bg-white'
                }`}
              >
                <div id='square-card-container' ref={cardContainerRef} />
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div
              className={`p-4 rounded-lg border ${
                isDark ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'
              }`}
            >
              <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex gap-3 pt-4'>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className={`flex-1 px-4 py-2 rounded-lg border transition-all duration-200 ${
                isDark
                  ? 'border-champagne-gold/30 text-platinum-silver hover:bg-champagne-gold/10'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={isProcessing || isLoading || !customerInfo.name.trim()}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-champagne-gold text-obsidian-black hover:bg-champagne-gold/90'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className='animate-spin' />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  Charge {formatCurrency(invoice.total_amount, invoice.currency)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SquareChargeModal;
