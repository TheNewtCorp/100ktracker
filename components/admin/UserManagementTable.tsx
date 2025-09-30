import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import adminApiService from '../../services/adminApiService';

interface User {
  id: number;
  username: string;
  email: string;
  subscription_tier: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
  login_count: number;
}

const UserManagementTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm, tierFilter, statusFilter, sortBy, sortOrder]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        subscriptionTier: tierFilter !== 'all' ? tierFilter : undefined,
        sortBy,
        sortOrder,
      };

      const data = await adminApiService.getAllUsers(params);
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotalUsers(data.totalUsers);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleResetPassword = async (user: User) => {
    if (!confirm(`Reset password for ${user.email}?`)) return;

    try {
      await adminApiService.resetUserPassword(user.id);
      alert('Password reset email sent successfully');
    } catch (err: any) {
      alert(`Failed to reset password: ${err.message}`);
    }
  };

  const handleResendInvitation = async (user: User) => {
    if (!confirm(`Resend invitation to ${user.email}? This will generate a new temporary password.`)) return;

    try {
      const result = await adminApiService.resendInvitation({ email: user.email });
      alert(
        'Invitation email resent successfully with a new temporary password. The user should check their email for login details.',
      );
    } catch (err: any) {
      alert(`Failed to resend invitation: ${err.message}`);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (updatedData: Partial<User>) => {
    if (!selectedUser) return;

    try {
      await adminApiService.updateUser(selectedUser.id, updatedData);
      setShowEditModal(false);
      setSelectedUser(null);
      await loadUsers(); // Refresh the user list
      alert('User updated successfully');
    } catch (err: any) {
      alert(`Failed to update user: ${err.message}`);
    }
  };

  const getTierBadge = (tier: string) => {
    const tiers = {
      free: { label: 'Free', color: 'bg-blue-100 text-blue-800', icon: '🆓' },
      platinum: { label: 'Platinum', color: 'bg-purple-100 text-purple-800', icon: '💎' },
      operandi: { label: 'Operandi', color: 'bg-amber-100 text-amber-800', icon: '🎯' },
    };

    const config = tiers[tier as keyof typeof tiers] || { label: tier, color: 'bg-gray-100 text-gray-800', icon: '❓' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <span className='mr-1'>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
        ✅ Active
      </span>
    ) : (
      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'>
        ❌ Inactive
      </span>
    );
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !searchTerm ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTier = tierFilter === 'all' || user.subscription_tier === tierFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);

    return matchesSearch && matchesTier && matchesStatus;
  });

  const SortButton: React.FC<{ field: string; children: React.ReactNode }> = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className='flex items-center space-x-1 text-left font-medium text-gray-300 hover:text-white transition-colors'
    >
      <span>{children}</span>
      {sortBy === field && <span className='text-blue-400'>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
    </button>
  );

  return (
    <div className='space-y-6'>
      {/* Header and Controls */}
      <div className='bg-gray-800 rounded-lg p-6 border border-gray-700'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0'>
          <div>
            <h2 className='text-2xl font-bold text-white'>User Management</h2>
            <p className='text-gray-400 mt-1'>View and manage all user accounts</p>
          </div>

          <div className='flex items-center space-x-4'>
            <div className='text-sm text-gray-400'>Total: {totalUsers} users</div>
            <button
              onClick={loadUsers}
              className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors'
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className='mt-6 grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div>
            <label htmlFor='search' className='block text-sm font-medium text-gray-300 mb-1'>
              Search
            </label>
            <input
              type='text'
              id='search'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder='Email or username...'
              className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          <div>
            <label htmlFor='tierFilter' className='block text-sm font-medium text-gray-300 mb-1'>
              Subscription Tier
            </label>
            <select
              id='tierFilter'
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='all'>All Tiers</option>
              <option value='free'>Free</option>
              <option value='platinum'>Platinum</option>
              <option value='operandi'>Operandi</option>
            </select>
          </div>

          <div>
            <label htmlFor='statusFilter' className='block text-sm font-medium text-gray-300 mb-1'>
              Status
            </label>
            <select
              id='statusFilter'
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='all'>All Status</option>
              <option value='active'>Active</option>
              <option value='inactive'>Inactive</option>
            </select>
          </div>

          <div>
            <label htmlFor='sortBy' className='block text-sm font-medium text-gray-300 mb-1'>
              Sort By
            </label>
            <select
              id='sortBy'
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              <option value='created_at'>Created Date</option>
              <option value='last_login'>Last Login</option>
              <option value='email'>Email</option>
              <option value='username'>Username</option>
              <option value='login_count'>Login Count</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className='bg-gray-800 rounded-lg border border-gray-700 overflow-hidden'>
        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
            <span className='ml-3 text-gray-400'>Loading users...</span>
          </div>
        ) : error ? (
          <div className='p-6 text-center'>
            <div className='text-red-400 text-4xl mb-4'>⚠️</div>
            <h3 className='text-xl font-semibold text-red-400 mb-2'>Error Loading Users</h3>
            <p className='text-red-300 mb-4'>{error}</p>
            <button
              onClick={loadUsers}
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
                    <th className='px-6 py-3 text-left'>
                      <SortButton field='email'>Email</SortButton>
                    </th>
                    <th className='px-6 py-3 text-left'>
                      <SortButton field='username'>Username</SortButton>
                    </th>
                    <th className='px-6 py-3 text-left'>
                      <SortButton field='subscription_tier'>Tier</SortButton>
                    </th>
                    <th className='px-6 py-3 text-left'>Status</th>
                    <th className='px-6 py-3 text-left'>
                      <SortButton field='login_count'>Logins</SortButton>
                    </th>
                    <th className='px-6 py-3 text-left'>
                      <SortButton field='last_login'>Last Login</SortButton>
                    </th>
                    <th className='px-6 py-3 text-left'>
                      <SortButton field='created_at'>Created</SortButton>
                    </th>
                    <th className='px-6 py-3 text-left'>Actions</th>
                  </tr>
                </thead>
                <tbody className='bg-gray-800 divide-y divide-gray-700'>
                  <AnimatePresence>
                    {filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className='hover:bg-gray-750 transition-colors'
                      >
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-white'>{user.email}</div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-gray-300'>{user.username}</div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>{getTierBadge(user.subscription_tier)}</td>
                        <td className='px-6 py-4 whitespace-nowrap'>{getStatusBadge(user.is_active)}</td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-gray-300'>{user.login_count}</div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-gray-300'>
                            {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-gray-300'>{new Date(user.created_at).toLocaleDateString()}</div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='flex items-center space-x-2'>
                            <button
                              onClick={() => handleEditUser(user)}
                              className='text-blue-400 hover:text-blue-300 text-sm'
                              title='Edit user'
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleResetPassword(user)}
                              className='text-yellow-400 hover:text-yellow-300 text-sm'
                              title='Reset password'
                            >
                              🔑
                            </button>
                            <button
                              onClick={() => handleResendInvitation(user)}
                              className='text-green-400 hover:text-green-300 text-sm'
                              title='Resend invitation'
                            >
                              📧
                            </button>
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

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onSave={handleUpdateUser}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

// Edit User Modal Component
interface EditUserModalProps {
  user: User;
  onSave: (updatedData: Partial<User>) => Promise<void>;
  onCancel: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: user.username || '',
    email: user.email || '',
    subscription_tier: user.subscription_tier || 'free',
    is_active: user.is_active,
    subscription_status: 'active', // Default value
    subscription_price: 0,
    subscription_start_date: '',
    subscription_end_date: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Email must be valid';
    }

    if (formData.subscription_price < 0) {
      newErrors.subscription_price = 'Price cannot be negative';
    }

    if (formData.subscription_start_date && formData.subscription_end_date) {
      if (new Date(formData.subscription_start_date) > new Date(formData.subscription_end_date)) {
        newErrors.subscription_end_date = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const updateData: any = {};

      // Only include changed fields
      if (formData.username !== user.username) {
        updateData.username = formData.username;
      }
      if (formData.email !== user.email) {
        updateData.email = formData.email;
      }
      if (formData.subscription_tier !== user.subscription_tier) {
        updateData.subscription_tier = formData.subscription_tier;
      }
      if (formData.is_active !== user.is_active) {
        updateData.is_active = formData.is_active;
      }
      if (formData.subscription_status) {
        updateData.subscription_status = formData.subscription_status;
      }
      if (formData.subscription_price > 0) {
        updateData.subscription_price = formData.subscription_price;
      }
      if (formData.subscription_start_date) {
        updateData.subscription_start_date = formData.subscription_start_date;
      }
      if (formData.subscription_end_date) {
        updateData.subscription_end_date = formData.subscription_end_date;
      }

      await onSave(updateData);
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className='bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto'
      >
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-xl font-bold text-white'>Edit User</h3>
          <button onClick={onCancel} className='text-gray-400 hover:text-white transition-colors'>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Basic Information */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-1'>Username *</label>
              <input
                type='text'
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.username ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder='Enter username'
              />
              {errors.username && <p className='text-red-400 text-sm mt-1'>{errors.username}</p>}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-300 mb-1'>Email *</label>
              <input
                type='email'
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder='Enter email'
              />
              {errors.email && <p className='text-red-400 text-sm mt-1'>{errors.email}</p>}
            </div>
          </div>

          {/* Account Status */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-1'>Account Status</label>
              <select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => handleInputChange('is_active', e.target.value === 'active')}
                className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='active'>✅ Active</option>
                <option value='inactive'>❌ Inactive</option>
              </select>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-300 mb-1'>Subscription Tier</label>
              <select
                value={formData.subscription_tier}
                onChange={(e) => handleInputChange('subscription_tier', e.target.value)}
                className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value='free'>🆓 Free</option>
                <option value='platinum'>💎 Platinum</option>
                <option value='operandi'>🎯 Operandi</option>
              </select>
            </div>
          </div>

          {/* Subscription Details */}
          <div className='border-t border-gray-700 pt-4'>
            <h4 className='text-lg font-medium text-white mb-3'>Subscription Details</h4>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-300 mb-1'>Subscription Status</label>
                <select
                  value={formData.subscription_status}
                  onChange={(e) => handleInputChange('subscription_status', e.target.value)}
                  className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value='active'>Active</option>
                  <option value='inactive'>Inactive</option>
                  <option value='cancelled'>Cancelled</option>
                  <option value='trialing'>Trialing</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-1'>Subscription Price ($)</label>
                <input
                  type='number'
                  min='0'
                  step='0.01'
                  value={formData.subscription_price}
                  onChange={(e) => handleInputChange('subscription_price', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.subscription_price ? 'border-red-500' : 'border-gray-600'
                  }`}
                  placeholder='0.00'
                />
                {errors.subscription_price && <p className='text-red-400 text-sm mt-1'>{errors.subscription_price}</p>}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
              <div>
                <label className='block text-sm font-medium text-gray-300 mb-1'>Subscription Start Date</label>
                <input
                  type='date'
                  value={formData.subscription_start_date}
                  onChange={(e) => handleInputChange('subscription_start_date', e.target.value)}
                  className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-1'>Subscription End Date</label>
                <input
                  type='date'
                  value={formData.subscription_end_date}
                  onChange={(e) => handleInputChange('subscription_end_date', e.target.value)}
                  className={`w-full px-3 py-2 bg-gray-700 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.subscription_end_date ? 'border-red-500' : 'border-gray-600'
                  }`}
                />
                {errors.subscription_end_date && (
                  <p className='text-red-400 text-sm mt-1'>{errors.subscription_end_date}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex justify-end space-x-3 pt-4 border-t border-gray-700'>
            <button
              type='button'
              onClick={onCancel}
              className='px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoading}
              className='px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center'
            >
              {isLoading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default UserManagementTable;
