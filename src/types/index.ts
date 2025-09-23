export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

export interface UserProfile {
  userId: string;
  companyName: string;
  fullName: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  logoUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  _id: string;
  // Issuer
  issuerName: string;
  issuerCompany?: string;
  issuerAddress?: string;
  issuerCountry?: string;
  issuerPhone?: string;
  issuerLogoUrl?: string;
  // Client
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientAddress?: string;
  clientCountry?: string;
  clientPhone?: string;
  // Items & totals
  items: InvoiceItem[];
  amount: number;
  currency: 'USD';
  notes?: string;
  description?: string;
  dueDate: string;
  isPaid: boolean;
  paymentMethod?: 'Payoneer' | 'Western Union' | 'Zelle' | 'Credit Card' | 'Authorize.net' | 'Paypal';
  paidAt?: string;
  // Identification
  invoiceNumber?: number;
  invoiceNumberStr?: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  } | string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}
