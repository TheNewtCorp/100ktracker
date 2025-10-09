import React, { useState } from 'react';
import { Check, Clock, Send, DollarSign, X, ChevronDown } from 'lucide-react';
import { Invoice, InvoiceStatus } from '../../types';
import { useTheme } from '../../hooks/useTheme';

interface InvoiceStatusTrackerProps {
  invoice: Invoice;
  onStatusUpdate: (newStatus: InvoiceStatus, notes?: string) => Promise<void>;
  className?: string;
}

const InvoiceStatusTracker: React.FC<InvoiceStatusTrackerProps> = ({ invoice, onStatusUpdate, className = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [updateNotes, setUpdateNotes] = useState('');

  const statusConfig = {
    [InvoiceStatus.Created]: {
      icon: Clock,
      color: isDark ? 'text-blue-400' : 'text-blue-600',
      bg: isDark ? 'bg-blue-400/20' : 'bg-blue-100',
      border: isDark ? 'border-blue-400/30' : 'border-blue-300',
      label: 'Created',
      description: 'Invoice has been created',
    },
    [InvoiceStatus.Sent]: {
      icon: Send,
      color: isDark ? 'text-yellow-400' : 'text-yellow-600',
      bg: isDark ? 'bg-yellow-400/20' : 'bg-yellow-100',
      border: isDark ? 'border-yellow-400/30' : 'border-yellow-300',
      label: 'Sent',
      description: 'Invoice has been sent to client',
    },
    [InvoiceStatus.Fulfilled]: {
      icon: Check,
      color: isDark ? 'text-green-400' : 'text-green-600',
      bg: isDark ? 'bg-green-400/20' : 'bg-green-100',
      border: isDark ? 'border-green-400/30' : 'border-green-300',
      label: 'Fulfilled',
      description: 'Payment received and completed',
    },
    [InvoiceStatus.Overdue]: {
      icon: Clock,
      color: isDark ? 'text-red-400' : 'text-red-600',
      bg: isDark ? 'bg-red-400/20' : 'bg-red-100',
      border: isDark ? 'border-red-400/30' : 'border-red-300',
      label: 'Overdue',
      description: 'Payment is past due date',
    },
    [InvoiceStatus.Cancelled]: {
      icon: X,
      color: isDark ? 'text-gray-400' : 'text-gray-600',
      bg: isDark ? 'bg-gray-400/20' : 'bg-gray-100',
      border: isDark ? 'border-gray-400/30' : 'border-gray-300',
      label: 'Cancelled',
      description: 'Invoice has been cancelled',
    },
  };

  const statusOrder: InvoiceStatus[] = [InvoiceStatus.Created, InvoiceStatus.Sent, InvoiceStatus.Fulfilled];
  const currentIndex = statusOrder.indexOf(invoice.status);

  const getNextPossibleStatuses = (): InvoiceStatus[] => {
    switch (invoice.status) {
      case InvoiceStatus.Created:
        return [InvoiceStatus.Sent, InvoiceStatus.Cancelled];
      case InvoiceStatus.Sent:
        return [InvoiceStatus.Fulfilled, InvoiceStatus.Overdue, InvoiceStatus.Cancelled];
      case InvoiceStatus.Overdue:
        return [InvoiceStatus.Fulfilled, InvoiceStatus.Cancelled];
      case InvoiceStatus.Fulfilled:
        return []; // Final state
      case InvoiceStatus.Cancelled:
        return []; // Final state
      default:
        return [];
    }
  };

  const handleStatusUpdate = async (newStatus: InvoiceStatus) => {
    setIsUpdating(true);
    setShowDropdown(false);

    try {
      await onStatusUpdate(newStatus, updateNotes);
      setUpdateNotes('');
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentConfig = statusConfig[invoice.status];
  const Icon = currentConfig.icon;
  const nextStatuses = getNextPossibleStatuses();

  return (
    <div className={`${className}`}>
      {/* Current Status Display */}
      <div className={`p-4 rounded-lg border ${currentConfig.bg} ${currentConfig.border}`}>
        <div className='flex items-center gap-3 mb-3'>
          <Icon size={24} className={currentConfig.color} />
          <div>
            <h3 className={`font-semibold ${currentConfig.color}`}>{currentConfig.label}</h3>
            <p className={`text-sm ${isDark ? 'text-platinum-silver/70' : 'text-gray-600'}`}>
              {currentConfig.description}
            </p>
          </div>
        </div>

        {/* Status Timeline */}
        <div className='space-y-2'>
          {statusOrder.map((status, index) => {
            const config = statusConfig[status];
            const isActive = index <= currentIndex;
            const isCurrent = status === invoice.status;
            const StatusIcon = config.icon;

            return (
              <div key={status} className='flex items-center gap-3'>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                    isActive
                      ? `${config.bg} ${config.border} ${config.color}`
                      : isDark
                        ? 'bg-gray-700 border-gray-600 text-gray-400'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}
                >
                  <StatusIcon size={12} />
                </div>
                <div className='flex-1'>
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? isDark
                          ? 'text-platinum-silver'
                          : 'text-gray-900'
                        : isDark
                          ? 'text-platinum-silver/50'
                          : 'text-gray-400'
                    }`}
                  >
                    {config.label}
                  </span>
                  {isCurrent && <span className={`ml-2 text-xs ${currentConfig.color}`}>(Current)</span>}
                </div>
                <div
                  className={`text-xs ${
                    isActive
                      ? isDark
                        ? 'text-platinum-silver/70'
                        : 'text-gray-600'
                      : isDark
                        ? 'text-platinum-silver/40'
                        : 'text-gray-400'
                  }`}
                >
                  {status === InvoiceStatus.Created && formatDate(invoice.created_at)}
                  {status === InvoiceStatus.Sent && formatDate(invoice.sent_at)}
                  {status === InvoiceStatus.Fulfilled && formatDate(invoice.fulfilled_at)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Update Controls */}
      {nextStatuses.length > 0 && (
        <div className='mt-4'>
          <div className='relative'>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={isUpdating}
              className={`w-full flex items-center justify-between gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                isDark
                  ? 'bg-charcoal-slate border-champagne-gold/30 text-platinum-silver hover:border-champagne-gold/50'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className='text-sm font-medium'>{isUpdating ? 'Updating...' : 'Update Status'}</span>
              <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <div
                className={`absolute top-full left-0 right-0 mt-1 rounded-lg border shadow-lg z-10 ${
                  isDark ? 'bg-charcoal-slate border-champagne-gold/20' : 'bg-white border-gray-200'
                }`}
              >
                <div className='p-3'>
                  {nextStatuses.map((status) => {
                    const config = statusConfig[status];
                    const StatusIcon = config.icon;

                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(status)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-opacity-80 transition-colors ${
                          isDark ? 'hover:bg-champagne-gold/10 text-platinum-silver' : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <StatusIcon size={16} className={config.color} />
                        <span className='text-sm'>{config.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Notes for status update */}
                <div className='p-3 border-t border-gray-200/20'>
                  <textarea
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    placeholder='Add notes for this status update (optional)'
                    rows={2}
                    className={`w-full px-3 py-2 text-sm border rounded-lg resize-none transition-colors focus:outline-none ${
                      isDark
                        ? 'bg-obsidian-black border-champagne-gold/20 text-platinum-silver placeholder-platinum-silver/40 focus:border-champagne-gold'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Information */}
      {invoice.square_payment_id && (
        <div
          className={`mt-4 p-3 rounded-lg border ${
            isDark ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200'
          }`}
        >
          <div className='flex items-center gap-2'>
            <DollarSign size={16} className={isDark ? 'text-green-400' : 'text-green-600'} />
            <span className={`text-sm font-medium ${isDark ? 'text-green-400' : 'text-green-600'}`}>
              Payment Received
            </span>
          </div>
          <p className={`text-xs mt-1 ${isDark ? 'text-platinum-silver/70' : 'text-gray-600'}`}>
            Square Payment ID: {invoice.square_payment_id}
          </p>
        </div>
      )}
    </div>
  );
};

export default InvoiceStatusTracker;
