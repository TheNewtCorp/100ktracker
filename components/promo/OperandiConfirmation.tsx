import React from 'react';
import type { PromoSignupResponse } from '../../types';

interface OperandiConfirmationProps {
  response: PromoSignupResponse;
}

const OperandiConfirmation: React.FC<OperandiConfirmationProps> = ({ response }) => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4'>
      <div className='max-w-2xl w-full'>
        <div className='bg-white rounded-2xl shadow-xl p-8 lg:p-12 text-center'>
          {/* Success Icon */}
          <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6'>
            <svg className='w-10 h-10 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
            </svg>
          </div>

          {/* Main Message */}
          <h1 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-4'>Application Submitted!</h1>

          <p className='text-lg text-gray-600 mb-8'>
            Thank you for your interest in The Operandi Challenge. Your application has been received and will be
            reviewed by our team.
          </p>

          {/* Application Details */}
          <div className='bg-gray-50 rounded-lg p-6 mb-8 text-left'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>Application Summary</h2>
            <div className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Application ID:</span>
                <span className='font-mono text-gray-900'>#{response.signupId || 'Pending'}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Submitted:</span>
                <span className='text-gray-900'>{new Date().toLocaleDateString()}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Status:</span>
                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
                  Under Review
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className='bg-blue-50 rounded-lg p-6 mb-8 text-left'>
            <h2 className='text-lg font-semibold text-gray-900 mb-4'>What Happens Next?</h2>
            <div className='space-y-3 text-sm text-gray-700'>
              <div className='flex items-start space-x-3'>
                <div className='w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                  <span className='text-blue-600 font-semibold text-xs'>1</span>
                </div>
                <div>
                  <div className='font-medium text-gray-900'>Application Review</div>
                  <div>Our team will carefully review your application and experience level.</div>
                </div>
              </div>

              <div className='flex items-start space-x-3'>
                <div className='w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                  <span className='text-blue-600 font-semibold text-xs'>2</span>
                </div>
                <div>
                  <div className='font-medium text-gray-900'>Response Timeline</div>
                  <div>You'll hear back from us within 1-2 business days via email.</div>
                </div>
              </div>

              <div className='flex items-start space-x-3'>
                <div className='w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                  <span className='text-blue-600 font-semibold text-xs'>3</span>
                </div>
                <div>
                  <div className='font-medium text-gray-900'>Program Access</div>
                  <div>If accepted, you'll receive exclusive access to The Operandi Challenge resources.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className='border-t pt-6'>
            <p className='text-sm text-gray-600 mb-4'>Questions about your application? Contact our team:</p>
            <div className='flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm'>
              <a
                href='mailto:operandi@100ktracker.com'
                className='text-blue-600 hover:text-blue-700 flex items-center space-x-1'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                  />
                </svg>
                <span>operandi@100ktracker.com</span>
              </a>
            </div>
          </div>

          {/* Partnership Branding */}
          <div className='mt-8 pt-6 border-t'>
            <div className='flex items-center justify-center space-x-4 text-gray-500'>
              <span className='font-semibold'>100ktracker</span>
              <span>×</span>
              <span className='font-semibold text-blue-600'>Operandi</span>
            </div>
            <p className='text-xs text-gray-500 mt-2'>Exclusive Partnership Program</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperandiConfirmation;
