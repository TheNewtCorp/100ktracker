import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Lead, LeadStatus, Contact, ContactType } from '../../types';
import LeadColumn from './leads/LeadColumn';
import LeadFormModal from './leads/LeadFormModal';
import ConfirmDeleteLeadModal from './leads/ConfirmDeleteLeadModal';
import { useTheme } from '../../hooks/useTheme';
import apiService from '../../services/apiService';

const statusOrder: LeadStatus[] = [
  LeadStatus.Monitoring,
  LeadStatus.Contacted,
  LeadStatus.Negotiating,
  LeadStatus.FollowUp,
  LeadStatus.OfferAccepted,
  LeadStatus.OfferRejected,
  LeadStatus.DealFinalized,
];

interface LeadsPageProps {
  onLeadsUpdate: (leads: Lead[]) => void;
  initialLeadId?: string; // Optional lead ID to auto-open details for
}

const LeadsPage: React.FC<LeadsPageProps> = ({ onLeadsUpdate, initialLeadId }) => {
  const { theme } = useTheme();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasProcessedInitialLead, setHasProcessedInitialLead] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [leadsResponse, contactsResponse] = await Promise.all([apiService.getLeads(), apiService.getContacts()]);

      // Transform API response to match frontend interface
      const transformedLeads = leadsResponse.leads.map((lead: any) => ({
        id: lead.id.toString(),
        title: lead.title,
        status: lead.status as LeadStatus,
        contactId: lead.contact_id?.toString(),
        watchReference: lead.watch_reference,
        reminderDate: lead.reminder_date,
        notes: lead.notes,
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
        cards: [],
      }));

      setLeads(transformedLeads);
      setContacts(transformedContacts);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      console.error('Failed to load leads data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset the processed flag when initialLeadId changes
  useEffect(() => {
    setHasProcessedInitialLead(false);
  }, [initialLeadId]);

  useEffect(() => {
    onLeadsUpdate(leads);

    // Auto-open lead details if initialLeadId is provided and lead exists
    if (initialLeadId && leads.length > 0 && !isModalOpen && !hasProcessedInitialLead) {
      const leadToOpen = leads.find((lead) => lead.id === initialLeadId);
      if (leadToOpen) {
        console.log(`Auto-opening lead details for: "${leadToOpen.title}"`);
        handleEdit(leadToOpen);
        setHasProcessedInitialLead(true); // Mark as processed
      }
    }
  }, [leads, onLeadsUpdate, initialLeadId, isModalOpen, hasProcessedInitialLead]);

  const handleAddNew = () => {
    setEditingLead(null);
    setIsModalOpen(true);
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  const handleSaveLead = useCallback(
    async (leadData: Omit<Lead, 'id'> | Lead) => {
      try {
        setError(null);

        // Transform frontend data to API format
        const apiLeadData = {
          title: leadData.title,
          status: leadData.status,
          contact_id: leadData.contactId ? parseInt(leadData.contactId) : null,
          watch_reference: leadData.watchReference,
          reminder_date: leadData.reminderDate,
          notes: leadData.notes,
        };

        let savedLead;
        if ('id' in leadData && leadData.id) {
          // Update existing lead
          savedLead = await apiService.updateLead(leadData.id, apiLeadData);
        } else {
          // Create new lead
          savedLead = await apiService.createLead(apiLeadData);
        }

        // Reload data to get the updated list
        await loadData();
        setIsModalOpen(false);
        setEditingLead(null);
      } catch (err: any) {
        setError(err.message || 'Failed to save lead');
        console.error('Failed to save lead:', err);
      }
    },
    [loadData],
  );

  const handleDeleteLead = useCallback((lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!leadToDelete) return;

    setIsDeleting(true);
    try {
      await apiService.deleteLead(leadToDelete.id);
      await loadData(); // Reload to refresh the leads
      setDeleteModalOpen(false);
      setLeadToDelete(null);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete lead');
      console.error('Failed to delete lead:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [leadToDelete, loadData]);

  const handleCloseDeleteModal = useCallback(() => {
    if (isDeleting) return;
    setDeleteModalOpen(false);
    setLeadToDelete(null);
  }, [isDeleting]);

  const boardRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleDragEnd = useCallback(async (event: MouseEvent | TouchEvent | PointerEvent, info: any, lead: Lead) => {
    const point = { x: info.point.x, y: info.point.y };

    for (let i = 0; i < statusOrder.length; i++) {
      const columnEl = columnRefs.current[i];
      if (columnEl) {
        const rect = columnEl.getBoundingClientRect();
        if (point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom) {
          const newStatus = statusOrder[i];
          if (lead.status !== newStatus) {
            // Optimistically update the UI first
            const updatedLead = { ...lead, status: newStatus };
            setLeads((prev) => prev.map((l) => (l.id === lead.id ? updatedLead : l)));

            try {
              // Persist the status change to the backend
              const apiLeadData = {
                title: lead.title,
                status: newStatus,
                contact_id: lead.contactId ? parseInt(lead.contactId) : null,
                watch_reference: lead.watchReference,
                reminder_date: lead.reminderDate,
                notes: lead.notes,
              };

              await apiService.updateLead(lead.id, apiLeadData);
              console.log(`Lead "${lead.title}" status updated to "${newStatus}"`);
            } catch (err: any) {
              // If the API call fails, revert the optimistic update
              console.error('Failed to update lead status:', err);
              setLeads((prev) => prev.map((l) => (l.id === lead.id ? lead : l))); // Revert to original
              setError(err.message || 'Failed to update lead status');

              // Optional: Show a toast notification or alert
              setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
            }
          }
          break;
        }
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center p-8'>
        <div
          className={`w-8 h-8 border-4 rounded-full animate-spin ${
            theme === 'light' ? 'border-blue-600 border-t-transparent' : 'border-champagne-gold border-t-transparent'
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
          <p className='text-crimson-red font-medium'>Error loading leads</p>
          <p className={`text-sm mt-1 ${theme === 'light' ? 'text-red-600' : 'text-crimson-red/80'}`}>{error}</p>
          <button
            onClick={loadData}
            className={`mt-3 px-4 py-2 rounded-lg text-sm transition-colors ${
              theme === 'light'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-crimson-red text-white hover:bg-red-700'
            }`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <p className={theme === 'light' ? 'text-gray-600' : 'text-platinum-silver/80'}>
          Track and manage your watch acquisition and sales leads.
        </p>
        <button
          onClick={handleAddNew}
          className={`flex items-center gap-2 font-bold py-2 px-4 rounded-lg transition-all duration-300 ${
            theme === 'light'
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-champagne-gold text-obsidian-black hover:bg-opacity-90'
          }`}
        >
          <Plus size={20} />
          Add New Lead
        </button>
      </div>

      <div ref={boardRef} className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-2'>
        {statusOrder.map((status, index) => (
          <LeadColumn
            key={status}
            title={status}
            leads={leads.filter((l) => l.status === status)}
            contacts={contacts}
            onCardClick={handleEdit}
            onCardDelete={handleDeleteLead}
            onDragEnd={handleDragEnd}
            dragConstraints={boardRef}
            // FIX: The ref callback should not return a value.
            // Using a block statement `{}` ensures an implicit `undefined` return.
            ref={(el) => {
              columnRefs.current[index] = el;
            }}
          />
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <LeadFormModal
            onClose={() => {
              setIsModalOpen(false);
              setEditingLead(null);
            }}
            onSave={handleSaveLead}
            lead={editingLead}
            contacts={contacts}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && leadToDelete && (
          <ConfirmDeleteLeadModal
            onClose={handleCloseDeleteModal}
            onConfirm={handleConfirmDelete}
            lead={leadToDelete}
            contact={leadToDelete.contactId ? contacts.find((c) => c.id === leadToDelete.contactId) : undefined}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeadsPage;
