import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, User, ShoppingCart, Tag } from 'lucide-react';
import { Watch, Contact } from '../../../types';

interface AssociationPopoverProps {
    watch: Watch;
    contacts: Contact[];
    onClose: () => void;
}

const AssociationPopover: React.FC<AssociationPopoverProps> = ({ watch, contacts, onClose }) => {
    const seller = useMemo(() => contacts.find(c => c.id === watch.sellerContactId), [contacts, watch.sellerContactId]);
    const buyer = useMemo(() => contacts.find(c => c.id === watch.buyerContactId), [contacts, watch.buyerContactId]);

    const getContactName = (contact: Contact | undefined) => {
        if (!contact) return <span className="text-platinum-silver/50">Not Assigned</span>;
        return `${contact.firstName} ${contact.lastName || ''}`;
    };

    return (
        <motion.div
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="bg-charcoal-slate rounded-xl w-full max-w-sm flex flex-col border border-champagne-gold/20 shadow-2xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between p-4 border-b border-champagne-gold/10">
                    <h2 className="text-lg font-bold text-champagne-gold">Watch Associations</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-obsidian-black/50 transition-colors">
                        <X size={20} />
                    </button>
                </header>
                
                <div className="p-5 space-y-4">
                    <div className="text-center pb-4 border-b border-champagne-gold/10">
                        <p className="font-semibold text-lg text-platinum-silver">{watch.brand} {watch.model}</p>
                        <p className="text-sm text-platinum-silver/60">{watch.referenceNumber}</p>
                    </div>

                    <div className="space-y-3 text-platinum-silver/90">
                        <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-deep-bordeaux/50 rounded-full text-crimson-red/80">
                                <Tag size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-platinum-silver/60">Seller</p>
                                <p className="font-medium">{getContactName(seller)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-money-green/20 rounded-full text-money-green">
                                <ShoppingCart size={16} />
                            </div>
                            <div>
                                <p className="text-xs text-platinum-silver/60">Buyer</p>
                                <p className="font-medium">{getContactName(buyer)}</p>
                            </div>
                        </div>
                    </div>
                </div>

            </motion.div>
        </motion.div>
    );
};

export default AssociationPopover;
