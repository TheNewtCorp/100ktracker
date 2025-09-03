export enum Tool {
  Metrics = 'Metrics',
  Leads = 'Leads',
  LDF = 'Luxury Deal Finder',
  TPE = 'Target Price Evaluator',
  Contacts = 'Contacts',
  Inventory = 'Inventory',
  Payments = 'Payments',
}

export interface AppTool {
  id: Tool;
  title: string;
  description: string;
}

export enum ContactType {
  Lead = 'Lead',
  Customer = 'Customer',
  WatchTrader = 'Watch Trader',
  Jeweler = 'Jeweler',
}

export enum AssociationRole {
  Buyer = 'Buyer',
  Seller = 'Seller',
}

export enum WatchSet {
  WatchOnly = 'Watch Only',
  WatchAndBox = 'Watch & Box',
  WatchAndPapers = 'Watch & Papers',
  FullSet = 'Full Set',
}

export enum LeadStatus {
  Monitoring = 'Monitoring',
  Contacted = 'Contacted',
  Negotiating = 'Negotiating',
  OfferRejected = 'Offer Rejected',
  FollowUp = 'Follow Up',
  OfferAccepted = 'Offer Accepted',
  DealFinalized = 'Deal Finalized',
}

export interface Lead {
  id: string;
  title: string;
  status: LeadStatus;
  contactId?: string | null;
  watchReference?: string;
  notes?: string;
  reminderDate?: string; // YYYY-MM-DD
}

export interface Alert {
  id: string; // can be leadId
  leadTitle: string;
  message: string;
  dueDate: string; // YYYY-MM-DD
}

export interface Watch {
  id: string;
  brand: string;
  model: string;
  referenceNumber: string;

  // Inventory Fields
  inDate?: string; // YYYY-MM-DD
  serialNumber?: string;
  watchSet?: WatchSet;
  platformPurchased?: string;
  purchasePrice?: number;
  liquidationPrice?: number;
  accessories?: string;
  accessoriesCost?: number;
  dateSold?: string; // YYYY-MM-DD
  platformSold?: string;
  priceSold?: number;
  fees?: number;
  shipping?: number;
  taxes?: number;
  notes?: string;

  // Calculated Fields (non-editable by user in form)
  totalIn?: number;
  netProfit?: number;
  profitPercentage?: number;
  holdTime?: string;

  // Associations
  buyerContactId?: string | null;
  sellerContactId?: string | null;
}

export interface WatchAssociation {
  watchId: string;
  role: AssociationRole;
  watchIdentifier: string; // e.g., "Rolex Submariner 126610LN"
}

export interface Card {
  id: string; // Unique ID for the card
  cardholderName: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
}

export interface Contact {
  id: string; // Using string for UUIDs from a backend
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  contactSource?: string;
  contactType?: ContactType;
  businessName?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  website?: string;
  timeZone?: string;
  notes?: string;
  watchAssociations?: WatchAssociation[];
  cards?: Card[];
  stripe_customer_id?: string;
}

export enum InvoiceStatus {
  Draft = 'draft',
  Open = 'open',
  Paid = 'paid',
  Void = 'void',
  Uncollectible = 'uncollectible',
}

export interface InvoiceItem {
  id?: number;
  watch_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

export interface Invoice {
  id: number;
  stripe_invoice_id: string;
  contact_id: number;
  status: InvoiceStatus;
  total_amount: number;
  currency: string;
  due_date?: string;
  notes?: string;
  created_at: string;
  contact_name?: string;
  contact_email?: string;
  items?: InvoiceItem[];
  stripe_details?: {
    hosted_invoice_url?: string;
    invoice_pdf?: string;
    payment_intent?: string;
  };
}
