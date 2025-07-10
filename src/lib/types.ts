export interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  meter: number;
  total: number;
}

export type InvoiceState = 'أذن تسليم' | 'أذن مرتجع';
export type PaymentType = 'نقدي' | 'أجل';

export interface Invoice {
  id: string; // Firestore document ID
  invoiceNumber: number;
  date: string;
  customerName: string;
  state: InvoiceState;
  products: Product[];
  note: string;
  isCompleted: boolean;
  isTransfer: boolean;
  paymentType: PaymentType;
  discount: number;
  userId: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string;
  role: 'admin' | 'deploy';
}
