export enum Tool {
  Metrics = 'Metrics',
  Leads = 'Leads',
  LDF = 'Luxury Deal Finder',
  TPE = 'Target Price Evaluator',
  Contacts = 'Contacts',
  Inventory = 'Inventory',
  Payments = 'Payments',
  AccountSettings = 'Account Settings',
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

// New enhanced invoice status system
export enum InvoiceStatus {
  Created = 'created',
  Sent = 'sent',
  Fulfilled = 'fulfilled',
  Overdue = 'overdue',
  Cancelled = 'cancelled',
}

export interface InvoiceItem {
  id?: number;
  watch_id?: number;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

export interface Invoice {
  id: number;
  invoice_number: string; // INV-001 format
  contact_id?: number;
  status: InvoiceStatus;
  total_amount: number;
  currency: string;
  due_date?: string;
  notes?: string;
  created_at: string;
  sent_at?: string;
  fulfilled_at?: string;
  contact_name?: string;
  contact_email?: string;
  items?: InvoiceItem[];

  // Square integration fields
  square_payment_id?: string;
  pdf_generated_at?: string;
  square_invoice_id?: string;
  payment_processor?: string;
  payment_id?: string;
  payment_status?: string;

  // Legacy Stripe support
  stripe_invoice_id?: string;

  // Customer info for manual entries
  customer_info?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
}

// PDF generation options
export interface InvoicePDFOptions {
  includeHeader: boolean;
  includeLogo: boolean;
  template: 'standard' | 'minimal' | 'detailed';
  primaryColor?: string;
}

// Square charge data
export interface SquareChargeData {
  amount: number;
  currency: string;
  invoice_id: number;
  customer_info?: {
    name: string;
    email?: string;
  };
}

// Promo signup types for Operandi Challenge
export interface OperandiSignupData {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  referralSource: string;
  experienceLevel: string;
  interests: string;
  comments: string;
}

export interface PromoSignup {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  business_name: string;
  referral_source?: string;
  experience_level?: string;
  interests?: string;
  comments?: string;
  signup_date: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PromoSignupResponse {
  success: boolean;
  message: string;
  signupId?: number;
  timestamp: string;
}

export interface PromoSignupsListResponse {
  success: boolean;
  timestamp: string;
  summary: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  signups: PromoSignup[];
}
