
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface LoginPageProps {
  onLogin: (user: string, pass: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isLoading, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      onLogin(username, password);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-obsidian-black p-4">
      <motion.div 
        className="w-full max-w-md p-8 space-y-8 bg-charcoal-slate rounded-lg shadow-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold text-champagne-gold tracking-wider">
            100KTracker
          </h1>
          <p className="mt-2 text-platinum-silver/70">
            Precision Watch Inventory Management
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 bg-obsidian-black border border-champagne-gold/20 placeholder-platinum-silver/50 text-platinum-silver rounded-t-md focus:outline-none focus:ring-champagne-gold focus:border-champagne-gold focus:z-10 sm:text-sm transition-colors"
                placeholder="Username"
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 bg-obsidian-black border border-champagne-gold/20 placeholder-platinum-silver/50 text-platinum-silver rounded-b-md focus:outline-none focus:ring-champagne-gold focus:border-champagne-gold focus:z-10 sm:text-sm transition-colors"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <motion.p 
              className="text-sm text-center text-crimson-red"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-obsidian-black bg-champagne-gold hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-charcoal-slate focus:ring-champagne-gold transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-obsidian-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
