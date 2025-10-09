import React, { useEffect, useRef, useState } from 'react';
import { loadSquareSDK, SQUARE_FORM_STYLES, SquarePaymentConfig, SquarePaymentResult } from '../../utils/squareConfig';

interface SquarePaymentFormProps {
  config: SquarePaymentConfig;
  onPaymentResult: (result: SquarePaymentResult) => void;
  disabled?: boolean;
  className?: string;
}

export const SquarePaymentForm: React.FC<SquarePaymentFormProps> = ({
  config,
  onPaymentResult,
  disabled = false,
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const cardContainerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<any>(null);
  const paymentsRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const initializeSquare = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 SquarePaymentForm: Starting initialization...');

        // Load Square SDK
        const payments = await loadSquareSDK();

        if (!mounted) return;

        paymentsRef.current = payments;
        console.log('✅ SquarePaymentForm: Square SDK loaded');

        // Initialize card form
        const card = await payments.card();
        cardRef.current = card;
        console.log('✅ SquarePaymentForm: Card form created');

        // Configure styling
        card.configure({
          style: SQUARE_FORM_STYLES,
        });
        console.log('✅ SquarePaymentForm: Card styling configured');

        // Wait a moment for DOM to be ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Attach card form to DOM
        if (cardContainerRef.current) {
          await card.attach('#square-card-container');
          console.log('✅ SquarePaymentForm: Card form attached to DOM');
        } else {
          throw new Error('Card container ref not available');
        }

        setIsLoading(false);
        console.log('🎉 SquarePaymentForm: Initialization complete!');
      } catch (err: any) {
        console.error('❌ SquarePaymentForm initialization error:', err);
        if (mounted) {
          let errorMessage = err.message || 'Failed to load payment form';

          // Provide more specific error messages
          if (err.message?.includes('MISSING')) {
            errorMessage = 'Payment system configuration error. Please contact support.';
          } else if (err.message?.includes('failed to load')) {
            errorMessage = 'Unable to load payment system. Please check your internet connection and try again.';
          }

          setError(errorMessage);
          setIsLoading(false);
        }
      }
    };

    initializeSquare();

    // Cleanup
    return () => {
      mounted = false;
      if (cardRef.current) {
        try {
          cardRef.current.destroy();
        } catch (err) {
          console.warn('Error destroying card form:', err);
        }
      }
    };
  }, []);

  const handlePayment = async () => {
    if (!cardRef.current || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Tokenize card
      const result = await cardRef.current.tokenize();

      if (result.token) {
        onPaymentResult({
          success: true,
          token: result.token,
          details: result.details,
        });
      } else {
        throw new Error('Failed to tokenize payment method');
      }
    } catch (err: any) {
      console.error('Payment tokenization error:', err);
      const errorMessage = err.message || 'Payment processing failed';
      setError(errorMessage);
      onPaymentResult({
        success: false,
        error: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className='bg-gray-200 h-12 rounded-lg mb-4'></div>
        <div className='bg-gray-200 h-12 rounded-lg mb-4'></div>
        <div className='bg-gray-200 h-12 rounded-lg'></div>
      </div>
    );
  }

  if (error && !cardRef.current) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className='flex items-center'>
          <svg className='w-5 h-5 text-red-400 mr-3' fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
              clipRule='evenodd'
            />
          </svg>
          <div>
            <h3 className='text-sm font-medium text-red-800'>Payment Form Error</h3>
            <p className='text-sm text-red-700 mt-1'>{error}</p>
          </div>
        </div>
        <button
          onClick={() => window.location.reload()}
          className='mt-3 text-sm text-red-800 underline hover:text-red-900'
        >
          Reload page to try again
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Payment Amount Display */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6'>
        <div className='flex justify-between items-center'>
          <span className='text-lg font-medium text-blue-900'>Total Amount:</span>
          <span className='text-2xl font-bold text-blue-900'>
            ${(config.amount / 100).toFixed(2)} {config.currency}
          </span>
        </div>
        {config.metadata?.hasValidPromo === 'true' && (
          <p className='text-sm text-blue-700 mt-2'>✨ Operandi promo discount applied</p>
        )}
      </div>

      {/* Square Card Form */}
      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Card Information</label>
          <div
            id='square-card-container'
            ref={cardContainerRef}
            className='border border-gray-300 rounded-lg p-4 bg-white'
            style={{
              minHeight: '100px',
            }}
          ></div>
        </div>

        {error && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
            <p className='text-red-800 text-sm'>{error}</p>
          </div>
        )}

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={disabled || isProcessing || isLoading}
          className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-colors ${
            disabled || isProcessing || isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          }`}
        >
          {isProcessing ? (
            <div className='flex items-center justify-center'>
              <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3'></div>
              Processing Payment...
            </div>
          ) : (
            `Pay $${(config.amount / 100).toFixed(2)}`
          )}
        </button>

        {/* Security Notice */}
        <div className='text-sm text-gray-600 text-center'>
          <div className='flex items-center justify-center mb-2'>
            <svg className='w-4 h-4 text-green-500 mr-1' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
                clipRule='evenodd'
              />
            </svg>
            Secure payment powered by Square
          </div>
          <p>Your payment information is encrypted and secure.</p>
        </div>
      </div>
    </div>
  );
};

export default SquarePaymentForm;
