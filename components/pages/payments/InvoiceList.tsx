import React, { useState } from 'react';
import { Plus, Search, Filter, Download, CreditCard, Eye, Clock, Calendar } from 'lucide-react';
import { Invoice, InvoiceStatus } from '../../../types';
import { useTheme } from '../../../hooks/useTheme';
import InvoicePDFGenerator from '../../payments/InvoicePDFGenerator';
import SquareChargeModal from '../../payments/SquareChargeModal';

interface InvoiceListProps {
  invoices: Invoice[];
  loading: boolean;
  onCreateNew: () => void;
  onViewDetails: (invoice: Invoice) => void;
  onStatusUpdate: (invoiceId: number, newStatus: InvoiceStatus) => Promise<void>;
  onPaymentSuccess: (invoiceId: number, paymentId: string) => void;
  error: string | null;
}

const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  loading,
  onCreateNew,
  onViewDetails,
  onStatusUpdate,
  onPaymentSuccess,
  error,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [selectedInvoiceForCharge, setSelectedInvoiceForCharge] = useState<Invoice | null>(null);

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusConfig = (status: InvoiceStatus) => {
    switch (status) {
      case InvoiceStatus.Created:
        return {
          color: isDark ? 'text-blue-400' : 'text-blue-600',
          bg: isDark ? 'bg-blue-400/20' : 'bg-blue-100',
          border: isDark ? 'border-blue-400/30' : 'border-blue-300',
          label: 'Created',
        };
      case InvoiceStatus.Sent:
        return {
          color: isDark ? 'text-yellow-400' : 'text-yellow-600',
          bg: isDark ? 'bg-yellow-400/20' : 'bg-yellow-100',
          border: isDark ? 'border-yellow-400/30' : 'border-yellow-300',
          label: 'Sent',
        };
      case InvoiceStatus.Fulfilled:
        return {
          color: isDark ? 'text-green-400' : 'text-green-600',
          bg: isDark ? 'bg-green-400/20' : 'bg-green-100',
          border: isDark ? 'border-green-400/30' : 'border-green-300',
          label: 'Fulfilled',
        };
      case InvoiceStatus.Overdue:
        return {
          color: isDark ? 'text-red-400' : 'text-red-600',
          bg: isDark ? 'bg-red-400/20' : 'bg-red-100',
          border: isDark ? 'border-red-400/30' : 'border-red-300',
          label: 'Overdue',
        };
      case InvoiceStatus.Cancelled:
        return {
          color: isDark ? 'text-gray-400' : 'text-gray-600',
          bg: isDark ? 'bg-gray-400/20' : 'bg-gray-100',
          border: isDark ? 'border-gray-400/30' : 'border-gray-300',
          label: 'Cancelled',
        };
      default:
        return {
          color: isDark ? 'text-platinum-silver/60' : 'text-gray-500',
          bg: isDark ? 'bg-platinum-silver/10' : 'bg-gray-100',
          border: isDark ? 'border-platinum-silver/20' : 'border-gray-300',
          label: 'Unknown',
        };
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      (invoice.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.contact_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.customer_info?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatsCounts = () => {
    return {
      total: invoices.length,
      created: invoices.filter((i) => i.status === InvoiceStatus.Created).length,
      sent: invoices.filter((i) => i.status === InvoiceStatus.Sent).length,
      fulfilled: invoices.filter((i) => i.status === InvoiceStatus.Fulfilled).length,
      overdue: invoices.filter((i) => i.status === InvoiceStatus.Overdue).length,
      totalValue: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
      pendingValue: invoices
        .filter((i) => i.status !== InvoiceStatus.Fulfilled && i.status !== InvoiceStatus.Cancelled)
        .reduce((sum, inv) => sum + inv.total_amount, 0),
    };
  };

  const stats = getStatsCounts();

  const handlePaymentSuccess = (paymentId: string) => {
    if (selectedInvoiceForCharge) {
      onPaymentSuccess(selectedInvoiceForCharge.id, paymentId);
      setSelectedInvoiceForCharge(null);
    }
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div
          className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
            isDark ? 'border-champagne-gold' : 'border-blue-600'
          }`}
        ></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header with Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div
          className={`p-4 rounded-lg border ${
            isDark ? 'bg-charcoal-slate border-champagne-gold/20' : 'bg-white border-gray-200'
          }`}
        >
          <div className={`text-2xl font-bold ${isDark ? 'text-champagne-gold' : 'text-blue-600'}`}>{stats.total}</div>
          <div className={`text-sm ${isDark ? 'text-platinum-silver/70' : 'text-gray-600'}`}>Total Invoices</div>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            isDark ? 'bg-charcoal-slate border-champagne-gold/20' : 'bg-white border-gray-200'
          }`}
        >
          <div className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            {formatCurrency(stats.totalValue)}
          </div>
          <div className={`text-sm ${isDark ? 'text-platinum-silver/70' : 'text-gray-600'}`}>Total Value</div>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            isDark ? 'bg-charcoal-slate border-champagne-gold/20' : 'bg-white border-gray-200'
          }`}
        >
          <div className={`text-2xl font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
            {formatCurrency(stats.pendingValue)}
          </div>
          <div className={`text-sm ${isDark ? 'text-platinum-silver/70' : 'text-gray-600'}`}>Pending Amount</div>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            isDark ? 'bg-charcoal-slate border-champagne-gold/20' : 'bg-white border-gray-200'
          }`}
        >
          <div className={`text-2xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{stats.overdue}</div>
          <div className={`text-sm ${isDark ? 'text-platinum-silver/70' : 'text-gray-600'}`}>Overdue</div>
        </div>
      </div>

      {/* Controls */}
      <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
        <div className='flex flex-col sm:flex-row gap-3 flex-1'>
          {/* Search */}
          <div className='relative'>
            <Search
              size={20}
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                isDark ? 'text-platinum-silver/40' : 'text-gray-400'
              }`}
            />
            <input
              type='text'
              placeholder='Search invoices...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-4 py-2 border rounded-lg w-full sm:w-64 transition-colors focus:outline-none ${
                isDark
                  ? 'bg-charcoal-slate border-champagne-gold/20 text-platinum-silver placeholder-platinum-silver/40 focus:border-champagne-gold'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              }`}
            />
          </div>

          {/* Status Filter */}
          <div className='relative'>
            <Filter
              size={16}
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                isDark ? 'text-platinum-silver/40' : 'text-gray-400'
              }`}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
              className={`pl-10 pr-8 py-2 border rounded-lg transition-colors focus:outline-none appearance-none ${
                isDark
                  ? 'bg-charcoal-slate border-champagne-gold/20 text-platinum-silver focus:border-champagne-gold'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
              }`}
            >
              <option value='all'>All Status</option>
              <option value={InvoiceStatus.Created}>Created ({stats.created})</option>
              <option value={InvoiceStatus.Sent}>Sent ({stats.sent})</option>
              <option value={InvoiceStatus.Fulfilled}>Fulfilled ({stats.fulfilled})</option>
              <option value={InvoiceStatus.Overdue}>Overdue ({stats.overdue})</option>
            </select>
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={onCreateNew}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            isDark
              ? 'bg-champagne-gold text-obsidian-black hover:bg-champagne-gold/90'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Plus size={20} />
          New Invoice
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div
          className={`p-4 rounded-lg border ${isDark ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200'}`}
        >
          <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-700'}`}>{error}</p>
        </div>
      )}

      {/* Invoice Grid */}
      {filteredInvoices.length === 0 ? (
        <div
          className={`text-center py-12 rounded-lg border-2 border-dashed ${
            isDark ? 'border-champagne-gold/20 text-platinum-silver/60' : 'border-gray-300 text-gray-500'
          }`}
        >
          <div className='mb-4'>
            {searchTerm || statusFilter !== 'all' ? (
              <>
                <Filter size={48} className='mx-auto mb-4 opacity-40' />
                <p className='text-lg font-medium'>No invoices match your filters</p>
                <p>Try adjusting your search or filter settings</p>
              </>
            ) : (
              <>
                <Calendar size={48} className='mx-auto mb-4 opacity-40' />
                <p className='text-lg font-medium'>No invoices yet</p>
                <p>Create your first invoice to get started</p>
              </>
            )}
          </div>
          {!searchTerm && statusFilter === 'all' && (
            <button
              onClick={onCreateNew}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isDark
                  ? 'bg-champagne-gold text-obsidian-black hover:bg-champagne-gold/90'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Plus size={16} />
              Create First Invoice
            </button>
          )}
        </div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'>
          {filteredInvoices.map((invoice) => {
            const statusConfig = getStatusConfig(invoice.status);
            const customerName = invoice.contact_name || invoice.customer_info?.name || 'Unknown Customer';

            return (
              <div
                key={invoice.id}
                className={`p-6 rounded-lg border transition-all duration-200 hover:shadow-lg cursor-pointer ${
                  isDark
                    ? 'bg-charcoal-slate border-champagne-gold/20 hover:border-champagne-gold/40'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onViewDetails(invoice)}
              >
                {/* Header */}
                <div className='flex items-start justify-between mb-4'>
                  <div>
                    <h3 className={`font-semibold ${isDark ? 'text-platinum-silver' : 'text-gray-900'}`}>
                      {invoice.invoice_number || `INV-${invoice.id}`}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-platinum-silver/70' : 'text-gray-600'}`}>{customerName}</p>
                  </div>
                  <div
                    className={`px-2 py-1 rounded-full border text-xs font-medium ${statusConfig.bg} ${statusConfig.border} ${statusConfig.color}`}
                  >
                    {statusConfig.label}
                  </div>
                </div>

                {/* Amount */}
                <div className='mb-4'>
                  <span className={`text-2xl font-bold ${isDark ? 'text-champagne-gold' : 'text-blue-600'}`}>
                    {formatCurrency(invoice.total_amount, invoice.currency)}
                  </span>
                </div>

                {/* Dates */}
                <div className='space-y-1 mb-4'>
                  <div className='flex items-center gap-2 text-sm'>
                    <Clock size={14} className={isDark ? 'text-platinum-silver/40' : 'text-gray-400'} />
                    <span className={isDark ? 'text-platinum-silver/70' : 'text-gray-600'}>
                      Created: {formatDate(invoice.created_at)}
                    </span>
                  </div>
                  {invoice.due_date && (
                    <div className='flex items-center gap-2 text-sm'>
                      <Calendar size={14} className={isDark ? 'text-platinum-silver/40' : 'text-gray-400'} />
                      <span className={isDark ? 'text-platinum-silver/70' : 'text-gray-600'}>
                        Due: {formatDate(invoice.due_date)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className='flex gap-2' onClick={(e) => e.stopPropagation()}>
                  {/* PDF Download */}
                  <div className='flex-1'>
                    <InvoicePDFGenerator invoice={invoice} className='w-full' />
                  </div>

                  {/* Charge Button */}
                  {invoice.status !== InvoiceStatus.Fulfilled && invoice.status !== InvoiceStatus.Cancelled && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedInvoiceForCharge(invoice);
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                        isDark
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <CreditCard size={14} />
                      Charge
                    </button>
                  )}

                  {/* View Details */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(invoice);
                    }}
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                      isDark
                        ? 'border-champagne-gold/30 text-champagne-gold hover:bg-champagne-gold/10'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Square Charge Modal */}
      {selectedInvoiceForCharge && (
        <SquareChargeModal
          invoice={selectedInvoiceForCharge}
          isOpen={!!selectedInvoiceForCharge}
          onClose={() => setSelectedInvoiceForCharge(null)}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}
    </div>
  );
};

export default InvoiceList;
