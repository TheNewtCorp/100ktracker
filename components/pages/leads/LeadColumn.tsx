import React from 'react';
import { motion } from 'framer-motion';
import { Lead, Contact } from '../../../types';
import LeadCard from './LeadCard';

interface LeadColumnProps {
  title: string;
  leads: Lead[];
  contacts: Contact[];
  onCardClick: (lead: Lead) => void;
  onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: any, lead: Lead) => void;
  dragConstraints: React.RefObject<HTMLDivElement>;
}

const LeadColumn = React.forwardRef<HTMLDivElement, LeadColumnProps>(
  ({ title, leads, contacts, onCardClick, onDragEnd, dragConstraints }, ref) => {
    return (
      <div ref={ref} className='w-full bg-obsidian-black/50 rounded-xl p-3'>
        <h3 className='text-lg font-bold text-champagne-gold mb-4 px-1'>
          {title} <span className='text-platinum-silver/50 font-normal text-base'>({leads.length})</span>
        </h3>
        <motion.div className='space-y-3 min-h-[50px]' layout>
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              contact={contacts.find((c) => c.id === lead.contactId)}
              onClick={() => onCardClick(lead)}
              onDragEnd={onDragEnd}
              dragConstraints={dragConstraints}
            />
          ))}
        </motion.div>
      </div>
    );
  },
);

export default LeadColumn;
