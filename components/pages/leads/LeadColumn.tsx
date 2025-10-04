import React from 'react';
import { motion } from 'framer-motion';
import { Lead, Contact } from '../../../types';
import LeadCard from './LeadCard';
import { useTheme } from '../../../hooks/useTheme';

interface LeadColumnProps {
  title: string;
  leads: Lead[];
  contacts: Contact[];
  onCardClick: (lead: Lead) => void;
  onCardDelete: (lead: Lead) => void;
  onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: any, lead: Lead) => void;
  dragConstraints: React.RefObject<HTMLDivElement>;
}

const LeadColumn = React.forwardRef<HTMLDivElement, LeadColumnProps>(
  ({ title, leads, contacts, onCardClick, onCardDelete, onDragEnd, dragConstraints }, ref) => {
    const { theme } = useTheme();

    return (
      <div
        ref={ref}
        className={`w-full rounded-xl p-3 ${
          theme === 'light' ? 'bg-gray-50 border border-gray-200' : 'bg-obsidian-black/50'
        }`}
      >
        <h3 className={`text-lg font-bold mb-4 px-1 ${theme === 'light' ? 'text-gray-900' : 'text-champagne-gold'}`}>
          {title}
          <span className={`font-normal text-base ${theme === 'light' ? 'text-gray-500' : 'text-platinum-silver/50'}`}>
            ({leads.length})
          </span>
        </h3>
        <motion.div className='space-y-3 min-h-[50px]' layout>
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              contact={contacts.find((c) => c.id === lead.contactId)}
              onClick={() => onCardClick(lead)}
              onDelete={() => onCardDelete(lead)}
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
