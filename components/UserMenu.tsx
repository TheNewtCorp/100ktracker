import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface UserMenuProps {
  userInfo: any;
  onAccountSettings: () => void;
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ userInfo, onAccountSettings, onLogout }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className='relative' ref={menuRef}>
      {/* User Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group ${
          isDark
            ? 'text-platinum-silver/80 hover:text-platinum-silver hover:bg-charcoal-slate/50'
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        <div className='flex items-center gap-2'>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isDark ? 'bg-champagne-gold/20' : 'bg-blue-100'
            }`}
          >
            <User size={16} className={isDark ? 'text-champagne-gold' : 'text-blue-600'} />
          </div>
          <span className='text-sm font-medium'>{userInfo?.username || 'User'}</span>
        </div>
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={`absolute right-0 mt-2 w-64 rounded-xl shadow-xl z-50 ${
              isDark ? 'bg-charcoal-slate border border-champagne-gold/20' : 'bg-white border border-gray-200'
            }`}
          >
            {/* User Info Header */}
            <div className={`px-4 py-3 border-b ${isDark ? 'border-champagne-gold/10' : 'border-gray-200'}`}>
              <div className='flex items-center gap-3'>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-champagne-gold/20' : 'bg-blue-100'
                  }`}
                >
                  <User size={20} className={isDark ? 'text-champagne-gold' : 'text-blue-600'} />
                </div>
                <div>
                  <p className={`font-medium ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                    {userInfo?.username || 'User'}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-platinum-silver/60' : 'text-gray-600'}`}>
                    {userInfo?.email || 'user@example.com'}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className='py-2'>
              <button
                onClick={() => handleMenuItemClick(onAccountSettings)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                  isDark
                    ? 'text-platinum-silver/80 hover:text-platinum-silver hover:bg-obsidian-black/50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Settings size={18} className={isDark ? 'text-champagne-gold' : 'text-blue-600'} />
                <span>Account Settings</span>
              </button>

              <div className={`border-t my-1 ${isDark ? 'border-champagne-gold/10' : 'border-gray-200'}`}></div>

              <button
                onClick={() => handleMenuItemClick(onLogout)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                  isDark
                    ? 'text-crimson-red hover:text-red-400 hover:bg-crimson-red/10'
                    : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                }`}
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserMenu;
