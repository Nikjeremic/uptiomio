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
  // New payment instruction fields
  bankName?: string;
  // Correspondent banks (up to 5)
  correspondentBank1?: string;
  correspondentBank2?: string;
  correspondentBank3?: string;
  correspondentBank4?: string;
  correspondentBank5?: string;
  correspondentCountry1?: string;
  correspondentCountry2?: string;
  correspondentCountry3?: string;
  correspondentCountry4?: string;
  correspondentCountry5?: string;
  correspondentSwift1?: string;
  correspondentSwift2?: string;
  correspondentSwift3?: string;
  correspondentSwift4?: string;
  correspondentSwift5?: string;
  paymentInstructions?: string;
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
  issuerZipCode?: string;
  issuerPhone?: string;
  issuerLogoUrl?: string;
  issuerSignatureUrl?: string;
  issuerSwiftCode?: string;
  issuerIban?: string;
  issuerCardNumber?: string;
  // New payment instruction fields
  issuerBankName?: string;
  // Correspondent banks (up to 5)
  issuerCorrespondentBank1?: string;
  issuerCorrespondentBank2?: string;
  issuerCorrespondentBank3?: string;
  issuerCorrespondentBank4?: string;
  issuerCorrespondentBank5?: string;
  issuerCorrespondentCountry1?: string;
  issuerCorrespondentCountry2?: string;
  issuerCorrespondentCountry3?: string;
  issuerCorrespondentCountry4?: string;
  issuerCorrespondentCountry5?: string;
  issuerCorrespondentSwift1?: string;
  issuerCorrespondentSwift2?: string;
  issuerCorrespondentSwift3?: string;
  issuerCorrespondentSwift4?: string;
  issuerCorrespondentSwift5?: string;
  issuerPaymentInstructions?: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  clientAddress?: string;
  clientCountry?: string;
  clientZipCode?: string;
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
