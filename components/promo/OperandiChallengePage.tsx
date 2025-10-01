import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/apiService';

const OperandiChallengePage: React.FC = () => {
  const [promoCode, setPromoCode] = useState('');
  const [isPromoValid, setIsPromoValid] = useState<boolean | null>(null);
  const [isVerifyingPromo, setIsVerifyingPromo] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    businessName: '',
    promoCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'cancelled' | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Ref for debouncing promo code validation
  const promoCodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check URL parameters for payment status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const session_id = urlParams.get('session_id');

    if (payment === 'success' && session_id) {
      setPaymentStatus('success');
      setSessionId(session_id);

      // Handle payment success
      handlePaymentSuccess(session_id);
    } else if (payment === 'cancelled') {
      setPaymentStatus('cancelled');
      setError('Payment was cancelled. You can try again.');
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (promoCodeTimeoutRef.current) {
        clearTimeout(promoCodeTimeoutRef.current);
      }
    };
  }, []);

  const handlePaymentSuccess = async (sessionId: string) => {
    try {
      const result = await apiService.handlePaymentSuccess(sessionId);
      if (result.success) {
        setIsSubmitted(true);
        // Optionally clear URL parameters
        window.history.replaceState({}, document.title, '/operandi-challenge');
      }
    } catch (error: any) {
      console.error('Payment success handling failed:', error);
      setError('Payment completed but account setup failed. Please contact support.');
    }
  };

  // The promo code - you can give this to Operandi business
  const VALID_PROMO_CODE = 'OPERANDI2024';

  const verifyPromoCode = async (code: string) => {
    if (!code.trim()) {
      setIsPromoValid(null);
      return;
    }

    setIsVerifyingPromo(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const isValid = code.trim().toUpperCase() === VALID_PROMO_CODE;
    setIsPromoValid(isValid);
    setIsVerifyingPromo(false);
  };

  const handlePromoCodeChange = (value: string) => {
    setPromoCode(value);
    setFormData((prev) => ({ ...prev, promoCode: value }));

    // Clear any existing timeout
    if (promoCodeTimeoutRef.current) {
      clearTimeout(promoCodeTimeoutRef.current);
    }

    // Reset validation state while user is typing
    setIsPromoValid(null);
    setIsVerifyingPromo(false);

    // Auto-verify promo code after user stops typing (with longer debounce)
    if (value.length >= 3) {
      promoCodeTimeoutRef.current = setTimeout(() => {
        verifyPromoCode(value);
      }, 1000); // Increased to 1 second to give user time to finish typing
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.businessName.trim() ||
      !formData.promoCode.trim()
    ) {
      setError('Please fill in all required fields including the promo code');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate promo code (now required)
    if (!isPromoValid) {
      setError('Please enter a valid promo code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Split fullName into firstName and lastName
      const nameParts = formData.fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      if (!firstName) {
        setError('Please enter a valid full name');
        setIsLoading(false);
        return;
      }

      // Create Stripe checkout session
      const checkoutData = {
        email: formData.email,
        firstName,
        lastName,
        promoCode: formData.promoCode,
      };

      const response = await apiService.createCheckoutSession(checkoutData);

      // Redirect to Stripe checkout
      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to create checkout session. Please try again.');
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center'>
        <div className='max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center'>
          <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg className='w-8 h-8 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
            </svg>
          </div>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>Subscription Request Received!</h2>
          <p className='text-gray-600 mb-6'>
            Thank you for your interest in 100ktracker. We'll contact you within 1-2 business days to set up your
            account.
          </p>
          <div className='bg-green-50 border border-green-200 rounded-lg p-4 mb-6'>
            <p className='text-green-800 font-medium'>
              🎉 Operandi promo code applied! You'll save $10/month on your subscription.
            </p>
          </div>
          <button
            onClick={() => (window.location.href = '/')}
            className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors'
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='flex-shrink-0'>
                <h1 className='text-2xl font-bold text-gray-900'>100ktracker</h1>
              </div>
              <div className='hidden md:block'>
                <span className='text-gray-500'>×</span>
              </div>
              <div className='hidden md:block'>
                <h2 className='text-xl font-semibold text-blue-600'>Operandi</h2>
              </div>
            </div>
            <div className='text-sm text-gray-500'>Exclusive Partnership</div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className='relative overflow-hidden bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20'>
          <div className='text-center'>
            <h1 className='text-4xl lg:text-6xl font-bold text-gray-900 mb-6'>
              Premium Watch <span className='text-blue-600'>Tracking</span>
            </h1>
            <p className='text-xl lg:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto'>
              Join the ultimate platform for luxury watch professionals with advanced analytics, market intelligence,
              and portfolio management tools.
            </p>

            {/* Pricing Matrix */}
            <div className='max-w-4xl mx-auto'>
              <h2 className='text-3xl font-bold text-gray-900 mb-8'>Choose Your Plan</h2>

              <div className='grid md:grid-cols-2 gap-8 mb-12'>
                {/* Standard Plan */}
                <div className='bg-white border-2 border-gray-200 rounded-xl p-8 shadow-lg'>
                  <div className='text-center mb-6'>
                    <h3 className='text-2xl font-bold text-gray-900 mb-2'>Platinum Tier</h3>
                    <div className='text-5xl font-bold text-gray-900 mb-2'>
                      $99
                      <span className='text-lg font-normal text-gray-600'>/month</span>
                    </div>
                    <p className='text-gray-600'>Full access to all premium features</p>
                  </div>

                  <div className='space-y-4 mb-8'>
                    <div className='flex items-center'>
                      <svg className='w-5 h-5 text-green-500 mr-3' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                      <span className='text-gray-700'>Advanced portfolio analytics</span>
                    </div>
                    <div className='flex items-center'>
                      <svg className='w-5 h-5 text-green-500 mr-3' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                      <span className='text-gray-700'>Real-time market data</span>
                    </div>
                    <div className='flex items-center'>
                      <svg className='w-5 h-5 text-green-500 mr-3' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                      <span className='text-gray-700'>Unlimited watch tracking</span>
                    </div>
                    <div className='flex items-center'>
                      <svg className='w-5 h-5 text-green-500 mr-3' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                      <span className='text-gray-700'>Priority customer support</span>
                    </div>
                    <div className='flex items-center'>
                      <svg className='w-5 h-5 text-green-500 mr-3' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                      <span className='text-gray-700'>Export & reporting tools</span>
                    </div>
                  </div>
                </div>

                {/* Operandi Discounted Plan */}
                <div className='bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-500 rounded-xl p-8 shadow-lg relative'>
                  <div className='absolute -top-4 left-1/2 transform -translate-x-1/2'>
                    <span className='bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold'>
                      🎯 Operandi Exclusive
                    </span>
                  </div>

                  <div className='text-center mb-6 mt-4'>
                    <h3 className='text-2xl font-bold text-gray-900 mb-2'>Platinum + Operandi Plan</h3>
                    <div className='mb-3'>
                      <span className='text-2xl text-gray-500 line-through'>$99</span>
                      <div className='text-5xl font-bold text-blue-600 mb-2'>
                        $89
                        <span className='text-lg font-normal text-gray-600'>/month</span>
                      </div>
                    </div>
                    <div className='bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium inline-block'>
                      Save $10/month with promo code
                    </div>
                  </div>

                  <div className='space-y-4 mb-8'>
                    <div className='flex items-center'>
                      <svg className='w-5 h-5 text-blue-500 mr-3' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                      <span className='text-gray-700 font-medium'>Everything in Standard Plan</span>
                    </div>
                    <div className='flex items-center'>
                      <svg className='w-5 h-5 text-blue-500 mr-3' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                      <span className='text-blue-700 font-medium'>$10 monthly discount</span>
                    </div>
                    <div className='flex items-center'>
                      <svg className='w-5 h-5 text-blue-500 mr-3' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                      <span className='text-blue-700 font-medium'>Operandi partner benefits</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Form */}
      <section className='bg-white py-16'>
        <div className='max-w-2xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>Start Your Subscription</h2>
            <p className='text-lg text-gray-600'>
              Fill out the form below to begin your premium watch tracking experience.
            </p>
          </div>

          <div className='bg-white shadow-xl rounded-2xl p-8'>
            <form onSubmit={handleSubmit} className='space-y-6'>
              {error && (
                <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                  <p className='text-red-800'>{error}</p>
                </div>
              )}

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Full Name <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Enter your full name'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Email Address <span className='text-red-500'>*</span>
                </label>
                <input
                  type='email'
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Enter your email address'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Phone Number</label>
                <input
                  type='tel'
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Enter your phone number (optional)'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Business/Company Name <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='Enter your business name'
                  required
                />
              </div>

              {/* Promo Code Input in Form */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Operandi Promo Code <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  value={formData.promoCode}
                  onChange={(e) => handlePromoCodeChange(e.target.value.toUpperCase())}
                  className={`w-full px-4 py-3 border rounded-lg font-mono tracking-wider uppercase focus:ring-2 focus:border-transparent transition-colors placeholder-gray-500 ${
                    isPromoValid === true
                      ? 'border-green-300 bg-green-50 text-green-800 focus:ring-green-500'
                      : isPromoValid === false
                        ? 'border-red-300 bg-red-50 text-red-800 focus:ring-red-500'
                        : 'border-gray-300 text-gray-900 focus:ring-blue-500'
                  }`}
                  placeholder='Enter your Operandi promo code'
                  required
                />
                {isPromoValid === true && (
                  <p className='text-green-600 text-sm mt-1'>✓ $10 monthly discount applied!</p>
                )}
              </div>

              {/* Pricing Summary */}
              <div className='bg-gray-50 rounded-lg p-4 border'>
                <h4 className='font-medium text-gray-900 mb-3'>Subscription Summary</h4>
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span>Monthly Subscription</span>
                    <span>$99.00</span>
                  </div>
                  <div className='flex justify-between text-green-600'>
                    <span>Operandi Discount</span>
                    <span>-$10.00</span>
                  </div>
                  <div className='border-t pt-2 flex justify-between font-medium text-lg'>
                    <span>Monthly Total</span>
                    <span className='text-green-600'>$89.00</span>
                  </div>
                </div>
              </div>

              <button
                type='submit'
                disabled={isLoading}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-colors ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                }`}
              >
                {isLoading ? (
                  <div className='flex items-center justify-center'>
                    <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3'></div>
                    Processing...
                  </div>
                ) : (
                  'Subscribe Now - $89/month'
                )}
              </button>

              <div className='text-sm text-gray-600 text-center'>
                <p>
                  By subscribing, you agree to our terms of service. You can cancel anytime. We'll contact you within
                  1-2 business days to set up your account.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className='bg-gray-50 py-12'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <h3 className='text-lg font-semibold text-gray-900 mb-8'>Trusted by Watch Professionals</h3>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-gray-700'>500+</div>
                <div className='text-sm text-gray-600'>Active Traders</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-gray-700'>$50M+</div>
                <div className='text-sm text-gray-600'>Tracked Inventory</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-gray-700'>10K+</div>
                <div className='text-sm text-gray-600'>Watches Analyzed</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-gray-700'>98%</div>
                <div className='text-sm text-gray-600'>User Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='bg-white border-t py-8'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center text-gray-600'>
            <p className='mb-2'>The Operandi Challenge is an exclusive partnership between 100ktracker and Operandi.</p>
            <p className='text-sm'>
              Applications are reviewed manually. You will be contacted within 1-2 business days regarding your
              application status.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OperandiChallengePage;
