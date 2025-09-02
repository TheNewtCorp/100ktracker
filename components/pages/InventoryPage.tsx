import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus, Download } from 'lucide-react';
import { Watch, WatchSet, Contact, ContactType } from '../../types';
import WatchFormModal from './inventory/WatchFormModal';
import WatchList from './inventory/WatchList';
import AssociationPopover from './inventory/AssociationPopover';
import ConfirmDeleteModal from './inventory/ConfirmDeleteModal';
import apiService from '../../services/apiService';

const InventoryPage: React.FC = () => {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWatch, setEditingWatch] = useState<Watch | null>(null);
  const [viewingWatchAssociations, setViewingWatchAssociations] = useState<Watch | null>(null);
  const [deletingWatch, setDeletingWatch] = useState<Watch | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [watchesResponse, contactsResponse] = await Promise.all([
        apiService.getWatches(),
        apiService.getContacts(),
      ]);

      // Transform API response to match frontend interface
      const transformedWatches = watchesResponse.watches.map((watch: any) => ({
        id: watch.id.toString(),
        brand: watch.brand,
        model: watch.model,
        referenceNumber: watch.reference_number,
        inDate: watch.in_date,
        serialNumber: watch.serial_number,
        watchSet: watch.watch_set as WatchSet,
        platformPurchased: watch.platform_purchased,
        purchasePrice: watch.purchase_price,
        liquidationPrice: watch.liquidation_price,
        accessories: watch.accessories,
        accessoriesCost: watch.accessories_cost,
        dateSold: watch.date_sold,
        platformSold: watch.platform_sold,
        priceSold: watch.price_sold,
        fees: watch.fees,
        shipping: watch.shipping,
        taxes: watch.taxes,
        notes: watch.notes,
        buyerContactId: watch.buyer_contact_id?.toString(),
        sellerContactId: watch.seller_contact_id?.toString(),
      }));

      const transformedContacts = contactsResponse.contacts.map((contact: any) => ({
        id: contact.id.toString(),
        firstName: contact.first_name,
        lastName: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        contactSource: contact.contact_source,
        contactType: contact.contact_type as ContactType,
        businessName: contact.business_name,
        streetAddress: contact.street_address,
        city: contact.city,
        state: contact.state,
        postalCode: contact.postal_code,
        website: contact.website,
        timeZone: contact.time_zone,
        notes: contact.notes,
        cards: [], // Cards will be loaded separately if needed
      }));

      setWatches(transformedWatches);
      setContacts(transformedContacts);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Failed to load inventory data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const processedWatches = useMemo(() => {
    return watches.map((watch) => {
      const purchasePrice = watch.purchasePrice || 0;
      const accessoriesCost = watch.accessoriesCost || 0;
      const totalIn = purchasePrice + accessoriesCost;

      const priceSold = watch.priceSold || 0;
      const fees = watch.fees || 0;
      const shipping = watch.shipping || 0;
      const taxes = watch.taxes || 0;

      let netProfit: number | undefined = undefined;
      let profitPercentage: number | undefined = undefined;
      if (watch.dateSold && priceSold > 0) {
        netProfit = priceSold - totalIn - fees - shipping - taxes;
        if (totalIn > 0) {
          profitPercentage = (netProfit / totalIn) * 100;
        }
      }

      let holdTime: string | undefined = undefined;
      if (watch.inDate) {
        const inDate = new Date(watch.inDate);
        let endDate: Date;
        if (watch.dateSold) {
          endDate = new Date(watch.dateSold);
        } else {
          endDate = new Date();
        }
        if (endDate > inDate) {
          const diffDays = Math.round((endDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24));
          holdTime = `${diffDays} days`;
        }
      }

      return { ...watch, totalIn, netProfit, profitPercentage, holdTime };
    });
  }, [watches]);

  const handleAddNew = () => {
    setEditingWatch(null);
    setIsModalOpen(true);
  };

  const handleEdit = (watch: Watch) => {
    setEditingWatch(watch);
    setIsModalOpen(true);
  };

  const handleDelete = (watch: Watch) => {
    setDeletingWatch(watch);
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingWatch) return;

    setIsDeleting(true);
    try {
      await apiService.deleteWatch(deletingWatch.id);
      await loadData(); // Reload data to get the updated list
      setDeletingWatch(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete watch');
      console.error('Failed to delete watch:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [deletingWatch, loadData]);

  const handleCancelDelete = () => {
    setDeletingWatch(null);
    setIsDeleting(false);
  };

  const handleSaveWatch = useCallback(
    async (watchData: Omit<Watch, 'id'> | Watch) => {
      try {
        setError(null);

        // Transform frontend data to API format
        const apiWatchData = {
          brand: watchData.brand,
          model: watchData.model,
          reference_number: watchData.referenceNumber,
          in_date: watchData.inDate,
          serial_number: watchData.serialNumber,
          watch_set: watchData.watchSet,
          platform_purchased: watchData.platformPurchased,
          purchase_price: watchData.purchasePrice,
          liquidation_price: watchData.liquidationPrice,
          accessories: watchData.accessories,
          accessories_cost: watchData.accessoriesCost,
          date_sold: watchData.dateSold,
          platform_sold: watchData.platformSold,
          price_sold: watchData.priceSold,
          fees: watchData.fees,
          shipping: watchData.shipping,
          taxes: watchData.taxes,
          notes: watchData.notes,
          buyer_contact_id: watchData.buyerContactId ? parseInt(watchData.buyerContactId) : null,
          seller_contact_id: watchData.sellerContactId ? parseInt(watchData.sellerContactId) : null,
        };

        let savedWatch;
        if ('id' in watchData && watchData.id) {
          // Update existing watch
          savedWatch = await apiService.updateWatch(watchData.id, apiWatchData);
        } else {
          // Create new watch
          savedWatch = await apiService.createWatch(apiWatchData);
        }

        // Reload data to get the updated list
        await loadData();
        setIsModalOpen(false);
        setEditingWatch(null);
      } catch (err: any) {
        setError(err.message || 'Failed to save watch');
        console.error('Failed to save watch:', err);
      }
    },
    [loadData],
  );

  const handleExportCSV = () => {
    const headers = [
      'In Date',
      'Brand',
      'Model',
      'Reference Number',
      'Serial Number',
      'Set',
      'Platform Purchased',
      'Purchase Price',
      'Liquidation Price',
      'Accessories',
      'Accessories Cost',
      'Date Sold',
      'Platform Sold',
      'Price Sold',
      'Fees',
      'Shipping',
      'Taxes',
      'Notes',
      'Total In',
      'Net Profit',
      'Profit (%)',
      'Hold Time',
    ];

    const rows = processedWatches.map((w) =>
      [
        w.inDate || '',
        w.brand,
        w.model,
        w.referenceNumber,
        w.serialNumber || '',
        w.watchSet || '',
        w.platformPurchased || '',
        w.purchasePrice || '',
        w.liquidationPrice || '',
        w.accessories || '',
        w.accessoriesCost || '',
        w.dateSold || '',
        w.platformSold || '',
        w.priceSold || '',
        w.fees || '',
        w.shipping || '',
        w.taxes || '',
        `"${(w.notes || '').replace(/"/g, '""')}"`, // Escape quotes
        w.totalIn || '',
        w.netProfit?.toFixed(2) || '',
        w.profitPercentage?.toFixed(2) || '',
        w.holdTime || '',
      ].join(','),
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'watch_inventory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center p-8'>
        <div className='w-8 h-8 border-4 border-champagne-gold border-t-transparent rounded-full animate-spin'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-8'>
        <div className='bg-crimson-red/10 border border-crimson-red/20 rounded-lg p-4 mb-6'>
          <p className='text-crimson-red font-medium'>Error loading inventory</p>
          <p className='text-crimson-red/80 text-sm mt-1'>{error}</p>
          <button
            onClick={loadData}
            className='mt-3 px-4 py-2 bg-crimson-red text-white rounded-lg text-sm hover:bg-red-700'
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className='text-platinum-silver/80 mb-6'>Track your watch inventory from acquisition to sale.</p>

      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
        <h2 className='text-2xl font-semibold text-platinum-silver'>Your Inventory</h2>
        <div className='flex items-center gap-3'>
          <button
            onClick={handleExportCSV}
            className='flex items-center gap-2 bg-charcoal-slate border border-champagne-gold/50 text-champagne-gold font-bold py-2 px-4 rounded-lg hover:bg-champagne-gold/10 transition-all duration-300'
          >
            <Download size={20} />
            Export to CSV
          </button>
          <button
            onClick={handleAddNew}
            className='flex items-center gap-2 bg-champagne-gold text-obsidian-black font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-300'
          >
            <Plus size={20} />
            Add New Watch
          </button>
        </div>
      </div>

      <WatchList
        watches={processedWatches}
        onEdit={handleEdit}
        onShowAssociations={setViewingWatchAssociations}
        onDelete={handleDelete}
      />

      <AnimatePresence>
        {isModalOpen && (
          <WatchFormModal
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveWatch}
            watch={editingWatch}
            contacts={contacts}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingWatchAssociations && (
          <AssociationPopover
            watch={viewingWatchAssociations}
            contacts={contacts}
            onClose={() => setViewingWatchAssociations(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingWatch && (
          <ConfirmDeleteModal
            watch={deletingWatch}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryPage;
