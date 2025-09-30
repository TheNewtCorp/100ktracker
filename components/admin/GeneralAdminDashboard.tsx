import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AccountProvisioningForm from './AccountProvisioningForm';
import UserManagementTable from './UserManagementTable';
import ProvisioningAuditLogs from './ProvisioningAuditLogs';
import adminApiService from '../../services/adminApiService';

interface DashboardStats {
  totalUsers: number;
  totalPromoSignups: number;
  recentProvisioningAttempts: number;
  activeSubscriptions: {
    free: number;
    platinum: number;
    operandi: number;
  };
}

const GeneralAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'provision' | 'users' | 'audit'>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await adminApiService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load dashboard stats:', err);
      setError(err.message || 'Failed to load dashboard statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'provision', label: 'Provision Account', icon: '➕' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'audit', label: 'Audit Logs', icon: '📋' },
  ] as const;

  const StatCard: React.FC<{ title: string; value: number | string; icon: string; className?: string }> = ({
    title,
    value,
    icon,
    className = '',
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}
    >
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-gray-400 text-sm font-medium'>{title}</p>
          <p className='text-3xl font-bold text-white mt-2'>{value}</p>
        </div>
        <div className='text-4xl'>{icon}</div>
      </div>
    </motion.div>
  );

  const OverviewTab = () => (
    <div className='space-y-6'>
      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <StatCard
          title='Total Users'
          value={stats?.totalUsers || 0}
          icon='👥'
          className='hover:bg-gray-750 transition-colors'
        />
        <StatCard
          title='Promo Signups'
          value={stats?.totalPromoSignups || 0}
          icon='🎯'
          className='hover:bg-gray-750 transition-colors'
        />
        <StatCard
          title='Recent Provisioning'
          value={stats?.recentProvisioningAttempts || 0}
          icon='⚡'
          className='hover:bg-gray-750 transition-colors'
        />
        <StatCard
          title='Active Subscriptions'
          value={
            stats
              ? stats.activeSubscriptions.free + stats.activeSubscriptions.platinum + stats.activeSubscriptions.operandi
              : 0
          }
          icon='💎'
          className='hover:bg-gray-750 transition-colors'
        />
      </div>

      {/* Subscription Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='bg-gray-800 rounded-lg p-6 border border-gray-700'
      >
        <h3 className='text-xl font-semibold text-white mb-4'>Subscription Breakdown</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='text-center p-4 bg-gray-700 rounded-lg'>
            <div className='text-2xl mb-2'>🆓</div>
            <div className='text-2xl font-bold text-blue-400'>{stats?.activeSubscriptions.free || 0}</div>
            <div className='text-gray-300 text-sm'>Free Tier</div>
          </div>
          <div className='text-center p-4 bg-gray-700 rounded-lg'>
            <div className='text-2xl mb-2'>💎</div>
            <div className='text-2xl font-bold text-purple-400'>{stats?.activeSubscriptions.platinum || 0}</div>
            <div className='text-gray-300 text-sm'>Platinum</div>
          </div>
          <div className='text-center p-4 bg-gray-700 rounded-lg'>
            <div className='text-2xl mb-2'>🎯</div>
            <div className='text-2xl font-bold text-amber-400'>{stats?.activeSubscriptions.operandi || 0}</div>
            <div className='text-gray-300 text-sm'>Operandi</div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='bg-gray-800 rounded-lg p-6 border border-gray-700'
      >
        <h3 className='text-xl font-semibold text-white mb-4'>Quick Actions</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <button
            onClick={() => setActiveTab('provision')}
            className='flex items-center justify-center p-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors'
          >
            <span className='text-2xl mr-3'>➕</span>
            <span className='font-medium text-white'>Create New Account</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className='flex items-center justify-center p-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors'
          >
            <span className='text-2xl mr-3'>👥</span>
            <span className='font-medium text-white'>Manage Users</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className='flex items-center justify-center p-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors'
          >
            <span className='text-2xl mr-3'>📋</span>
            <span className='font-medium text-white'>View Audit Logs</span>
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className='min-h-screen bg-gray-900'>
      {/* Header */}
      <div className='bg-gray-800 border-b border-gray-700 px-6 py-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-white'>General Admin Dashboard</h1>
            <p className='text-gray-400 mt-1'>Comprehensive account provisioning and user management</p>
          </div>
          <div className='flex items-center space-x-2 text-sm text-gray-400'>
            <span className='w-2 h-2 bg-green-400 rounded-full'></span>
            <span>System Online</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className='bg-gray-800 border-b border-gray-700 px-6'>
        <nav className='flex space-x-8'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className='p-6'>
        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
            <span className='ml-3 text-gray-400'>Loading dashboard...</span>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-red-900 border border-red-700 rounded-lg p-6 text-center'
          >
            <div className='text-red-400 text-4xl mb-4'>⚠️</div>
            <h3 className='text-xl font-semibold text-red-400 mb-2'>Dashboard Error</h3>
            <p className='text-red-300 mb-4'>{error}</p>
            <button
              onClick={loadDashboardStats}
              className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors'
            >
              Retry
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'provision' && <AccountProvisioningForm onSuccess={loadDashboardStats} />}
            {activeTab === 'users' && <UserManagementTable />}
            {activeTab === 'audit' && <ProvisioningAuditLogs />}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GeneralAdminDashboard;
