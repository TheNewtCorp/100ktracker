import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, CreditCard, Key, Save, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import apiService from '../../services/apiService';

interface AccountSettingsPageProps {
  userInfo?: any;
  onUserInfoUpdate?: (updatedInfo: any) => void;
  onBack?: () => void;
}

const AccountSettingsPage: React.FC<AccountSettingsPageProps> = ({ userInfo, onUserInfoUpdate, onBack }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'payment'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showStripeSecretKey, setShowStripeSecretKey] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [stripeForm, setStripeForm] = useState({
    secretKey: '',
    publishableKey: '',
  });

  const [hasStripeConfig, setHasStripeConfig] = useState(false);

  useEffect(() => {
    if (userInfo) {
      setProfileForm({
        username: userInfo.username || '',
        email: userInfo.email || '',
      });
    }

    // Load Stripe configuration on mount
    loadStripeConfig();
  }, [userInfo]);

  const loadStripeConfig = async () => {
    try {
      const response = await apiService.get('/account/stripe');
      if (response.hasStripeConfig !== undefined) {
        setStripeForm({
          secretKey: '', // Never load secret key for security
          publishableKey: response.publishableKey || '',
        });
        setHasStripeConfig(response.hasStripeConfig);
      }
    } catch (err) {
      console.error('Failed to load Stripe config:', err);
    }
  };

  const handleProfileSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiService.put('/account/profile', profileForm);
      setSuccess('Profile updated successfully!');
      if (onUserInfoUpdate) {
        onUserInfoUpdate({ ...userInfo, ...profileForm });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      await apiService.put('/account/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripeSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await apiService.put('/account/stripe', {
        secretKey: stripeForm.secretKey,
        publishableKey: stripeForm.publishableKey,
      });
      setSuccess('Stripe configuration saved successfully!');
      setHasStripeConfig(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save Stripe configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: <User size={20} /> },
    { id: 'security' as const, label: 'Security', icon: <Key size={20} /> },
    { id: 'payment' as const, label: 'Stripe Settings', icon: <CreditCard size={20} /> },
  ];

  return (
    <div className='p-4 sm:p-8 min-h-screen'>
      <div className='max-w-4xl mx-auto'>
        <div className='mb-8'>
          <div className='flex items-center gap-4 mb-4'>
            {onBack && (
              <button
                onClick={onBack}
                className='flex items-center gap-2 text-platinum-silver/70 hover:text-platinum-silver transition-colors'
              >
                <ArrowLeft size={20} />
                <span>Back to Dashboard</span>
              </button>
            )}
          </div>
          <h2 className='text-3xl font-bold text-platinum-silver mb-2'>Account Settings</h2>
          <p className='text-platinum-silver/70'>Manage your account preferences and security settings.</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-crimson-red/10 border border-crimson-red/20 rounded-lg p-4 mb-6'
          >
            <p className='text-crimson-red font-medium'>{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-money-green/10 border border-money-green/20 rounded-lg p-4 mb-6'
          >
            <p className='text-money-green font-medium'>{success}</p>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className='border-b border-champagne-gold/20 mb-8'>
          <nav className='flex space-x-8'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-champagne-gold text-champagne-gold'
                    : 'border-transparent text-platinum-silver/60 hover:text-platinum-silver hover:border-champagne-gold/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'profile' && (
            <div className='bg-charcoal-slate rounded-xl p-6 border border-champagne-gold/10'>
              <h3 className='text-xl font-semibold text-platinum-silver mb-6'>Profile Information</h3>

              <div className='space-y-6'>
                <div>
                  <label className='block text-sm font-medium text-platinum-silver/80 mb-2'>Username</label>
                  <input
                    type='text'
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    className='w-full px-4 py-3 bg-obsidian-black border border-champagne-gold/20 rounded-lg text-platinum-silver placeholder-platinum-silver/40 focus:border-champagne-gold focus:outline-none transition-colors'
                    placeholder='Enter your username'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-platinum-silver/80 mb-2'>
                    <Mail className='inline mr-2' size={16} />
                    Email Address
                  </label>
                  <input
                    type='email'
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className='w-full px-4 py-3 bg-obsidian-black border border-champagne-gold/20 rounded-lg text-platinum-silver placeholder-platinum-silver/40 focus:border-champagne-gold focus:outline-none transition-colors'
                    placeholder='Enter your email address'
                  />
                </div>

                <button
                  onClick={handleProfileSave}
                  disabled={isLoading}
                  className='flex items-center gap-2 bg-champagne-gold text-obsidian-black font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <Save size={20} />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className='bg-charcoal-slate rounded-xl p-6 border border-champagne-gold/10'>
              <h3 className='text-xl font-semibold text-platinum-silver mb-6'>Security Settings</h3>

              <div className='space-y-6'>
                <div>
                  <label className='block text-sm font-medium text-platinum-silver/80 mb-2'>Current Password</label>
                  <div className='relative'>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className='w-full px-4 py-3 bg-obsidian-black border border-champagne-gold/20 rounded-lg text-platinum-silver placeholder-platinum-silver/40 focus:border-champagne-gold focus:outline-none transition-colors pr-12'
                      placeholder='Enter current password'
                    />
                    <button
                      type='button'
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className='absolute right-3 top-1/2 transform -translate-y-1/2 text-platinum-silver/60 hover:text-platinum-silver'
                    >
                      {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-platinum-silver/80 mb-2'>New Password</label>
                  <div className='relative'>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className='w-full px-4 py-3 bg-obsidian-black border border-champagne-gold/20 rounded-lg text-platinum-silver placeholder-platinum-silver/40 focus:border-champagne-gold focus:outline-none transition-colors pr-12'
                      placeholder='Enter new password'
                    />
                    <button
                      type='button'
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className='absolute right-3 top-1/2 transform -translate-y-1/2 text-platinum-silver/60 hover:text-platinum-silver'
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-platinum-silver/80 mb-2'>Confirm New Password</label>
                  <input
                    type='password'
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className='w-full px-4 py-3 bg-obsidian-black border border-champagne-gold/20 rounded-lg text-platinum-silver placeholder-platinum-silver/40 focus:border-champagne-gold focus:outline-none transition-colors'
                    placeholder='Confirm new password'
                  />
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={
                    isLoading ||
                    !passwordForm.currentPassword ||
                    !passwordForm.newPassword ||
                    !passwordForm.confirmPassword
                  }
                  className='flex items-center gap-2 bg-champagne-gold text-obsidian-black font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <Key size={20} />
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className='bg-charcoal-slate rounded-xl p-6 border border-champagne-gold/10'>
              <h3 className='text-xl font-semibold text-platinum-silver mb-6'>Stripe Configuration</h3>

              <div className='mb-6 p-4 bg-obsidian-black rounded-lg border border-champagne-gold/20'>
                <h4 className='text-champagne-gold font-semibold mb-2'>Why do I need to configure Stripe?</h4>
                <p className='text-platinum-silver/70 text-sm leading-relaxed'>
                  To create and manage invoices, you need to connect your own Stripe account. This ensures your payments
                  go directly to you and provides secure, encrypted storage of your API keys.
                </p>
              </div>

              {hasStripeConfig && (
                <div className='mb-6 p-4 bg-money-green/10 rounded-lg border border-money-green/20'>
                  <div className='flex items-center gap-2'>
                    <div className='w-2 h-2 bg-money-green rounded-full'></div>
                    <span className='text-money-green font-medium'>Stripe configured successfully</span>
                  </div>
                </div>
              )}

              <div className='space-y-6'>
                <div>
                  <label className='block text-sm font-medium text-platinum-silver/80 mb-2'>
                    Stripe Publishable Key
                  </label>
                  <input
                    type='text'
                    value={stripeForm.publishableKey}
                    onChange={(e) => setStripeForm({ ...stripeForm, publishableKey: e.target.value })}
                    className='w-full px-4 py-3 bg-obsidian-black border border-champagne-gold/20 rounded-lg text-platinum-silver placeholder-platinum-silver/40 focus:border-champagne-gold focus:outline-none transition-colors'
                    placeholder='pk_test_...'
                  />
                  <p className='text-platinum-silver/60 text-xs mt-1'>
                    Your publishable key (starts with pk_test_ or pk_live_)
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-platinum-silver/80 mb-2'>Stripe Secret Key</label>
                  <div className='relative'>
                    <input
                      type={showStripeSecretKey ? 'text' : 'password'}
                      value={stripeForm.secretKey}
                      onChange={(e) => setStripeForm({ ...stripeForm, secretKey: e.target.value })}
                      className='w-full px-4 py-3 bg-obsidian-black border border-champagne-gold/20 rounded-lg text-platinum-silver placeholder-platinum-silver/40 focus:border-champagne-gold focus:outline-none transition-colors pr-12'
                      placeholder='sk_test_...'
                    />
                    <button
                      type='button'
                      onClick={() => setShowStripeSecretKey(!showStripeSecretKey)}
                      className='absolute right-3 top-1/2 transform -translate-y-1/2 text-platinum-silver/60 hover:text-platinum-silver'
                    >
                      {showStripeSecretKey ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className='text-platinum-silver/60 text-xs mt-1'>
                    Your secret key (starts with sk_test_ or sk_live_) - stored encrypted
                  </p>
                </div>

                <div className='p-4 bg-obsidian-black rounded-lg border border-champagne-gold/20'>
                  <h4 className='text-champagne-gold font-semibold mb-2 text-sm'>How to get your Stripe API keys:</h4>
                  <ol className='text-platinum-silver/70 text-xs space-y-1 list-decimal list-inside'>
                    <li>Log in to your Stripe Dashboard</li>
                    <li>Go to Developers → API keys</li>
                    <li>Copy your Publishable key and Secret key</li>
                    <li>Use test keys for testing, live keys for production</li>
                  </ol>
                </div>

                <button
                  onClick={handleStripeSave}
                  disabled={isLoading || !stripeForm.secretKey || !stripeForm.publishableKey}
                  className='flex items-center gap-2 bg-champagne-gold text-obsidian-black font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <Save size={20} />
                  {isLoading ? 'Saving...' : 'Save Stripe Configuration'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
