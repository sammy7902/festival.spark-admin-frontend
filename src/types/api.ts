/**
 * API Type Definitions
 * Generated from backend ANALYSIS.md
 */

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  _id: string;
  name: string;
  category: string | Category;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  _id: string;
  name: string;
  code?: string;
  subcategory: string | Subcategory;
  priceSmallestUnit: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BillItem {
  name: string;
  code?: string;
  priceSmallestUnit: number;
  quantity: number;
  totalSmallestUnit: number;
}

export interface Bill {
  _id: string;
  billNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  items: BillItem[];
  totalAmountSmallestUnit: number;
  discountSmallestUnit: number;
  finalTotalSmallestUnit: number;
  createdBy: string | User;
  pdfUrl?: string;
  pdfS3Key?: string;
  pdfFilename?: string;
  recipients: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EarningsSummary {
  bills: {
    docs: Bill[];
    totalDocs: number;
    limit: number;
    totalPages: number;
    page: number;
  };
  totalEarnings: {
    totalSmallestUnit: number;
    totalFormatted: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface CreateBillRequest {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  items: Array<{
    name: string;
    code?: string;
    price: number | string;
    quantity: number;
  }>;
  discount?: number | string;
}

export interface CreateBillResponse {
  bill: Bill;
  pdfLink: string;
  notifications: {
    pdf: { success: boolean; error?: string };
    sms: { success: boolean; error?: string };
    email: { success: boolean; error?: string };
    customerEmail?: { success: boolean; error?: string };
  };
  partialSuccess?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface EarningsFilters {
  from?: string; // ISO date string
  to?: string; // ISO date string
  page?: number;
  limit?: number;
}

