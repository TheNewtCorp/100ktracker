import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import UserMenu from './components/UserMenu';
import AccountSettingsPage from './components/pages/AccountSettingsPage';
import OperandiChallengePage from './components/promo/OperandiChallengePage';
import PromoSignupsPage from './components/pages/PromoSignupsPage';
import GeneralAdminDashboard from './components/admin/GeneralAdminDashboard';
import apiService from './services/apiService';
import adminApiService from './services/adminApiService';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Listen for URL changes
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check if this is the Pricing page
  const isPricingPage = currentPath === '/pricing';
  const isPromoAdminPage = currentPath === '/admin/promo-signups';
  const isGeneralAdminPage = currentPath === '/admin/general';

  // On mount, check for token in localStorage
  React.useEffect(() => {
    // Skip auth check for Pricing page only
    if (isPricingPage) return;

    const storedToken = localStorage.getItem('jwtToken');
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
      fetchUserInfo();
    }
  }, [isPricingPage]);

  const handleLogin = useCallback(async (user: string, pass: string) => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const response = await apiService.login(user, pass);
      setIsLoggedIn(true);
      fetchUserInfo(response.token);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }
    setIsLoggingIn(false);
  }, []);

  // Fetch user info from protected endpoint
  const fetchUserInfo = async (jwt?: string) => {
    try {
      if (jwt) {
        apiService.setToken(jwt);
        adminApiService.setToken(jwt); // Also set token for admin API service
      }
      const data = await apiService.getUserInfo();
      setUserInfo(data);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      setUserInfo(null);
      // If token is invalid, clear login state
      handleLogout();
    }
  };

  // Logout function
  const handleLogout = () => {
    apiService.clearToken();
    adminApiService.clearToken();
    setToken(null);
    setIsLoggedIn(false);
    setUserInfo(null);
    setShowAccountSettings(false);
  };

  const handleAccountSettings = () => {
    setShowAccountSettings(true);
  };

  const handleBackToDashboard = () => {
    setShowAccountSettings(false);
  };

  const handleUserInfoUpdate = (updatedInfo: any) => {
    setUserInfo(updatedInfo);
  };

  return (
    <div className='antialiased text-platinum-silver bg-obsidian-black min-h-screen'>
      {/* Handle special pages */}
      {isPricingPage ? (
        <OperandiChallengePage />
      ) : isPromoAdminPage ? (
        // Admin page requires authentication with specific promo admin account
        !isLoggedIn ? (
          <motion.div
            key='admin-login'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className='min-h-screen bg-gray-900 flex items-center justify-center'>
              <div className='max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8'>
                <div className='text-center mb-6'>
                  <h1 className='text-2xl font-bold text-white mb-2'>Promo Admin Access Required</h1>
                  <p className='text-gray-400'>
                    Please log in with the promo admin account to access the Operandi Challenge dashboard.
                  </p>
                </div>
                <LoginPage onLogin={handleLogin} isLoading={isLoggingIn} error={error} />
              </div>
            </div>
          </motion.div>
        ) : userInfo?.username !== '100ktrackeradmin' ? (
          <motion.div
            key='access-denied'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className='min-h-screen bg-gray-900 flex items-center justify-center'>
              <div className='max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8 text-center'>
                <div className='text-red-400 mb-4'>
                  <svg className='w-16 h-16 mx-auto' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <h1 className='text-2xl font-bold text-white mb-2'>Access Denied</h1>
                <p className='text-gray-400 mb-4'>This page is restricted to the promo admin account only.</p>
                <p className='text-sm text-gray-500 mb-6'>Current user: {userInfo?.username}</p>
                <button
                  onClick={handleLogout}
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-900 bg-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                >
                  Log Out & Try Different Account
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className='min-h-screen bg-white'>
            <div className='flex justify-end p-4 bg-gray-900'>
              <UserMenu userInfo={userInfo} onAccountSettings={handleAccountSettings} onLogout={handleLogout} />
            </div>
            <PromoSignupsPage />
          </div>
        )
      ) : isGeneralAdminPage ? (
        // General Admin page requires authentication with specific general admin account
        !isLoggedIn ? (
          <motion.div
            key='general-admin-login'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className='min-h-screen bg-gray-900 flex items-center justify-center'>
              <div className='max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8'>
                <div className='text-center mb-6'>
                  <h1 className='text-2xl font-bold text-white mb-2'>General Admin Access Required</h1>
                  <p className='text-gray-400'>
                    Please log in with the general admin account to access the comprehensive admin dashboard.
                  </p>
                </div>
                <LoginPage onLogin={handleLogin} isLoading={isLoggingIn} error={error} />
              </div>
            </div>
          </motion.div>
        ) : userInfo?.username !== '100ktrackeradmin-general' ? (
          <motion.div
            key='general-access-denied'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className='min-h-screen bg-gray-900 flex items-center justify-center'>
              <div className='max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8 text-center'>
                <div className='text-red-400 mb-4'>
                  <svg className='w-16 h-16 mx-auto' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                <h1 className='text-2xl font-bold text-white mb-2'>Access Denied</h1>
                <p className='text-gray-400 mb-4'>This page is restricted to the general admin account only.</p>
                <p className='text-sm text-gray-500 mb-6'>Current user: {userInfo?.username}</p>
                <div className='space-y-3'>
                  <p className='text-xs text-gray-400'>
                    Need promo admin access?{' '}
                    <a href='/admin/promo-signups' className='text-blue-400 hover:text-blue-300'>
                      Click here
                    </a>
                  </p>
                  <button
                    onClick={handleLogout}
                    className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-900 bg-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                  >
                    Log Out & Try Different Account
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className='min-h-screen bg-gray-900'>
            <div className='flex justify-end p-4 bg-gray-800'>
              <UserMenu userInfo={userInfo} onAccountSettings={handleAccountSettings} onLogout={handleLogout} />
            </div>
            <GeneralAdminDashboard />
          </div>
        )
      ) : (
        <AnimatePresence mode='wait'>
          {!isLoggedIn ? (
            <motion.div
              key='login'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <LoginPage onLogin={handleLogin} isLoading={isLoggingIn} error={error} />
            </motion.div>
          ) : (
            <motion.div
              key='home'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              {/* User Menu in top-right corner */}
              <div className='flex justify-end p-4'>
                <UserMenu userInfo={userInfo} onAccountSettings={handleAccountSettings} onLogout={handleLogout} />
              </div>
              {showAccountSettings ? (
                <AccountSettingsPage
                  userInfo={userInfo}
                  onUserInfoUpdate={handleUserInfoUpdate}
                  onBack={handleBackToDashboard}
                />
              ) : (
                <HomePage />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};
export default App;
