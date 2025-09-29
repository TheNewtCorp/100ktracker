import React, { useState } from 'react';
import type { OperandiSignupData } from '../../types';

interface OperandiSignupFormProps {
  onSubmit: (data: OperandiSignupData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

const OperandiSignupForm: React.FC<OperandiSignupFormProps> = ({ onSubmit, isLoading = false, error = null }) => {
  const [formData, setFormData] = useState<OperandiSignupData>({
    fullName: '',
    email: '',
    phone: '',
    businessName: '',
    referralSource: '',
    experienceLevel: '',
    interests: '',
    comments: '',
  });

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Phone validation (optional but if provided must be valid)
    if (formData.phone.trim()) {
      const phoneRegex = /^[\+]?[1-9][\d]{9,15}$/;
      const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errors.phone = 'Please enter a valid phone number';
      }
    }

    // Business name validation
    if (!formData.businessName.trim()) {
      errors.businessName = 'Business name is required';
    } else if (formData.businessName.trim().length < 2) {
      errors.businessName = 'Business name must be at least 2 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof OperandiSignupData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      // Error handling is done in parent component
      console.error('Form submission error:', err);
    }
  };

  const inputClasses =
    'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
  const errorClasses =
    'w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors bg-red-50';
  const labelClasses = 'block text-sm font-medium text-gray-700 mb-2';
  const errorTextClasses = 'text-sm text-red-600 mt-1';

  return (
    <div className='max-w-2xl mx-auto'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Error message */}
        {error && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <svg className='h-5 w-5 text-red-400' viewBox='0 0 20 20' fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='ml-3'>
                <p className='text-sm text-red-800'>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Full Name */}
        <div>
          <label htmlFor='fullName' className={labelClasses}>
            Full Name <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            id='fullName'
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            className={validationErrors.fullName ? errorClasses : inputClasses}
            placeholder='Enter your full name'
            disabled={isLoading}
          />
          {validationErrors.fullName && <p className={errorTextClasses}>{validationErrors.fullName}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor='email' className={labelClasses}>
            Email Address <span className='text-red-500'>*</span>
          </label>
          <input
            type='email'
            id='email'
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={validationErrors.email ? errorClasses : inputClasses}
            placeholder='Enter your email address'
            disabled={isLoading}
          />
          {validationErrors.email && <p className={errorTextClasses}>{validationErrors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor='phone' className={labelClasses}>
            Phone Number
          </label>
          <input
            type='tel'
            id='phone'
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={validationErrors.phone ? errorClasses : inputClasses}
            placeholder='Enter your phone number (optional)'
            disabled={isLoading}
          />
          {validationErrors.phone && <p className={errorTextClasses}>{validationErrors.phone}</p>}
        </div>

        {/* Business Name */}
        <div>
          <label htmlFor='businessName' className={labelClasses}>
            Business/Company Name <span className='text-red-500'>*</span>
          </label>
          <input
            type='text'
            id='businessName'
            value={formData.businessName}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            className={validationErrors.businessName ? errorClasses : inputClasses}
            placeholder='Enter your business or company name'
            disabled={isLoading}
          />
          {validationErrors.businessName && <p className={errorTextClasses}>{validationErrors.businessName}</p>}
        </div>

        {/* How did you hear about us */}
        <div>
          <label htmlFor='referralSource' className={labelClasses}>
            How did you hear about the Operandi Challenge?
          </label>
          <select
            id='referralSource'
            value={formData.referralSource}
            onChange={(e) => handleInputChange('referralSource', e.target.value)}
            className={inputClasses}
            disabled={isLoading}
          >
            <option value=''>Select an option</option>
            <option value='operandi-website'>Operandi Website</option>
            <option value='social-media'>Social Media</option>
            <option value='email-newsletter'>Email Newsletter</option>
            <option value='word-of-mouth'>Word of Mouth</option>
            <option value='industry-event'>Industry Event</option>
            <option value='partner-referral'>Partner/Referral</option>
            <option value='search-engine'>Search Engine</option>
            <option value='other'>Other</option>
          </select>
        </div>

        {/* Experience Level */}
        <div>
          <label htmlFor='experienceLevel' className={labelClasses}>
            Watch Trading Experience Level
          </label>
          <select
            id='experienceLevel'
            value={formData.experienceLevel}
            onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
            className={inputClasses}
            disabled={isLoading}
          >
            <option value=''>Select your experience level</option>
            <option value='beginner'>Beginner (New to watch trading)</option>
            <option value='intermediate'>Intermediate (1-3 years experience)</option>
            <option value='experienced'>Experienced (3-5 years experience)</option>
            <option value='expert'>Expert (5+ years experience)</option>
            <option value='collector'>Collector/Enthusiast</option>
            <option value='dealer'>Professional Dealer</option>
          </select>
        </div>

        {/* Interests */}
        <div>
          <label htmlFor='interests' className={labelClasses}>
            Specific Interests or Goals
          </label>
          <textarea
            id='interests'
            value={formData.interests}
            onChange={(e) => handleInputChange('interests', e.target.value)}
            className={inputClasses}
            placeholder='Tell us about your specific interests in watches, trading goals, or what you hope to achieve with 100ktracker...'
            rows={3}
            disabled={isLoading}
          />
        </div>

        {/* Comments */}
        <div>
          <label htmlFor='comments' className={labelClasses}>
            Additional Comments
          </label>
          <textarea
            id='comments'
            value={formData.comments}
            onChange={(e) => handleInputChange('comments', e.target.value)}
            className={inputClasses}
            placeholder="Any additional information you'd like to share..."
            rows={3}
            disabled={isLoading}
          />
        </div>

        {/* Submit Button */}
        <div className='pt-4'>
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
                <svg
                  className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                >
                  <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  ></path>
                </svg>
                Submitting...
              </div>
            ) : (
              'Join the Operandi Challenge'
            )}
          </button>
        </div>

        {/* Terms */}
        <div className='text-sm text-gray-600 text-center'>
          <p>
            By submitting this form, you agree to be contacted regarding the Operandi Challenge and acknowledge that
            your information will be reviewed by our team.
          </p>
        </div>
      </form>
    </div>
  );
};

export default OperandiSignupForm;
