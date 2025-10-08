export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isVerified?: boolean;
}

export interface UserProfile {
  _id?: string;
  userId?: string;
  companyName: string;
  fullName: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  logoUrl?: string;
  signatureUrl?: string;
  swiftCode?: string;
  iban?: string;
  cardNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  _id?: string;
  invoiceNumber?: number;
  invoiceNumberStr?: string;
  issuerName: string;
  issuerCompany?: string;
  issuerAddress?: string;
  issuerCountry?: string;
  issuerPhone?: string;
  issuerLogoUrl?: string;
  issuerSignatureUrl?: string;
  issuerSwiftCode?: string;
  issuerIban?: string;
  issuerCardNumber?: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientAddress?: string;
  clientCountry?: string;
  clientPhone?: string;
  items: InvoiceItem[];
  amount: number;
  currency?: string;
  notes?: string;
  description?: string;
  dueDate: string;
  isPaid?: boolean;
  paidAt?: string;
  paymentMethod?: string;
  reminderEnabled?: boolean;
  reminderIntervalDays?: number;
  reminderHour?: number;
  reminderMinute?: number;
  lastReminderAt?: string;
  createdBy: string;
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}
