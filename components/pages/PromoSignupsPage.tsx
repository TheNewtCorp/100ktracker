import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/apiService';
import type { PromoSignup, PromoSignupsListResponse } from '../../types';

const PromoSignupsPage: React.FC = () => {
  const [signups, setSignups] = useState<PromoSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [filter, setFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchSignups();
  }, []);

  const fetchSignups = async () => {
    try {
      setLoading(true);
      const response: PromoSignupsListResponse = await apiService.getPromoSignups();
      setSignups(response.signups);
      setSummary(response.summary);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch signups');
      console.error('Error fetching signups:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSignupStatus = async (id: number, status: 'pending' | 'approved' | 'rejected', adminNotes?: string) => {
    try {
      setUpdatingId(id);
      await apiService.updatePromoSignupStatus(id, status, adminNotes);
      await fetchSignups(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Failed to update signup status');
      console.error('Error updating signup:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const createAccount = async (id: number) => {
    try {
      setUpdatingId(id);
      const result = await apiService.createAccountFromPromoSignup(id);
      alert(`Account created successfully! Temporary password: ${result.account.temporaryPassword}`);
      await fetchSignups(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      console.error('Error creating account:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredSignups = signups.filter((signup) => {
    if (filter === 'all') return true;
    return signup.status === filter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Operandi Challenge Signups</h1>
          <p className='mt-2 text-gray-600'>Review and manage promotional signup applications</p>
        </div>

        {/* Summary Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white rounded-lg shadow p-6'>
            <h3 className='text-lg font-medium text-gray-900'>Total</h3>
            <p className='text-3xl font-bold text-blue-600'>{summary.total}</p>
          </div>
          <div className='bg-white rounded-lg shadow p-6'>
            <h3 className='text-lg font-medium text-gray-900'>Pending</h3>
            <p className='text-3xl font-bold text-yellow-600'>{summary.pending}</p>
          </div>
          <div className='bg-white rounded-lg shadow p-6'>
            <h3 className='text-lg font-medium text-gray-900'>Approved</h3>
            <p className='text-3xl font-bold text-green-600'>{summary.approved}</p>
          </div>
          <div className='bg-white rounded-lg shadow p-6'>
            <h3 className='text-lg font-medium text-gray-900'>Rejected</h3>
            <p className='text-3xl font-bold text-red-600'>{summary.rejected}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className='mb-6'>
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex space-x-8'>
              {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    filter === status
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {status} ({status === 'all' ? summary.total : summary[status as keyof typeof summary]})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className='mb-6 bg-red-50 border border-red-200 rounded-md p-4'>
            <div className='flex'>
              <svg className='h-5 w-5 text-red-400' viewBox='0 0 20 20' fill='currentColor'>
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
              <div className='ml-3'>
                <p className='text-sm text-red-800'>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Signups List */}
        <div className='bg-white shadow overflow-hidden sm:rounded-md'>
          <ul className='divide-y divide-gray-200'>
            {filteredSignups.map((signup) => (
              <li key={signup.id} className='px-6 py-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center space-x-3'>
                      <h3 className='text-lg font-medium text-gray-900 truncate'>{signup.full_name}</h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(signup.status)}`}
                      >
                        {signup.status}
                      </span>
                    </div>

                    <div className='mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600'>
                      <div>
                        <strong>Email:</strong> {signup.email}
                      </div>
                      <div>
                        <strong>Phone:</strong> {signup.phone || 'Not provided'}
                      </div>
                      <div>
                        <strong>Business:</strong> {signup.business_name || 'Not provided'}
                      </div>
                      <div>
                        <strong>Experience:</strong> {signup.experience_level}
                      </div>
                      <div>
                        <strong>Referral:</strong> {signup.referral_source}
                      </div>
                      <div>
                        <strong>Submitted:</strong> {formatDate(signup.created_at)}
                      </div>
                    </div>

                    {signup.interests && (
                      <div className='mt-2 text-sm text-gray-600'>
                        <strong>Interests:</strong> {signup.interests}
                      </div>
                    )}

                    {signup.comments && (
                      <div className='mt-2 text-sm text-gray-600'>
                        <strong>Comments:</strong> {signup.comments}
                      </div>
                    )}

                    {signup.admin_notes && (
                      <div className='mt-2 p-3 bg-gray-50 rounded text-sm'>
                        <strong className='text-gray-900'>Admin Notes:</strong> {signup.admin_notes}
                      </div>
                    )}
                  </div>

                  <div className='flex flex-col space-y-2 ml-4'>
                    {signup.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateSignupStatus(signup.id!, 'approved', 'Approved for Operandi Challenge')}
                          disabled={updatingId === signup.id}
                          className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50'
                        >
                          {updatingId === signup.id ? 'Updating...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => {
                            const notes = prompt('Rejection reason (optional):');
                            updateSignupStatus(signup.id!, 'rejected', notes || 'Application rejected');
                          }}
                          disabled={updatingId === signup.id}
                          className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50'
                        >
                          {updatingId === signup.id ? 'Updating...' : 'Reject'}
                        </button>
                      </>
                    )}

                    {signup.status === 'approved' && (
                      <button
                        onClick={() => createAccount(signup.id!)}
                        disabled={updatingId === signup.id}
                        className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
                      >
                        {updatingId === signup.id ? 'Creating...' : 'Create Account'}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        const notes = prompt('Add admin notes:', signup.admin_notes || '');
                        if (notes !== null) {
                          updateSignupStatus(signup.id!, signup.status, notes);
                        }
                      }}
                      className='inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    >
                      Add Notes
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {filteredSignups.length === 0 && (
            <div className='text-center py-12'>
              <svg className='mx-auto h-12 w-12 text-gray-400' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
              <h3 className='mt-2 text-sm font-medium text-gray-900'>No signups found</h3>
              <p className='mt-1 text-sm text-gray-500'>
                {filter === 'all' ? 'No signups have been submitted yet.' : `No signups with status "${filter}" found.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromoSignupsPage;
