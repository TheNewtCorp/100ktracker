import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import UserMenu from './components/UserMenu';
import AccountSettingsPage from './components/pages/AccountSettingsPage';
import apiService from './services/apiService';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  // On mount, check for token in localStorage
  React.useEffect(() => {
    const storedToken = localStorage.getItem('jwtToken');
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
      fetchUserInfo();
    }
  }, []);

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
      if (jwt) apiService.setToken(jwt);
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
    </div>
  );
};
export default App;
