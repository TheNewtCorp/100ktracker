import React, { useMemo } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Contact, Watch, AssociationRole, WatchAssociation } from '../../../../types';
import { useTheme } from '../../../../hooks/useTheme';

interface WatchesTabProps {
  contact: Contact | null;
  watches: Watch[];
  contacts: Contact[];
  associations: WatchAssociation[];
  onAddAssociation: (watchId: string, role: AssociationRole) => void;
  onRemoveAssociation: (watchId: string, role: AssociationRole) => void;
  selectedWatchId: string;
  selectedRole: AssociationRole;
  onWatchIdChange: (watchId: string) => void;
  onRoleChange: (role: AssociationRole) => void;
}

const WatchesTab: React.FC<WatchesTabProps> = ({
  contact,
  watches,
  contacts,
  associations,
  onAddAssociation,
  onRemoveAssociation,
  selectedWatchId,
  selectedRole,
  onWatchIdChange,
  onRoleChange,
}) => {
  const { theme } = useTheme();

  const inputClass =
    theme === 'light'
      ? 'appearance-none relative block w-full px-3 py-2.5 bg-white border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors'
      : 'appearance-none relative block w-full px-3 py-2.5 bg-obsidian-black border border-champagne-gold/20 placeholder-platinum-silver/50 text-platinum-silver rounded-md focus:outline-none focus:ring-champagne-gold focus:border-champagne-gold sm:text-sm transition-colors';

  const labelClass =
    theme === 'light'
      ? 'block text-sm font-medium text-gray-700 mb-1'
      : 'block text-sm font-medium text-platinum-silver/80 mb-1';

  // Separate watches by role
  const boughtWatches = useMemo(
    () => associations.filter((assoc) => assoc.role === AssociationRole.Buyer),
    [associations],
  );

  const soldWatches = useMemo(
    () => associations.filter((assoc) => assoc.role === AssociationRole.Seller),
    [associations],
  );

  // Available watches (not already associated)
  const availableWatches = useMemo(
    () => watches.filter((w) => !associations.some((a) => a.watchId === w.id)),
    [watches, associations],
  );

  // Check for association conflicts
  const associationConflict = useMemo(() => {
    if (!selectedWatchId) return null;
    const watch = watches.find((w) => w.id === selectedWatchId);
    if (!watch) return null;

    const conflictingContactId = selectedRole === AssociationRole.Buyer ? watch.buyerContactId : watch.sellerContactId;
    if (conflictingContactId && conflictingContactId !== contact?.id) {
      const conflictingContact = contacts.find((c) => c.id === conflictingContactId);
      return `${conflictingContact?.firstName || 'Another contact'} is already assigned as the ${selectedRole}. This will be overwritten.`;
    }
    return null;
  }, [selectedWatchId, selectedRole, watches, contacts, contact]);

  const handleAddAssociation = () => {
    if (!selectedWatchId) return;
    onAddAssociation(selectedWatchId, selectedRole);
    onWatchIdChange('');
  };

  const getWatchDetails = (watchId: string) => {
    return watches.find((w) => w.id === watchId);
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className='space-y-6'>
      {/* Bought Watches Section */}
      <div>
        <h3 className={`text-lg font-semibold mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
          Bought Watches ({boughtWatches.length})
        </h3>
        <div className='space-y-2 mb-4'>
          {boughtWatches.map((assoc) => {
            const watch = getWatchDetails(assoc.watchId);
            return (
              <div
                key={`${assoc.watchId}-${assoc.role}`}
                className={`flex items-center justify-between p-3 rounded-md border ${
                  theme === 'light' ? 'bg-green-50 border-green-200' : 'bg-money-green/10 border-money-green/20'
                }`}
              >
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <span
                      className={`font-semibold text-sm px-2 py-1 rounded ${
                        theme === 'light' ? 'bg-green-600 text-white' : 'bg-money-green text-obsidian-black'
                      }`}
                    >
                      BUYER
                    </span>
                    <span className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
                      {assoc.watchIdentifier}
                    </span>
                  </div>
                  {watch && (
                    <div className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-platinum-silver/70'}`}>
                      <span>
                        Purchase: {formatPrice(watch.purchasePrice)} • {formatDate(watch.inDate)}
                      </span>
                      {watch.dateSold && (
                        <span className='ml-2'>
                          • Sold: {formatPrice(watch.priceSold)} • {formatDate(watch.dateSold)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type='button'
                  onClick={() => onRemoveAssociation(assoc.watchId, assoc.role)}
                  className='text-crimson-red/70 hover:text-crimson-red p-1'
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
          {boughtWatches.length === 0 && (
            <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-platinum-silver/60'}`}>
              No watches purchased by this contact.
            </p>
          )}
        </div>
      </div>

      {/* Sold Watches Section */}
      <div>
        <h3 className={`text-lg font-semibold mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
          Sold Watches ({soldWatches.length})
        </h3>
        <div className='space-y-2 mb-4'>
          {soldWatches.map((assoc) => {
            const watch = getWatchDetails(assoc.watchId);
            return (
              <div
                key={`${assoc.watchId}-${assoc.role}`}
                className={`flex items-center justify-between p-3 rounded-md border ${
                  theme === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-arctic-blue/10 border-arctic-blue/20'
                }`}
              >
                <div className='flex-1'>
                  <div className='flex items-center gap-2 mb-1'>
                    <span
                      className={`font-semibold text-sm px-2 py-1 rounded ${
                        theme === 'light' ? 'bg-blue-600 text-white' : 'bg-arctic-blue text-obsidian-black'
                      }`}
                    >
                      SELLER
                    </span>
                    <span className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
                      {assoc.watchIdentifier}
                    </span>
                  </div>
                  {watch && (
                    <div className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-platinum-silver/70'}`}>
                      <span>
                        Purchase: {formatPrice(watch.purchasePrice)} • {formatDate(watch.inDate)}
                      </span>
                      {watch.dateSold && (
                        <span className='ml-2'>
                          • Sold: {formatPrice(watch.priceSold)} • {formatDate(watch.dateSold)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  type='button'
                  onClick={() => onRemoveAssociation(assoc.watchId, assoc.role)}
                  className='text-crimson-red/70 hover:text-crimson-red p-1'
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
          {soldWatches.length === 0 && (
            <p className={`text-sm ${theme === 'light' ? 'text-gray-500' : 'text-platinum-silver/60'}`}>
              No watches sold to this contact.
            </p>
          )}
        </div>
      </div>

      {/* Add New Association Section */}
      <div className={`pt-4 border-t ${theme === 'light' ? 'border-gray-200' : 'border-champagne-gold/10'}`}>
        <h3 className={`text-lg font-semibold mb-3 ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
          Add Watch Association
        </h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end'>
          <div className='sm:col-span-2 md:col-span-2'>
            <label htmlFor='watch' className={labelClass}>
              Select Watch
            </label>
            <select
              id='watch'
              value={selectedWatchId}
              onChange={(e) => onWatchIdChange(e.target.value)}
              className={inputClass}
            >
              <option value=''>Select a watch...</option>
              {availableWatches.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.brand} {w.model}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor='role' className={labelClass}>
              Role
            </label>
            <select
              id='role'
              value={selectedRole}
              onChange={(e) => onRoleChange(e.target.value as AssociationRole)}
              className={inputClass}
            >
              {Object.values(AssociationRole).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className='md:col-span-2'>
            <button
              type='button'
              onClick={handleAddAssociation}
              disabled={!selectedWatchId}
              className={`w-full py-2.5 px-4 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                theme === 'light'
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-champagne-gold/20 text-champagne-gold hover:bg-champagne-gold/30'
              }`}
            >
              Add Association
            </button>
          </div>
        </div>
        {associationConflict && (
          <div
            className={`mt-3 p-2 text-xs rounded-md flex items-center gap-2 ${
              theme === 'light'
                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                : 'bg-yellow-900/50 text-yellow-300'
            }`}
          >
            <AlertTriangle size={16} />
            <span>{associationConflict}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchesTab;
