import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Contact, ContactType, Watch, AssociationRole, WatchAssociation, Card } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import ContactFormModal from './contact/ContactFormModal';
import ContactList from './contact/ContactList';
import ConfirmDeleteContactModal from './contact/ConfirmDeleteContactModal';
import apiService from '../../services/apiService';

// Placeholder for Stripe invoice creation
const createStripeInvoiceWithContact = async (contact: Contact) => {
  if (!contact.cards || contact.cards.length === 0) {
    alert('This contact has no saved card to charge.');
    return;
  }
  // In a real app, you might let the user choose which card if there are multiple.
  const cardToUse = contact.cards[0];
  console.log(`--- Creating Stripe Invoice ---`);
  console.log(`Customer: ${contact.firstName} ${contact.lastName}`);
  console.log(`Email: ${contact.email}`);
  console.log(
    `Billing Address: ${contact.streetAddress || ''}, ${contact.city || ''}, ${contact.state || ''} ${contact.postalCode || ''}`,
  );
  console.log(`Card on file: **** **** **** ${cardToUse.last4}`);
  console.log(`API Call to Stripe would be initiated here to create an invoice...`);
  alert(
    `Simulating Stripe invoice creation for ${contact.firstName} ${contact.lastName}. Check the console for details.`,
  );
};

const ContactsPage: React.FC = () => {
  const { theme } = useTheme();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [watches, setWatches] = useState<Watch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [contactsResponse, watchesResponse] = await Promise.all([
        apiService.getContacts(),
        apiService.getWatches(),
      ]);

      // Transform API response to match frontend interface
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

      const transformedWatches = watchesResponse.watches.map((watch: any) => ({
        id: watch.id.toString(),
        brand: watch.brand,
        model: watch.model,
        referenceNumber: watch.reference_number,
        inDate: watch.in_date,
        serialNumber: watch.serial_number,
        watchSet: watch.watch_set,
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

      console.log(
        'DEBUG: Loaded watches with associations:',
        transformedWatches.map((w) => ({
          id: w.id,
          brand: w.brand,
          model: w.model,
          buyerContactId: w.buyerContactId,
          sellerContactId: w.sellerContactId,
        })),
      );

      setContacts(transformedContacts);
      setWatches(transformedWatches);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Failed to load contacts data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const linkedContacts = useMemo(() => {
    if (isLoading) return [];
    return contacts.map((contact) => {
      const associations: WatchAssociation[] = [];
      watches.forEach((watch) => {
        const watchIdentifier = `${watch.brand} ${watch.model} (${watch.referenceNumber})`;
        if (watch.sellerContactId === contact.id) {
          console.log(`DEBUG: Found seller association - Watch ${watch.id} -> Contact ${contact.id}`);
          associations.push({ watchId: watch.id, role: AssociationRole.Seller, watchIdentifier });
        }
        if (watch.buyerContactId === contact.id) {
          console.log(`DEBUG: Found buyer association - Watch ${watch.id} -> Contact ${contact.id}`);
          associations.push({ watchId: watch.id, role: AssociationRole.Buyer, watchIdentifier });
        }
      });
      console.log(
        `DEBUG: Contact ${contact.firstName} ${contact.lastName} (${contact.id}) has ${associations.length} associations`,
      );
      // Ensure cards array exists
      return { ...contact, watchAssociations: associations, cards: contact.cards || [] };
    });
  }, [contacts, watches, isLoading]);

  const handleAddNew = () => {
    setEditingContact(null);
    setIsModalOpen(true);
  };

  const handleEdit = (contact: Contact) => {
    const fullContactData = linkedContacts.find((c) => c.id === contact.id) || null;
    console.log('DEBUG: Editing contact:', fullContactData);
    console.log('DEBUG: Contact associations:', fullContactData?.watchAssociations);
    setEditingContact(fullContactData);
    setIsModalOpen(true);
  };

  const handleDelete = (contact: Contact) => {
    const fullContactData = linkedContacts.find((c) => c.id === contact.id) || null;
    setDeletingContact(fullContactData);
  };

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingContact) return;

    setIsDeleting(true);
    try {
      await apiService.deleteContact(deletingContact.id);
      await loadData(); // Reload data to get the updated list
      setDeletingContact(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete contact');
      console.error('Failed to delete contact:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [deletingContact, loadData]);

  const handleCancelDelete = () => {
    setDeletingContact(null);
    setIsDeleting(false);
  };

  const updateWatchAssociations = useCallback(
    async (contactId: string, newAssociations: WatchAssociation[]) => {
      console.log('DEBUG: Updating associations for contact', contactId, 'with', newAssociations);
      console.log('DEBUG: Current watches array length:', watches.length);

      // Clear existing associations for this contact
      const clearedWatches = watches.filter(
        (watch) => watch.buyerContactId === contactId || watch.sellerContactId === contactId,
      );

      console.log(
        'DEBUG: Clearing associations for watches:',
        clearedWatches.map((w) => ({
          id: w.id,
          brand: w.brand,
          buyerContactId: w.buyerContactId,
          sellerContactId: w.sellerContactId,
        })),
      );

      for (const watch of clearedWatches) {
        const updatedWatchData = {
          brand: watch.brand,
          model: watch.model,
          reference_number: watch.referenceNumber,
          in_date: watch.inDate,
          serial_number: watch.serialNumber,
          watch_set: watch.watchSet,
          platform_purchased: watch.platformPurchased,
          purchase_price: watch.purchasePrice,
          liquidation_price: watch.liquidationPrice,
          accessories: watch.accessories,
          accessories_cost: watch.accessoriesCost,
          date_sold: watch.dateSold,
          platform_sold: watch.platformSold,
          price_sold: watch.priceSold,
          fees: watch.fees,
          shipping: watch.shipping,
          taxes: watch.taxes,
          notes: watch.notes,
          buyer_contact_id: watch.buyerContactId === contactId ? null : watch.buyerContactId,
          seller_contact_id: watch.sellerContactId === contactId ? null : watch.sellerContactId,
        };
        console.log(
          'DEBUG: Clearing associations for watch',
          watch.id,
          'setting buyer_contact_id to',
          updatedWatchData.buyer_contact_id,
          'and seller_contact_id to',
          updatedWatchData.seller_contact_id,
        );
        await apiService.updateWatch(watch.id, updatedWatchData);
      }

      // Set new associations
      console.log('DEBUG: Setting new associations:', newAssociations);
      for (const association of newAssociations) {
        console.log('DEBUG: Looking for watch with ID:', association.watchId);
        console.log(
          'DEBUG: Available watch IDs:',
          watches.map((w) => w.id),
        );
        const watch = watches.find((w) => w.id === association.watchId);
        console.log('DEBUG: Found watch:', watch ? `${watch.brand} ${watch.model}` : 'NOT FOUND');
        if (watch) {
          const updatedWatchData = {
            brand: watch.brand,
            model: watch.model,
            reference_number: watch.referenceNumber,
            in_date: watch.inDate,
            serial_number: watch.serialNumber,
            watch_set: watch.watchSet,
            platform_purchased: watch.platformPurchased,
            purchase_price: watch.purchasePrice,
            liquidation_price: watch.liquidationPrice,
            accessories: watch.accessories,
            accessories_cost: watch.accessoriesCost,
            date_sold: watch.dateSold,
            platform_sold: watch.platformSold,
            price_sold: watch.priceSold,
            fees: watch.fees,
            shipping: watch.shipping,
            taxes: watch.taxes,
            notes: watch.notes,
            buyer_contact_id: association.role === AssociationRole.Buyer ? contactId : watch.buyerContactId,
            seller_contact_id: association.role === AssociationRole.Seller ? contactId : watch.sellerContactId,
          };
          console.log(
            'DEBUG: Setting association for watch',
            watch.id,
            'role',
            association.role,
            'buyer_contact_id',
            updatedWatchData.buyer_contact_id,
            'seller_contact_id',
            updatedWatchData.seller_contact_id,
          );
          const updateResult = await apiService.updateWatch(watch.id, updatedWatchData);
          console.log('DEBUG: Update result for watch', watch.id, ':', updateResult);
        }
      }
    },
    [watches],
  );

  const handleSaveContact = useCallback(
    async (contactData: Omit<Contact, 'id'> | Contact, newAssociations: WatchAssociation[], cards: Card[]) => {
      try {
        setError(null);

        // Transform frontend data to API format
        const apiContactData = {
          first_name: contactData.firstName,
          last_name: contactData.lastName,
          email: contactData.email,
          phone: contactData.phone,
          contact_source: contactData.contactSource,
          contact_type: contactData.contactType,
          business_name: contactData.businessName,
          street_address: contactData.streetAddress,
          city: contactData.city,
          state: contactData.state,
          postal_code: contactData.postalCode,
          website: contactData.website,
          time_zone: contactData.timeZone,
          notes: contactData.notes,
        };

        let savedContact;
        if ('id' in contactData && contactData.id) {
          // Update existing contact
          savedContact = await apiService.updateContact(contactData.id, apiContactData);
        } else {
          // Create new contact
          savedContact = await apiService.createContact(apiContactData);
        }

        // Handle watch associations updates
        const contactId = 'id' in contactData && contactData.id ? contactData.id : savedContact.contact?.id?.toString();

        console.log('DEBUG: Handling associations for contactId:', contactId, 'newAssociations:', newAssociations);

        if (contactId && newAssociations) {
          await updateWatchAssociations(contactId, newAssociations);
        }

        // TODO: Handle cards updates when card management API is implemented
        // if (contactId && cards) {
        //   await updateContactCards(contactId, cards);
        // }

        console.log('DEBUG: About to reload data after save');
        // Reload data to get the updated list
        await loadData();
        console.log('DEBUG: Data reloaded after save');
        setIsModalOpen(false);
        setEditingContact(null);
      } catch (err: any) {
        setError(err.message || 'Failed to save contact');
        console.error('Failed to save contact:', err);
      }
    },
    [loadData, updateWatchAssociations],
  );

  if (isLoading) {
    return (
      <div className='flex justify-center items-center p-8'>
        <div
          className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${
            theme === 'light' ? 'border-blue-600' : 'border-champagne-gold'
          }`}
        ></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-8'>
        <div
          className={`border rounded-lg p-4 mb-6 ${
            theme === 'light' ? 'bg-red-50 border-red-200' : 'bg-crimson-red/10 border-crimson-red/20'
          }`}
        >
          <p className='text-crimson-red font-medium'>Error loading contacts</p>
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
      <p className={`mb-6 ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver/80'}`}>
        Manage your network of clients, dealers, and partners.
      </p>

      <div className='flex justify-between items-center mb-6'>
        <h2 className={`text-2xl font-semibold ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
          Your Contacts
        </h2>
        <button
          onClick={handleAddNew}
          className={`flex items-center gap-2 font-bold py-2 px-4 rounded-lg transition-all duration-300 ${
            theme === 'light'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-champagne-gold text-obsidian-black hover:bg-opacity-90'
          }`}
        >
          <Plus size={20} />
          Add New Contact
        </button>
      </div>

      <ContactList
        contacts={linkedContacts}
        onEdit={handleEdit}
        onCreateInvoice={createStripeInvoiceWithContact}
        onDelete={handleDelete}
      />

      <AnimatePresence>
        {isModalOpen && (
          <ContactFormModal
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveContact}
            contact={editingContact}
            watches={watches}
            contacts={contacts}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingContact && (
          <ConfirmDeleteContactModal
            contact={deletingContact}
            onClose={handleCancelDelete}
            onConfirm={handleConfirmDelete}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContactsPage;
