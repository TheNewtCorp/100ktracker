import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Lead, LeadStatus, Contact, ContactType } from '../../types';
import LeadColumn from './leads/LeadColumn';
import LeadFormModal from './leads/LeadFormModal';
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
}

const LeadsPage: React.FC<LeadsPageProps> = ({ onLeadsUpdate }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

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

  useEffect(() => {
    onLeadsUpdate(leads);
  }, [leads, onLeadsUpdate]);

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

  const boardRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: any, lead: Lead) => {
    const point = { x: info.point.x, y: info.point.y };

    for (let i = 0; i < statusOrder.length; i++) {
      const columnEl = columnRefs.current[i];
      if (columnEl) {
        const rect = columnEl.getBoundingClientRect();
        if (point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom) {
          const newStatus = statusOrder[i];
          if (lead.status !== newStatus) {
            const updatedLead = { ...lead, status: newStatus };
            setLeads((prev) => prev.map((l) => (l.id === lead.id ? updatedLead : l)));
          }
          break;
        }
      }
    }
  }, []);

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
          <p className='text-crimson-red font-medium'>Error loading leads</p>
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
      <div className='flex justify-between items-center mb-6'>
        <p className='text-platinum-silver/80'>Track and manage your watch acquisition and sales leads.</p>
        <button
          onClick={handleAddNew}
          className='flex items-center gap-2 bg-champagne-gold text-obsidian-black font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-all duration-300'
        >
          <Plus size={20} />
          Add New Lead
        </button>
      </div>

      <div ref={boardRef} className='flex overflow-x-auto space-x-4 p-2 -mx-2'>
        {statusOrder.map((status, index) => (
          <LeadColumn
            key={status}
            title={status}
            leads={leads.filter((l) => l.status === status)}
            contacts={contacts}
            onCardClick={handleEdit}
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
            onClose={() => setIsModalOpen(false)}
            onSave={handleSaveLead}
            lead={editingLead}
            contacts={contacts}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default LeadsPage;
