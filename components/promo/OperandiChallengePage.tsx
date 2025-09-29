import React, { useState } from 'react';
import OperandiSignupForm from './OperandiSignUpForm';
import OperandiConfirmation from './OperandiConfirmation';
import { apiService } from '../../services/apiService';
import type { OperandiSignupData, PromoSignupResponse } from '../../types';

const OperandiChallengePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitResponse, setSubmitResponse] = useState<PromoSignupResponse | null>(null);

  const handleSignupSubmit = async (data: OperandiSignupData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.submitOperandiSignup(data);
      setSubmitResponse(response);
      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Signup submission error:', err);
      setError(err.message || 'Failed to submit signup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted && submitResponse) {
    return <OperandiConfirmation response={submitResponse} />;
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
              The Operandi <span className='text-blue-600'>Challenge</span>
            </h1>
            <p className='text-xl lg:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto'>
              Join an exclusive cohort of watch professionals and enthusiasts in mastering the art of luxury watch
              trading with 100ktracker's premium tools.
            </p>

            {/* Key Benefits */}
            <div className='grid md:grid-cols-3 gap-8 mt-12 mb-16'>
              <div className='bg-gray-50 rounded-lg p-6'>
                <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4'>
                  <svg className='w-6 h-6 text-blue-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                    />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>Premium Analytics</h3>
                <p className='text-gray-600'>
                  Access advanced market analytics and pricing intelligence for luxury timepieces.
                </p>
              </div>

              <div className='bg-gray-50 rounded-lg p-6'>
                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4'>
                  <svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                    />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>Expert Community</h3>
                <p className='text-gray-600'>
                  Connect with fellow watch traders and learn from industry professionals.
                </p>
              </div>

              <div className='bg-gray-50 rounded-lg p-6'>
                <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4'>
                  <svg className='w-6 h-6 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13 10V3L4 14h7v7l9-11h-7z' />
                  </svg>
                </div>
                <h3 className='text-lg font-semibold text-gray-900 mb-2'>Accelerated Growth</h3>
                <p className='text-gray-600'>Fast-track your watch trading success with proven strategies and tools.</p>
              </div>
            </div>

            {/* Challenge Details */}
            <div className='bg-blue-50 rounded-xl p-8 mb-12'>
              <h2 className='text-2xl font-bold text-gray-900 mb-4'>What is The Operandi Challenge?</h2>
              <div className='grid md:grid-cols-2 gap-8 text-left'>
                <div>
                  <h3 className='font-semibold text-gray-900 mb-3'>🎯 Exclusive Access</h3>
                  <ul className='text-gray-700 space-y-2'>
                    <li>• Curated group of serious watch professionals</li>
                    <li>• Premium 100ktracker features and tools</li>
                    <li>• Direct mentorship opportunities</li>
                    <li>• Early access to new platform features</li>
                  </ul>
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 mb-3'>📈 Growth Focused</h3>
                  <ul className='text-gray-700 space-y-2'>
                    <li>• Strategic portfolio management guidance</li>
                    <li>• Market timing and pricing strategies</li>
                    <li>• Risk management best practices</li>
                    <li>• Networking with industry leaders</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className='bg-white rounded-xl shadow-lg p-8'>
              <h2 className='text-2xl font-bold text-gray-900 mb-4'>Ready to Join?</h2>
              <p className='text-gray-600 mb-8 max-w-2xl mx-auto'>
                Applications are carefully reviewed to ensure the right fit for this exclusive program. Tell us about
                yourself and your watch trading goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Signup Form Section */}
      <section className='bg-white py-16'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold text-gray-900 mb-4'>Apply for The Operandi Challenge</h2>
            <p className='text-lg text-gray-600'>
              Complete the form below to be considered for this exclusive opportunity.
            </p>
          </div>

          <div className='bg-white shadow-xl rounded-2xl p-8 lg:p-12'>
            <OperandiSignupForm onSubmit={handleSignupSubmit} isLoading={isLoading} error={error} />
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
