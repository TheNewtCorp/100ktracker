import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, Calendar } from 'lucide-react';
import { Contact, Watch, AssociationRole, WatchAssociation } from '../../../../types';
import { useTheme } from '../../../../hooks/useTheme';

interface MetricsTabProps {
  contact: Contact | null;
  watches: Watch[];
  associations: WatchAssociation[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  color: 'green' | 'blue' | 'gray' | 'yellow';
}

const MetricsTab: React.FC<MetricsTabProps> = ({ contact, watches, associations }) => {
  const { theme } = useTheme();

  // Calculate metrics
  const metrics = useMemo(() => {
    const boughtAssociations = associations.filter((a) => a.role === AssociationRole.Buyer);
    const soldAssociations = associations.filter((a) => a.role === AssociationRole.Seller);

    const contactBoughtWatches = boughtAssociations
      .map((a) => watches.find((w) => w.id === a.watchId))
      .filter(Boolean) as Watch[];

    const contactSoldWatches = soldAssociations
      .map((a) => watches.find((w) => w.id === a.watchId))
      .filter(Boolean) as Watch[];

    // Revenue metrics (contact bought FROM user - money coming IN to user)
    const totalRevenue = contactBoughtWatches.reduce((sum, w) => sum + (w.priceSold || 0), 0);
    const avgSalePrice = contactBoughtWatches.length > 0 ? totalRevenue / contactBoughtWatches.length : 0;

    // Expense metrics (contact sold TO user - money going OUT from user)
    const totalSpent = contactSoldWatches.reduce((sum, w) => sum + (w.purchasePrice || 0), 0);
    const avgPurchasePrice = contactSoldWatches.length > 0 ? totalSpent / contactSoldWatches.length : 0;

    // Net calculations (from user's perspective)
    const totalVolume = totalSpent + totalRevenue;
    const netProfit = totalRevenue - totalSpent;

    // Favorite brands
    const brandCounts = [...contactBoughtWatches, ...contactSoldWatches].reduce(
      (acc, watch) => {
        acc[watch.brand] = (acc[watch.brand] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const favoriteBrand = Object.entries(brandCounts).reduce(
      (max, [brand, count]) => (count > max.count ? { brand, count } : max),
      { brand: 'N/A', count: 0 },
    );

    // Recent activity (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentPurchases = contactSoldWatches.filter((w) => w.inDate && new Date(w.inDate) >= ninetyDaysAgo).length;

    const recentSales = contactBoughtWatches.filter((w) => w.dateSold && new Date(w.dateSold) >= ninetyDaysAgo).length;

    return {
      purchase: {
        count: contactSoldWatches.length, // Watches user purchased (contact was seller)
        total: totalSpent,
        average: avgPurchasePrice,
        recent: recentPurchases,
      },
      sales: {
        count: contactBoughtWatches.length, // Watches user sold (contact was buyer)
        total: totalRevenue,
        average: avgSalePrice,
        recent: recentSales,
      },
      relationship: {
        totalVolume,
        netProfit,
        dealCount: contactBoughtWatches.length + contactSoldWatches.length,
        favoriteBrand,
      },
    };
  }, [watches, associations]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon: Icon, color }) => {
    const colorClasses = {
      green: theme === 'light' ? 'bg-green-50 border-green-200' : 'bg-money-green/10 border-money-green/20',
      blue: theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-arctic-blue/10 border-arctic-blue/20',
      gray: theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-platinum-silver/10 border-platinum-silver/20',
      yellow: theme === 'light' ? 'bg-yellow-50 border-yellow-200' : 'bg-champagne-gold/10 border-champagne-gold/20',
    };

    const iconColorClasses = {
      green: theme === 'light' ? 'text-green-600' : 'text-money-green',
      blue: theme === 'light' ? 'text-blue-600' : 'text-arctic-blue',
      gray: theme === 'light' ? 'text-gray-600' : 'text-platinum-silver',
      yellow: theme === 'light' ? 'text-yellow-600' : 'text-champagne-gold',
    };

    return (
      <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
        <div className='flex items-center justify-between'>
          <div>
            <p className={`text-sm font-medium ${theme === 'light' ? 'text-gray-600' : 'text-platinum-silver/70'}`}>
              {title}
            </p>
            <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
              {typeof value === 'number' ? formatCurrency(value) : value}
            </p>
            {subtitle && (
              <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-platinum-silver/60'}`}>{subtitle}</p>
            )}
          </div>
          <Icon size={24} className={iconColorClasses[color]} />
        </div>
      </div>
    );
  };

  if (!contact) {
    return (
      <div className='text-center py-8'>
        <p className={theme === 'light' ? 'text-gray-500' : 'text-platinum-silver/60'}>
          No contact data available for metrics.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Purchase Metrics */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
          Your Purchases (from this contact)
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <MetricCard title='Watches Bought' value={metrics.purchase.count} icon={Package} color='green' />
          <MetricCard title='Total Spent' value={metrics.purchase.total} icon={DollarSign} color='green' />
          <MetricCard
            title='Average Price'
            value={metrics.purchase.average}
            subtitle={metrics.purchase.count > 0 ? `across ${metrics.purchase.count} purchases` : undefined}
            icon={TrendingUp}
            color='green'
          />
          <MetricCard
            title='Recent Purchases'
            value={metrics.purchase.recent}
            subtitle='Last 90 days'
            icon={Calendar}
            color='green'
          />
        </div>
      </div>

      {/* Sales Metrics */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
          Your Sales (to this contact)
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <MetricCard title='Watches Sold' value={metrics.sales.count} icon={Package} color='blue' />
          <MetricCard title='Total Revenue' value={metrics.sales.total} icon={DollarSign} color='blue' />
          <MetricCard
            title='Average Price'
            value={metrics.sales.average}
            subtitle={metrics.sales.count > 0 ? `across ${metrics.sales.count} sales` : undefined}
            icon={TrendingUp}
            color='blue'
          />
          <MetricCard
            title='Recent Sales'
            value={metrics.sales.recent}
            subtitle='Last 90 days'
            icon={Calendar}
            color='blue'
          />
        </div>
      </div>

      {/* Relationship Summary */}
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
          Relationship Summary
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <MetricCard
            title='Total Volume'
            value={metrics.relationship.totalVolume}
            subtitle='Combined purchases & sales'
            icon={DollarSign}
            color='gray'
          />
          <MetricCard
            title='Net Position'
            value={metrics.relationship.netProfit}
            subtitle={metrics.relationship.netProfit >= 0 ? 'Profit' : 'Loss'}
            icon={metrics.relationship.netProfit >= 0 ? TrendingUp : TrendingDown}
            color={metrics.relationship.netProfit >= 0 ? 'green' : 'yellow'}
          />
          <MetricCard
            title='Total Deals'
            value={metrics.relationship.dealCount}
            subtitle='Purchases + Sales'
            icon={Package}
            color='gray'
          />
          <MetricCard
            title='Favorite Brand'
            value={metrics.relationship.favoriteBrand.brand}
            subtitle={
              metrics.relationship.favoriteBrand.count > 0
                ? `${metrics.relationship.favoriteBrand.count} watches`
                : undefined
            }
            icon={TrendingUp}
            color='yellow'
          />
        </div>
      </div>

      {/* Summary Insights */}
      {metrics.relationship.dealCount > 0 && (
        <div
          className={`p-4 rounded-lg border ${
            theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-arctic-blue/10 border-arctic-blue/20'
          }`}
        >
          <h4 className={`font-semibold mb-2 ${theme === 'light' ? 'text-blue-900' : 'text-arctic-blue-900'}`}>
            Key Insights
          </h4>
          <ul className={`text-sm space-y-1 ${theme === 'light' ? 'text-blue-800' : 'text-arctic-blue-900'}`}>
            {metrics.purchase.count > 0 && (
              <li>
                • You have purchased {metrics.purchase.count} watch{metrics.purchase.count !== 1 ? 'es' : ''} from this
                contact, spending {formatCurrency(metrics.purchase.total)}
              </li>
            )}
            {metrics.sales.count > 0 && (
              <li>
                • You have sold {metrics.sales.count} watch{metrics.sales.count !== 1 ? 'es' : ''} to this contact,{' '}
                generating {formatCurrency(metrics.sales.total)} in revenue
              </li>
            )}
            {metrics.relationship.netProfit !== 0 && (
              <li>
                • Net {metrics.relationship.netProfit >= 0 ? 'profit' : 'loss'} from this relationship:{' '}
                {formatCurrency(Math.abs(metrics.relationship.netProfit))}
              </li>
            )}
            {metrics.relationship.favoriteBrand.count > 1 && (
              <li>
                • Most traded brand with this contact: {metrics.relationship.favoriteBrand.brand} (
                {metrics.relationship.favoriteBrand.count} transactions)
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MetricsTab;
