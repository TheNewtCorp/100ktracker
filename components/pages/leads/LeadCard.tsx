import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Trash2 } from 'lucide-react';
import { Lead, Contact } from '../../../types';
import { useTheme } from '../../../hooks/useTheme';

interface LeadCardProps {
  lead: Lead;
  contact?: Contact;
  onClick: () => void;
  onDelete: () => void;
  onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: any, lead: Lead) => void;
  dragConstraints: React.RefObject<HTMLDivElement>;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, contact, onClick, onDelete, onDragEnd, dragConstraints }) => {
  const { theme } = useTheme();

  return (
    <motion.div
      layout
      layoutId={lead.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      drag={true}
      dragConstraints={dragConstraints}
      dragElastic={0.2}
      onDragEnd={(event, info) => onDragEnd(event, info, lead)}
      whileDrag={{
        scale: 1.05,
        zIndex: 100,
        boxShadow: theme === 'light' ? '0px 10px 30px rgba(0,0,0,0.15)' : '0px 10px 30px rgba(0,0,0,0.2)',
      }}
      className={`p-3 rounded-lg border cursor-grab active:cursor-grabbing shadow-md transition-shadow relative z-0 ${
        theme === 'light'
          ? 'bg-white border-gray-200 hover:shadow-blue-200'
          : 'bg-charcoal-slate border-champagne-gold/10 hover:shadow-champagne-gold/10'
      }`}
    >
      <h4 className={`font-semibold text-base ${theme === 'light' ? 'text-gray-900' : 'text-platinum-silver'}`}>
        {lead.title}
      </h4>

      {(contact || lead.reminderDate) && (
        <div
          className={`mt-2 flex items-center justify-between text-xs ${
            theme === 'light' ? 'text-gray-600' : 'text-platinum-silver/60'
          }`}
        >
          {contact && (
            <span>
              {contact.firstName} {contact.lastName || ''}
            </span>
          )}
          {lead.reminderDate && (
            <div
              className={`flex items-center gap-1 ${theme === 'light' ? 'text-blue-600' : 'text-arctic-blue'}`}
              title={`Reminder set for ${lead.reminderDate}`}
            >
              <Bell size={12} />
              <span>{new Date(lead.reminderDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}

      <div
        className={`flex items-center justify-between mt-2 pt-2 border-t ${
          theme === 'light' ? 'border-gray-200' : 'border-champagne-gold/10'
        }`}
      >
        <button
          onClick={onClick}
          onPointerDown={(e) => e.stopPropagation()} /* Prevent drag from starting on button click */
          className={`text-left text-sm hover:underline ${theme === 'light' ? 'text-blue-600' : 'text-champagne-gold'}`}
        >
          View Details
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className={`p-1.5 rounded-md transition-colors hover:text-crimson-red hover:bg-crimson-red/10 ${
            theme === 'light' ? 'text-gray-400' : 'text-platinum-silver/40'
          }`}
          title='Delete lead'
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
};

export default LeadCard;
