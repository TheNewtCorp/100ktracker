import React, { useState } from 'react';
import { motion } from 'framer-motion';
import adminApiService from '../../services/adminApiService';

interface AccountProvisioningFormProps {
  onSuccess?: () => void;
}

const AccountProvisioningForm: React.FC<AccountProvisioningFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    subscriptionTier: 'free' as 'free' | 'platinum' | 'operandi',
    temporaryPassword: '',
    sendEmail: true,
    promoSignupId: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const subscriptionTiers = [
    {
      value: 'free',
      label: 'Free Tier',
      description: 'Basic tracking features',
      icon: '🆓',
      color: 'text-blue-400',
    },
    {
      value: 'platinum',
      label: 'Platinum',
      description: 'Premium features with priority support',
      icon: '💎',
      color: 'text-purple-400',
    },
    {
      value: 'operandi',
      label: 'Operandi Challenge',
      description: 'Special tier for challenge participants',
      icon: '🎯',
      color: 'text-amber-400',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        email: formData.email.trim(),
        fullName: formData.fullName.trim(),
        subscriptionTier: formData.subscriptionTier,
        sendEmail: formData.sendEmail,
        ...(formData.temporaryPassword && { temporaryPassword: formData.temporaryPassword }),
        ...(formData.promoSignupId && { promoSignupId: parseInt(formData.promoSignupId) }),
      };

      const result = await adminApiService.provisionAccount(payload);
      setSuccess(result);

      // Reset form
      setFormData({
        email: '',
        fullName: '',
        subscriptionTier: 'free',
        temporaryPassword: '',
        sendEmail: true,
        promoSignupId: '',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Provisioning failed:', err);
      setError(err.message || 'Failed to provision account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Header */}
      <div className='text-center mb-8'>
        <h2 className='text-3xl font-bold text-white mb-2'>Provision New Account</h2>
        <p className='text-gray-400'>Create a new user account with comprehensive setup</p>
      </div>

      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-green-900 border border-green-700 rounded-lg p-6'
        >
          <div className='flex items-start'>
            <div className='text-green-400 text-2xl mr-4'>✅</div>
            <div className='flex-1'>
              <h3 className='text-lg font-semibold text-green-400 mb-2'>Account Provisioned Successfully!</h3>
              <div className='space-y-2 text-green-300'>
                <p>
                  <strong>Username:</strong> {success.account?.username}
                </p>
                <p>
                  <strong>Email:</strong> {success.account?.email}
                </p>
                <p>
                  <strong>Subscription Tier:</strong> {success.subscription?.tier}
                </p>
                {success.account?.temporaryPassword && (
                  <p>
                    <strong>Temporary Password:</strong> {success.account.temporaryPassword}
                  </p>
                )}
                <p>
                  <strong>Email Sent:</strong> {success.email?.sent ? 'Yes' : 'No'}
                </p>
              </div>
              {success.email?.previewUrl && (
                <div className='mt-3'>
                  <a
                    href={success.email.previewUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-green-400 hover:text-green-300 underline'
                  >
                    Preview Email →
                  </a>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-red-900 border border-red-700 rounded-lg p-6'
        >
          <div className='flex items-start'>
            <div className='text-red-400 text-2xl mr-4'>❌</div>
            <div>
              <h3 className='text-lg font-semibold text-red-400 mb-2'>Provisioning Failed</h3>
              <p className='text-red-300'>{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gray-800 rounded-lg p-6 border border-gray-700'
      >
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Basic Information */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label htmlFor='email' className='block text-sm font-medium text-gray-300 mb-2'>
                Email Address *
              </label>
              <input
                type='email'
                id='email'
                name='email'
                value={formData.email}
                onChange={handleInputChange}
                required
                className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='user@example.com'
              />
            </div>

            <div>
              <label htmlFor='fullName' className='block text-sm font-medium text-gray-300 mb-2'>
                Full Name *
              </label>
              <input
                type='text'
                id='fullName'
                name='fullName'
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='John Doe'
              />
            </div>
          </div>

          {/* Subscription Tier Selection */}
          <div>
            <label className='block text-sm font-medium text-gray-300 mb-4'>Subscription Tier *</label>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {subscriptionTiers.map((tier) => (
                <label
                  key={tier.value}
                  className={`relative cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                    formData.subscriptionTier === tier.value
                      ? 'border-blue-500 bg-blue-900 bg-opacity-30'
                      : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                  }`}
                >
                  <input
                    type='radio'
                    name='subscriptionTier'
                    value={tier.value}
                    checked={formData.subscriptionTier === tier.value}
                    onChange={handleInputChange}
                    className='sr-only'
                  />
                  <div className='text-center'>
                    <div className='text-3xl mb-2'>{tier.icon}</div>
                    <div className={`font-semibold ${tier.color}`}>{tier.label}</div>
                    <div className='text-sm text-gray-400 mt-1'>{tier.description}</div>
                  </div>
                  {formData.subscriptionTier === tier.value && (
                    <div className='absolute top-2 right-2 text-blue-400'>
                      <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Send Email Option */}
          <div className='flex items-center'>
            <input
              type='checkbox'
              id='sendEmail'
              name='sendEmail'
              checked={formData.sendEmail}
              onChange={handleInputChange}
              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700'
            />
            <label htmlFor='sendEmail' className='ml-2 text-sm text-gray-300'>
              Send invitation email to user
            </label>
          </div>

          {/* Advanced Options */}
          <div>
            <button
              type='button'
              onClick={() => setShowAdvanced(!showAdvanced)}
              className='flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium'
            >
              <span>{showAdvanced ? '▼' : '▶'}</span>
              <span className='ml-1'>Advanced Options</span>
            </button>

            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className='mt-4 space-y-4 border-t border-gray-600 pt-4'
              >
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label htmlFor='temporaryPassword' className='block text-sm font-medium text-gray-300 mb-2'>
                      Custom Temporary Password
                    </label>
                    <input
                      type='password'
                      id='temporaryPassword'
                      name='temporaryPassword'
                      value={formData.temporaryPassword}
                      onChange={handleInputChange}
                      className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      placeholder='Leave empty for auto-generated'
                    />
                    <p className='text-xs text-gray-400 mt-1'>Leave empty to auto-generate a secure password</p>
                  </div>

                  <div>
                    <label htmlFor='promoSignupId' className='block text-sm font-medium text-gray-300 mb-2'>
                      Promo Signup ID
                    </label>
                    <input
                      type='number'
                      id='promoSignupId'
                      name='promoSignupId'
                      value={formData.promoSignupId}
                      onChange={handleInputChange}
                      className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                      placeholder='Optional'
                    />
                    <p className='text-xs text-gray-400 mt-1'>Link to existing promotional signup</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Submit Button */}
          <div className='flex justify-end'>
            <button
              type='submit'
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isSubmitting ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              } text-white`}
            >
              {isSubmitting ? (
                <div className='flex items-center'>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Provisioning Account...
                </div>
              ) : (
                'Provision Account'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AccountProvisioningForm;
