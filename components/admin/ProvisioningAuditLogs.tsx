import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import adminApiService from '../../services/adminApiService';

interface AuditLog {
  id: number;
  email: string;
  full_name?: string;
  subscription_tier?: string;
  admin_user: string;
  step_completed: string;
  success: boolean;
  error_message?: string;
  created_at: string;
}

interface ProvisioningStats {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  recentActivity: number;
  topAdminUsers: Array<{ admin_user: string; count: number }>;
  stepBreakdown: Array<{ step: string; count: number }>;
}

const ProvisioningAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<ProvisioningStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [emailFilter, setEmailFilter] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [stepFilter, setStepFilter] = useState('all');
  const [successFilter, setSuccessFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadData();
  }, [currentPage, emailFilter, adminFilter, stepFilter, successFilter, dateRange]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load logs and stats in parallel
      const [logsData, statsData] = await Promise.all([
        adminApiService.getProvisioningAuditLogs({
          page: currentPage,
          limit: itemsPerPage,
          email: emailFilter || undefined,
          adminUser: adminFilter || undefined,
          stepCompleted: stepFilter !== 'all' ? stepFilter : undefined,
          success: successFilter !== 'all' ? successFilter === 'success' : undefined,
          dateFrom: dateRange.from || undefined,
          dateTo: dateRange.to || undefined,
        }),
        adminApiService.getProvisioningStats(),
      ]);

      setLogs(logsData.logs);
      setTotalPages(logsData.totalPages);
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to load audit data:', err);
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepIcon = (step: string) => {
    const icons = {
      started: '🚀',
      validation: '✅',
      account_created: '👤',
      email_sent: '📧',
      completed: '🎉',
      failed: '❌',
      rollback: '🔄',
      rollback_failed: '💥',
    };
    return icons[step as keyof typeof icons] || '📋';
  };

  const getStepColor = (step: string, success: boolean) => {
    if (!success) return 'text-red-400';

    const colors = {
      started: 'text-blue-400',
      validation: 'text-green-400',
      account_created: 'text-purple-400',
      email_sent: 'text-yellow-400',
      completed: 'text-green-400',
      rollback: 'text-orange-400',
    };
    return colors[step as keyof typeof colors] || 'text-gray-400';
  };

  const StatCard: React.FC<{ title: string; value: number; icon: string; className?: string }> = ({
    title,
    value,
    icon,
    className = '',
  }) => (
    <div className={`bg-gray-700 rounded-lg p-4 ${className}`}>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-gray-400 text-sm'>{title}</p>
          <p className='text-2xl font-bold text-white'>{value}</p>
        </div>
        <div className='text-2xl'>{icon}</div>
      </div>
    </div>
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='text-center'>
        <h2 className='text-3xl font-bold text-white mb-2'>Provisioning Audit Logs</h2>
        <p className='text-gray-400'>Track all account provisioning attempts and system activity</p>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-gray-800 rounded-lg p-6 border border-gray-700'
        >
          <h3 className='text-xl font-semibold text-white mb-4'>Provisioning Statistics</h3>

          <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
            <StatCard title='Total Attempts' value={stats.totalAttempts} icon='📊' />
            <StatCard
              title='Successful'
              value={stats.successfulAttempts}
              icon='✅'
              className='border-l-4 border-green-500'
            />
            <StatCard title='Failed' value={stats.failedAttempts} icon='❌' className='border-l-4 border-red-500' />
            <StatCard
              title='Recent Activity'
              value={stats.recentActivity}
              icon='⚡'
              className='border-l-4 border-blue-500'
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Top Admin Users */}
            <div>
              <h4 className='text-lg font-medium text-white mb-3'>Top Admin Users</h4>
              <div className='space-y-2'>
                {stats.topAdminUsers.map((admin, index) => (
                  <div key={admin.admin_user} className='flex items-center justify-between bg-gray-700 rounded p-3'>
                    <span className='text-gray-300'>{admin.admin_user}</span>
                    <span className='text-blue-400 font-medium'>{admin.count} attempts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step Breakdown */}
            <div>
              <h4 className='text-lg font-medium text-white mb-3'>Step Breakdown</h4>
              <div className='space-y-2'>
                {stats.stepBreakdown.map((step) => (
                  <div key={step.step} className='flex items-center justify-between bg-gray-700 rounded p-3'>
                    <div className='flex items-center'>
                      <span className='mr-2'>{getStepIcon(step.step)}</span>
                      <span className='text-gray-300 capitalize'>{step.step.replace('_', ' ')}</span>
                    </div>
                    <span className='text-purple-400 font-medium'>{step.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className='bg-gray-800 rounded-lg p-6 border border-gray-700'>
        <h3 className='text-lg font-semibold text-white mb-4'>Filters</h3>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4'>
          <div>
            <label htmlFor='emailFilter' className='block text-sm font-medium text-gray-300 mb-1'>
              Email
            </label>
            <input
              type='text'
              id='emailFilter'
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              placeholder='Filter by email...'
              className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label htmlFor='adminFilter' className='block text-sm font-medium text-gray-300 mb-1'>
              Admin User
            </label>
            <input
              type='text'
              id='adminFilter'
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
              placeholder='Filter by admin...'
              className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label htmlFor='stepFilter' className='block text-sm font-medium text-gray-300 mb-1'>
              Step
            </label>
            <select
              id='stepFilter'
              value={stepFilter}
              onChange={(e) => setStepFilter(e.target.value)}
              className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='all'>All Steps</option>
              <option value='started'>Started</option>
              <option value='validation'>Validation</option>
              <option value='account_created'>Account Created</option>
              <option value='email_sent'>Email Sent</option>
              <option value='completed'>Completed</option>
              <option value='failed'>Failed</option>
              <option value='rollback'>Rollback</option>
            </select>
          </div>

          <div>
            <label htmlFor='successFilter' className='block text-sm font-medium text-gray-300 mb-1'>
              Result
            </label>
            <select
              id='successFilter'
              value={successFilter}
              onChange={(e) => setSuccessFilter(e.target.value)}
              className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='all'>All Results</option>
              <option value='success'>Success</option>
              <option value='failure'>Failure</option>
            </select>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-300 mb-1'>Actions</label>
            <button
              onClick={loadData}
              className='w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Date Range Filters */}
        <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label htmlFor='dateFrom' className='block text-sm font-medium text-gray-300 mb-1'>
              From Date
            </label>
            <input
              type='date'
              id='dateFrom'
              value={dateRange.from}
              onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
              className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label htmlFor='dateTo' className='block text-sm font-medium text-gray-300 mb-1'>
              To Date
            </label>
            <input
              type='date'
              id='dateTo'
              value={dateRange.to}
              onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
              className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className='bg-gray-800 rounded-lg border border-gray-700 overflow-hidden'>
        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
            <span className='ml-3 text-gray-400'>Loading audit logs...</span>
          </div>
        ) : error ? (
          <div className='p-6 text-center'>
            <div className='text-red-400 text-4xl mb-4'>⚠️</div>
            <h3 className='text-xl font-semibold text-red-400 mb-2'>Error Loading Logs</h3>
            <p className='text-red-300 mb-4'>{error}</p>
            <button
              onClick={loadData}
              className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors'
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-700'>
                <thead className='bg-gray-900'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                      Timestamp
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                      Email
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                      Step
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                      Admin User
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                      Result
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'>
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-gray-800 divide-y divide-gray-700'>
                  <AnimatePresence>
                    {logs.map((log, index) => (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.02 }}
                        className='hover:bg-gray-750 transition-colors'
                      >
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-gray-300'>{new Date(log.created_at).toLocaleString()}</div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-white'>{log.email}</div>
                          {log.full_name && <div className='text-xs text-gray-400'>{log.full_name}</div>}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className={`flex items-center ${getStepColor(log.step_completed, log.success)}`}>
                            <span className='mr-2'>{getStepIcon(log.step_completed)}</span>
                            <span className='text-sm capitalize'>{log.step_completed.replace('_', ' ')}</span>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-gray-300'>{log.admin_user}</div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          {log.success ? (
                            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                              ✅ Success
                            </span>
                          ) : (
                            <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'>
                              ❌ Failed
                            </span>
                          )}
                        </td>
                        <td className='px-6 py-4'>
                          <div className='text-sm text-gray-300 max-w-xs truncate'>
                            {log.error_message ? (
                              <span className='text-red-300' title={log.error_message}>
                                {log.error_message}
                              </span>
                            ) : log.subscription_tier ? (
                              <span className='text-blue-300'>Tier: {log.subscription_tier}</span>
                            ) : (
                              <span className='text-gray-500'>-</span>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='bg-gray-900 px-6 py-3 flex items-center justify-between border-t border-gray-700'>
                <div className='text-sm text-gray-400'>
                  Page {currentPage} of {totalPages}
                </div>
                <div className='flex items-center space-x-2'>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className='px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors'
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className='px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors'
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProvisioningAuditLogs;
