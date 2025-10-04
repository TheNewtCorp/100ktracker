import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  CreditCard,
  Key,
  Save,
  Eye,
  EyeOff,
  ArrowLeft,
  Crown,
  Shield,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import apiService from '../../services/apiService';
import { useTheme } from '../../hooks/useTheme';

interface AccountSettingsPageProps {
  userInfo?: any;
  onUserInfoUpdate?: (updatedInfo: any) => void;
  onBack?: () => void;
}

const AccountSettingsPage: React.FC<AccountSettingsPageProps> = ({ userInfo, onUserInfoUpdate, onBack }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'subscription' | 'payment'>('profile');
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

  // Subscription state
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  useEffect(() => {
    if (userInfo) {
      setProfileForm({
        username: userInfo.username || '',
        email: userInfo.email || '',
      });
    }

    // Load configurations on mount
    loadStripeConfig();
    loadSubscription();
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

  const loadSubscription = async () => {
    setSubscriptionLoading(true);
    try {
      const response = await apiService.get('/account/subscription');
      setSubscription(response);
    } catch (err) {
      console.error('Failed to load subscription:', err);
      // Set default free tier if API fails
      setSubscription({
        tier: 'free',
        tierName: 'Basic Plan',
        price: 0,
        status: 'free',
        startDate: null,
        endDate: null,
        isActive: false,
        isExpired: false,
        daysRemaining: null,
      });
    } finally {
      setSubscriptionLoading(false);
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
    { id: 'subscription' as const, label: 'Subscription', icon: <Crown size={20} /> },
    { id: 'payment' as const, label: 'Stripe Settings', icon: <CreditCard size={20} /> },
  ];

  return (
    <div className={`p-4 sm:p-8 min-h-screen ${isDark ? '' : 'bg-gray-50'}`}>
      <div className='max-w-4xl mx-auto'>
        <div className='mb-8'>
          <div className='flex items-center gap-4 mb-4'>
            {onBack && (
              <button
                onClick={onBack}
                className={`flex items-center gap-2 transition-colors ${
                  isDark ? 'text-platinum-silver/70 hover:text-platinum-silver' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <ArrowLeft size={20} />
                <span>Back to Dashboard</span>
              </button>
            )}
          </div>
          <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
            Account Settings
          </h2>
          <p className={isDark ? 'text-platinum-silver/70' : 'text-gray-600'}>
            Manage your account preferences and security settings.
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg p-4 mb-6 ${
              isDark ? 'bg-crimson-red/10 border border-crimson-red/20' : 'bg-red-50 border border-red-200'
            }`}
          >
            <p className={`font-medium ${isDark ? 'text-crimson-red' : 'text-red-700'}`}>{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg p-4 mb-6 ${
              isDark ? 'bg-money-green/10 border border-money-green/20' : 'bg-green-50 border border-green-200'
            }`}
          >
            <p className={`font-medium ${isDark ? 'text-money-green' : 'text-green-700'}`}>{success}</p>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className={`border-b mb-8 ${isDark ? 'border-champagne-gold/20' : 'border-gray-200'}`}>
          <nav className='flex space-x-8'>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? isDark
                      ? 'border-champagne-gold text-champagne-gold'
                      : 'border-blue-600 text-blue-600'
                    : isDark
                      ? 'border-transparent text-platinum-silver/60 hover:text-platinum-silver hover:border-champagne-gold/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
            <div
              className={`rounded-xl p-6 border ${isDark ? 'bg-charcoal-slate border-champagne-gold/10' : 'bg-white border-gray-200'}`}
            >
              <h3 className={`text-xl font-semibold mb-6 ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                Profile Information
              </h3>

              <div className='space-y-6'>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDark ? 'text-platinum-silver/80' : 'text-gray-700'}`}
                  >
                    Username
                  </label>
                  <input
                    type='text'
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none ${
                      isDark
                        ? 'bg-obsidian-black border-champagne-gold/20 text-platinum-silver placeholder-platinum-silver/40 focus:border-champagne-gold'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    }`}
                    placeholder='Enter your username'
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDark ? 'text-platinum-silver/80' : 'text-gray-700'}`}
                  >
                    <Mail className='inline mr-2' size={16} />
                    Email Address
                  </label>
                  <input
                    type='email'
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none ${
                      isDark
                        ? 'bg-obsidian-black border-champagne-gold/20 text-platinum-silver placeholder-platinum-silver/40 focus:border-champagne-gold'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    }`}
                    placeholder='Enter your email address'
                  />
                </div>

                <button
                  onClick={handleProfileSave}
                  disabled={isLoading}
                  className={`flex items-center gap-2 font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark
                      ? 'bg-champagne-gold text-obsidian-black hover:bg-opacity-90'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Save size={20} />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div
              className={`rounded-xl p-6 border ${isDark ? 'bg-charcoal-slate border-champagne-gold/10' : 'bg-white border-gray-200'}`}
            >
              <h3 className={`text-xl font-semibold mb-6 ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                Security Settings
              </h3>

              <div className='space-y-6'>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDark ? 'text-platinum-silver/80' : 'text-gray-700'}`}
                  >
                    Current Password
                  </label>
                  <div className='relative'>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none pr-12 ${
                        isDark
                          ? 'bg-obsidian-black border-champagne-gold/20 text-platinum-silver placeholder-platinum-silver/40 focus:border-champagne-gold'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                      }`}
                      placeholder='Enter current password'
                    />
                    <button
                      type='button'
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                        isDark
                          ? 'text-platinum-silver/60 hover:text-platinum-silver'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDark ? 'text-platinum-silver/80' : 'text-gray-700'}`}
                  >
                    New Password
                  </label>
                  <div className='relative'>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none pr-12 ${
                        isDark
                          ? 'bg-obsidian-black border-champagne-gold/20 text-platinum-silver placeholder-platinum-silver/40 focus:border-champagne-gold'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                      }`}
                      placeholder='Enter new password'
                    />
                    <button
                      type='button'
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                        isDark
                          ? 'text-platinum-silver/60 hover:text-platinum-silver'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDark ? 'text-platinum-silver/80' : 'text-gray-700'}`}
                  >
                    Confirm New Password
                  </label>
                  <input
                    type='password'
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none ${
                      isDark
                        ? 'bg-obsidian-black border-champagne-gold/20 text-platinum-silver placeholder-platinum-silver/40 focus:border-champagne-gold'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    }`}
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
                  className={`flex items-center gap-2 font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark
                      ? 'bg-champagne-gold text-obsidian-black hover:bg-opacity-90'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <Key size={20} />
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className='space-y-6'>
              {/* Plan Overview Card */}
              <div
                className={`rounded-xl p-6 border ${isDark ? 'bg-charcoal-slate border-champagne-gold/10' : 'bg-white border-gray-200'}`}
              >
                <div className='flex items-center justify-between mb-6'>
                  <h3 className={`text-xl font-semibold ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                    Current Plan
                  </h3>
                  {subscription?.status === 'active' && (
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                        isDark ? 'bg-money-green/20 border-money-green/40' : 'bg-green-100 border-green-300'
                      }`}
                    >
                      <CheckCircle size={16} className={isDark ? 'text-money-green' : 'text-green-600'} />
                      <span className={`font-medium text-sm ${isDark ? 'text-money-green' : 'text-green-600'}`}>
                        Active
                      </span>
                    </div>
                  )}
                  {subscription?.status === 'past_due' && (
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                        isDark ? 'bg-yellow-500/20 border-yellow-500/40' : 'bg-yellow-100 border-yellow-300'
                      }`}
                    >
                      <AlertCircle size={16} className={isDark ? 'text-yellow-500' : 'text-yellow-600'} />
                      <span className={`font-medium text-sm ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`}>
                        Past Due
                      </span>
                    </div>
                  )}
                  {subscription?.status === 'canceled' && (
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                        isDark ? 'bg-crimson-red/20 border-crimson-red/40' : 'bg-red-100 border-red-300'
                      }`}
                    >
                      <XCircle size={16} className={isDark ? 'text-crimson-red' : 'text-red-600'} />
                      <span className={`font-medium text-sm ${isDark ? 'text-crimson-red' : 'text-red-600'}`}>
                        Canceled
                      </span>
                    </div>
                  )}
                  {(subscription?.status === 'free' || !subscription?.status) && (
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
                        isDark ? 'bg-platinum-silver/20 border-platinum-silver/40' : 'bg-gray-100 border-gray-300'
                      }`}
                    >
                      <Shield size={16} className={isDark ? 'text-platinum-silver' : 'text-gray-600'} />
                      <span className={`font-medium text-sm ${isDark ? 'text-platinum-silver' : 'text-gray-600'}`}>
                        Free
                      </span>
                    </div>
                  )}
                </div>

                {subscriptionLoading ? (
                  <div className='flex items-center justify-center py-8'>
                    <div
                      className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                        isDark ? 'border-champagne-gold' : 'border-blue-600'
                      }`}
                    ></div>
                  </div>
                ) : (
                  <div className='grid md:grid-cols-2 gap-6'>
                    {/* Plan Details */}
                    <div>
                      <div className='flex items-center gap-3 mb-4'>
                        {subscription?.tier === 'platinum' && (
                          <div
                            className={`p-2 rounded-lg border ${
                              isDark
                                ? 'bg-champagne-gold/20 border-champagne-gold/40'
                                : 'bg-yellow-100 border-yellow-300'
                            }`}
                          >
                            <Crown size={24} className={isDark ? 'text-champagne-gold' : 'text-yellow-600'} />
                          </div>
                        )}
                        {subscription?.tier === 'operandi' && (
                          <div
                            className={`p-2 rounded-lg border ${
                              isDark ? 'bg-platinum-silver/20 border-platinum-silver/40' : 'bg-gray-100 border-gray-300'
                            }`}
                          >
                            <Shield size={24} className={isDark ? 'text-platinum-silver' : 'text-gray-600'} />
                          </div>
                        )}
                        {(subscription?.tier === 'free' || !subscription?.tier) && (
                          <div
                            className={`p-2 rounded-lg border ${
                              isDark ? 'bg-obsidian-black/50 border-platinum-silver/20' : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <User size={24} className={isDark ? 'text-platinum-silver/60' : 'text-gray-500'} />
                          </div>
                        )}
                        <div>
                          <h4 className={`text-lg font-semibold ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                            {subscription?.tierName || 'Basic Plan'}
                          </h4>
                          <p className={`text-sm ${isDark ? 'text-platinum-silver/60' : 'text-gray-600'}`}>
                            {subscription?.tierDescription || 'Basic watch tracking functionality'}
                          </p>
                        </div>
                      </div>

                      <div className='space-y-3'>
                        <div className='flex justify-between items-center'>
                          <span className={isDark ? 'text-platinum-silver/70' : 'text-gray-600'}>Monthly Price:</span>
                          <span className={`font-semibold ${isDark ? 'text-champagne-gold' : 'text-blue-600'}`}>
                            ${subscription?.price || 0}/month
                          </span>
                        </div>
                        <div className={`text-xs mt-0.5 ${isDark ? 'text-platinum-silver/50' : 'text-gray-500'}`}>
                          Introductory Rate
                        </div>

                        {subscription?.startDate && (
                          <div className='flex justify-between items-center'>
                            <span className={isDark ? 'text-platinum-silver/70' : 'text-gray-600'}>Started:</span>
                            <span className={isDark ? 'text-platinum-silver' : 'text-gray-900'}>
                              {new Date(subscription.startDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        {subscription?.endDate && (
                          <div className='flex justify-between items-center'>
                            <span className={isDark ? 'text-platinum-silver/70' : 'text-gray-600'}>
                              {subscription?.status === 'active' ? 'Next Billing:' : 'Ended:'}
                            </span>
                            <span className={isDark ? 'text-platinum-silver' : 'text-gray-900'}>
                              {new Date(subscription.endDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}

                        {subscription?.daysRemaining !== null && subscription?.daysRemaining > 0 && (
                          <div className='flex justify-between items-center'>
                            <span className={isDark ? 'text-platinum-silver/70' : 'text-gray-600'}>
                              Days Remaining:
                            </span>
                            <span className={`font-medium ${isDark ? 'text-money-green' : 'text-green-600'}`}>
                              {subscription.daysRemaining} days
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Plan Features */}
                    <div
                      className={`rounded-lg p-4 border ${
                        isDark ? 'bg-obsidian-black border-champagne-gold/20' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <h5 className={`font-semibold mb-3 ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                        Plan Features
                      </h5>
                      <div className='space-y-2'>
                        {subscription?.tier === 'platinum' && (
                          <>
                            <div
                              className={`flex items-center gap-2 text-sm ${isDark ? 'text-platinum-silver' : 'text-gray-700'}`}
                            >
                              <CheckCircle size={16} className={isDark ? 'text-money-green' : 'text-green-600'} />
                              <span>Unlimited watch tracking</span>
                            </div>
                            <div
                              className={`flex items-center gap-2 text-sm ${isDark ? 'text-platinum-silver' : 'text-gray-700'}`}
                            >
                              <CheckCircle size={16} className={isDark ? 'text-money-green' : 'text-green-600'} />
                              <span>Advanced analytics & reports</span>
                            </div>
                            <div
                              className={`flex items-center gap-2 text-sm ${isDark ? 'text-platinum-silver' : 'text-gray-700'}`}
                            >
                              <CheckCircle size={16} className={isDark ? 'text-money-green' : 'text-green-600'} />
                              <span>Invoice management</span>
                            </div>
                            <div
                              className={`flex items-center gap-2 text-sm ${isDark ? 'text-platinum-silver' : 'text-gray-700'}`}
                            >
                              <CheckCircle size={16} className={isDark ? 'text-money-green' : 'text-green-600'} />
                              <span>Priority support</span>
                            </div>
                          </>
                        )}
                        {subscription?.tier === 'operandi' && (
                          <>
                            <div
                              className={`flex items-center gap-2 text-sm ${isDark ? 'text-platinum-silver' : 'text-gray-700'}`}
                            >
                              <CheckCircle size={16} className={isDark ? 'text-money-green' : 'text-green-600'} />
                              <span>Enhanced watch tracking</span>
                            </div>
                            <div
                              className={`flex items-center gap-2 text-sm ${isDark ? 'text-platinum-silver' : 'text-gray-700'}`}
                            >
                              <CheckCircle size={16} className={isDark ? 'text-money-green' : 'text-green-600'} />
                              <span>Challenge tracking tools</span>
                            </div>
                            <div
                              className={`flex items-center gap-2 text-sm ${isDark ? 'text-platinum-silver' : 'text-gray-700'}`}
                            >
                              <CheckCircle size={16} className={isDark ? 'text-money-green' : 'text-green-600'} />
                              <span>Basic analytics</span>
                            </div>
                            <div
                              className={`flex items-center gap-2 text-sm ${isDark ? 'text-platinum-silver' : 'text-gray-700'}`}
                            >
                              <CheckCircle size={16} className={isDark ? 'text-money-green' : 'text-green-600'} />
                              <span>Standard support</span>
                            </div>
                          </>
                        )}
                        {(subscription?.tier === 'free' || !subscription?.tier) && (
                          <>
                            <div
                              className={`flex items-center gap-2 text-sm ${isDark ? 'text-platinum-silver/60' : 'text-gray-500'}`}
                            >
                              <CheckCircle size={16} className={isDark ? 'text-platinum-silver/40' : 'text-gray-400'} />
                              <span>Basic watch tracking</span>
                            </div>
                            <div
                              className={`flex items-center gap-2 text-sm ${isDark ? 'text-platinum-silver/60' : 'text-gray-500'}`}
                            >
                              <CheckCircle size={16} className={isDark ? 'text-platinum-silver/40' : 'text-gray-400'} />
                              <span>Limited storage</span>
                            </div>
                            <div
                              className={`flex items-center gap-2 text-sm ${isDark ? 'text-platinum-silver/60' : 'text-gray-500'}`}
                            >
                              <CheckCircle size={16} className={isDark ? 'text-platinum-silver/40' : 'text-gray-400'} />
                              <span>Community support</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Billing Information */}
              {subscription?.status !== 'free' && subscription?.tier !== 'free' && (
                <div
                  className={`rounded-xl p-6 border ${isDark ? 'bg-charcoal-slate border-champagne-gold/10' : 'bg-white border-gray-200'}`}
                >
                  <div className='flex items-center gap-2 mb-4'>
                    <Calendar size={20} className={isDark ? 'text-champagne-gold' : 'text-blue-600'} />
                    <h3 className={`text-xl font-semibold ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                      Billing Information
                    </h3>
                  </div>

                  <div className='grid md:grid-cols-3 gap-4'>
                    <div
                      className={`rounded-lg p-4 border ${
                        isDark ? 'bg-obsidian-black border-champagne-gold/20' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className='flex items-center gap-2 mb-2'>
                        <Clock size={16} className={isDark ? 'text-platinum-silver/60' : 'text-gray-500'} />
                        <span className={`text-sm ${isDark ? 'text-platinum-silver/70' : 'text-gray-600'}`}>
                          Billing Cycle
                        </span>
                      </div>
                      <p className={`font-semibold ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>Monthly</p>
                    </div>

                    <div
                      className={`rounded-lg p-4 border ${
                        isDark ? 'bg-obsidian-black border-champagne-gold/20' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className='flex items-center gap-2 mb-2'>
                        <CreditCard size={16} className={isDark ? 'text-platinum-silver/60' : 'text-gray-500'} />
                        <span className={`text-sm ${isDark ? 'text-platinum-silver/70' : 'text-gray-600'}`}>
                          Amount
                        </span>
                      </div>
                      <p className={`font-semibold ${isDark ? 'text-champagne-gold' : 'text-blue-600'}`}>
                        ${subscription?.price || 0}.00
                      </p>
                    </div>

                    <div
                      className={`rounded-lg p-4 border ${
                        isDark ? 'bg-obsidian-black border-champagne-gold/20' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className='flex items-center gap-2 mb-2'>
                        <Calendar size={16} className={isDark ? 'text-platinum-silver/60' : 'text-gray-500'} />
                        <span className={`text-sm ${isDark ? 'text-platinum-silver/70' : 'text-gray-600'}`}>
                          {subscription?.status === 'active' ? 'Next Billing' : 'Last Billed'}
                        </span>
                      </div>
                      <p className={`font-semibold ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                        {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Support Contact */}
              <div
                className={`rounded-xl p-6 border ${isDark ? 'bg-charcoal-slate border-champagne-gold/10' : 'bg-white border-gray-200'}`}
              >
                <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                  Need Help?
                </h3>
                <div
                  className={`rounded-lg p-4 border ${
                    isDark ? 'bg-obsidian-black border-champagne-gold/20' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <p className={`text-sm mb-4 leading-relaxed ${isDark ? 'text-platinum-silver/70' : 'text-gray-600'}`}>
                    For billing questions, plan changes, or subscription support, please contact our team. We're here to
                    help you get the most out of your 100K Tracker experience.
                  </p>
                  <div className='flex flex-col sm:flex-row gap-3'>
                    <button
                      onClick={() => window.open('mailto:support@100ktracker.com?subject=Subscription Support')}
                      className={`flex items-center justify-center gap-2 font-medium py-2 px-4 rounded-lg transition-all duration-300 ${
                        isDark
                          ? 'bg-champagne-gold text-obsidian-black hover:bg-opacity-90'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      <Mail size={16} />
                      Email Support
                    </button>
                    <button
                      onClick={() => setActiveTab('payment')}
                      className={`flex items-center justify-center gap-2 font-medium py-2 px-4 rounded-lg border transition-all duration-300 ${
                        isDark
                          ? 'bg-obsidian-black border-champagne-gold/40 text-champagne-gold hover:bg-champagne-gold/10'
                          : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <CreditCard size={16} />
                      Manage Stripe Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div
              className={`rounded-xl p-6 border ${isDark ? 'bg-charcoal-slate border-champagne-gold/10' : 'bg-white border-gray-200'}`}
            >
              <h3 className={`text-xl font-semibold mb-6 ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                Stripe Configuration
              </h3>

              <div
                className={`mb-6 p-4 rounded-lg border ${
                  isDark ? 'bg-obsidian-black border-champagne-gold/20' : 'bg-blue-50 border-blue-200'
                }`}
              >
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-champagne-gold' : 'text-blue-600'}`}>
                  Why do I need to configure Stripe?
                </h4>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-platinum-silver/70' : 'text-gray-600'}`}>
                  To create and manage invoices, you need to connect your own Stripe account. This ensures your payments
                  go directly to you and provides secure, encrypted storage of your API keys.
                </p>
              </div>

              {hasStripeConfig && (
                <div
                  className={`mb-6 p-4 rounded-lg border ${
                    isDark ? 'bg-money-green/10 border-money-green/20' : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className='flex items-center gap-2'>
                    <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-money-green' : 'bg-green-600'}`}></div>
                    <span className={`font-medium ${isDark ? 'text-money-green' : 'text-green-600'}`}>
                      Stripe configured successfully
                    </span>
                  </div>
                </div>
              )}

              <div className='space-y-6'>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDark ? 'text-platinum-silver/80' : 'text-gray-700'}`}
                  >
                    Stripe Publishable Key
                  </label>
                  <input
                    type='text'
                    value={stripeForm.publishableKey}
                    onChange={(e) => setStripeForm({ ...stripeForm, publishableKey: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none ${
                      isDark
                        ? 'bg-obsidian-black border-champagne-gold/20 text-platinum-silver placeholder-platinum-silver/40 focus:border-champagne-gold'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    }`}
                    placeholder='pk_test_...'
                  />
                  <p className={`text-xs mt-1 ${isDark ? 'text-platinum-silver/60' : 'text-gray-500'}`}>
                    Your publishable key (starts with pk_test_ or pk_live_)
                  </p>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${isDark ? 'text-platinum-silver/80' : 'text-gray-700'}`}
                  >
                    Stripe Secret Key
                  </label>
                  <div className='relative'>
                    <input
                      type={showStripeSecretKey ? 'text' : 'password'}
                      value={stripeForm.secretKey}
                      onChange={(e) => setStripeForm({ ...stripeForm, secretKey: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg transition-colors focus:outline-none pr-12 ${
                        isDark
                          ? 'bg-obsidian-black border-champagne-gold/20 text-platinum-silver placeholder-platinum-silver/40 focus:border-champagne-gold'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                      }`}
                      placeholder='sk_test_...'
                    />
                    <button
                      type='button'
                      onClick={() => setShowStripeSecretKey(!showStripeSecretKey)}
                      className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                        isDark
                          ? 'text-platinum-silver/60 hover:text-platinum-silver'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {showStripeSecretKey ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-platinum-silver/60' : 'text-gray-500'}`}>
                    Your secret key (starts with sk_test_ or sk_live_) - stored encrypted
                  </p>
                </div>

                <div
                  className={`p-4 rounded-lg border ${
                    isDark ? 'bg-obsidian-black border-champagne-gold/20' : 'bg-yellow-50 border-yellow-200'
                  }`}
                >
                  <h4 className={`font-semibold mb-2 text-sm ${isDark ? 'text-champagne-gold' : 'text-yellow-600'}`}>
                    How to get your Stripe API keys:
                  </h4>
                  <ol
                    className={`text-xs space-y-1 list-decimal list-inside ${isDark ? 'text-platinum-silver/70' : 'text-gray-600'}`}
                  >
                    <li>Log in to your Stripe Dashboard</li>
                    <li>Go to Developers → API keys</li>
                    <li>Copy your Publishable key and Secret key</li>
                    <li>Use test keys for testing, live keys for production</li>
                  </ol>
                </div>

                <button
                  onClick={handleStripeSave}
                  disabled={isLoading || !stripeForm.secretKey || !stripeForm.publishableKey}
                  className={`flex items-center gap-2 font-bold py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isDark
                      ? 'bg-champagne-gold text-obsidian-black hover:bg-opacity-90'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
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
