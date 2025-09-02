import React from 'react';
import { motion } from 'framer-motion';
import { Edit2, Package, CreditCard, DollarSign } from 'lucide-react';
import { Contact, ContactType } from '../../../types';

interface ContactListProps {
    contacts: Contact[];
    onEdit: (contact: Contact) => void;
    onCreateInvoice: (contact: Contact) => void;
}

const getTypeColor = (type?: ContactType) => {
    switch (type) {
        case ContactType.Lead:
            return 'bg-blue-500/20 text-blue-300';
        case ContactType.Customer:
            return 'bg-green-500/20 text-green-300';
        case ContactType.WatchTrader:
            return 'bg-purple-500/20 text-purple-300';
        case ContactType.Jeweler:
            return 'bg-yellow-500/20 text-yellow-300';
        default:
            return 'bg-gray-500/20 text-gray-300';
    }
}

const ContactList: React.FC<ContactListProps> = ({ contacts, onEdit, onCreateInvoice }) => {
    if (contacts.length === 0) {
        return (
             <div className="p-8 border-2 border-dashed border-champagne-gold/20 rounded-lg text-center text-platinum-silver/60">
                You have no contacts yet. Click "Add New Contact" to get started.
            </div>
        )
    }

    return (
        <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={{
                hidden: { opacity: 0 },
                show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 }
                }
            }}
            initial="hidden"
            animate="show"
        >
            {contacts.map(contact => (
                <motion.div
                    key={contact.id}
                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                    className="bg-charcoal-slate p-5 rounded-xl relative overflow-hidden group border border-champagne-gold/10 hover:border-champagne-gold/30 transition-colors duration-300 flex flex-col justify-between"
                >
                    <div>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-xl text-platinum-silver truncate">{contact.firstName} {contact.lastName}</h3>
                                {contact.businessName && <p className="text-sm text-platinum-silver/60">{contact.businessName}</p>}
                            </div>
                            {contact.contactType && (
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(contact.contactType)}`}>
                                    {contact.contactType}
                                </span>
                            )}
                        </div>
                        
                        <div className="mt-4 space-y-2 text-sm text-platinum-silver/80">
                            {contact.email && <p className="truncate"><strong>Email:</strong> {contact.email}</p>}
                            {contact.phone && <p><strong>Phone:</strong> {contact.phone}</p>}
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-champagne-gold/10 flex items-center gap-4 text-xs text-platinum-silver/60">
                        {contact.watchAssociations && contact.watchAssociations.length > 0 && (
                            <div className="flex items-center gap-2" title={`${contact.watchAssociations.length} associated watch(es)`}>
                                <Package size={14} />
                                <span>{contact.watchAssociations.length}</span>
                            </div>
                        )}
                         {contact.cards && contact.cards.length > 0 && (
                            <div className="flex items-center gap-2" title={`${contact.cards.length} saved card(s)`}>
                                <CreditCard size={14} />
                                <span>{contact.cards.length}</span>
                            </div>
                        )}
                    </div>

                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <button 
                            onClick={() => onEdit(contact)}
                            className="p-2 bg-obsidian-black/50 rounded-full text-platinum-silver/60 opacity-0 group-hover:opacity-100 transition-all"
                            aria-label={`Edit ${contact.firstName}`}
                            title="Edit Contact"
                        >
                            <Edit2 size={16} />
                        </button>
                        {contact.cards && contact.cards.length > 0 && (
                             <button 
                                onClick={() => onCreateInvoice(contact)}
                                className="p-2 bg-obsidian-black/50 rounded-full text-money-green/70 opacity-0 group-hover:opacity-100 transition-all delay-75"
                                aria-label={`Create invoice for ${contact.firstName}`}
                                title="Create Invoice"
                            >
                                <DollarSign size={16} />
                            </button>
                        )}
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );
};

export default ContactList;