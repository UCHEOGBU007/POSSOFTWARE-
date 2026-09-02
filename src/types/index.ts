// export type MerchantTier = "basic" | "standard" | "premium";
// export type SubscriptionStatus = "active" | "expired" | "trial";
// export type PaymentMethod = "cash" | "card" | "transfer" | "pos" | "wallet";
// export type SaleStatus = "completed" | "refunded" | "void";
// export type StaffRole = "manager" | "cashier";
// export type StockMovementType = "in" | "out" | "adjust" | "sale" | "return";
// export type SyncStatus = "pending" | "synced";

// export interface Merchant {
//   id: string;
//   businessName: string;
//   ownerName: string;
//   email: string;
//   phone: string;
//   passwordHash: string;
//   tier: MerchantTier;
//   subscriptionStatus: SubscriptionStatus;
//   subscriptionExpiry: string;
//   address?: string;
//   logo?: string;
//   currency: string;
//   taxRate: number;
//   createdAt: string;
//   updatedAt: string;
//   syncStatus: SyncStatus;
// }

// export interface Outlet {
//   id: string;
//   merchantId: string;
//   outletCode?: string;
//   name: string;
//   address: string;
//   phone?: string;
//   currency?: string;
//   pin: string;
//   isActive: boolean;
//   taxEnabled: boolean;
//   receiptFooter?: string;
//   createdAt: string;
//   updatedAt: string;
//   syncStatus: SyncStatus;
// }

// export interface Category {
//   id: string;
//   outletId: string;
//   name: string;
//   color?: string;
//   createdAt: string;
//   syncStatus: SyncStatus;
// }

// export interface Product {
//   id: string;
//   outletId: string;
//   categoryId?: string;
//   name: string;
//   sku: string;
//   barcode?: string;
//   description?: string;
//   price: number;
//   costPrice: number;
//   stock: number;
//   lowStockAlert: number;
//   unit: string;
//   image?: string;
//   isActive: boolean;
//   trackStock: boolean;
//   createdAt: string;
//   updatedAt: string;
//   syncStatus: SyncStatus;
// }

// export interface SaleItem {
//   productId: string;
//   productName: string;
//   sku: string;
//   qty: number;
//   unitPrice: number;
//   discount: number;
//   total: number;
// }

// export interface Sale {
//   id: string;
//   outletId: string;
//   receiptNumber: string;
//   items: SaleItem[];
//   subtotal: number;
//   taxAmount: number;
//   discountAmount: number;
//   total: number;
//   amountPaid: number;
//   change: number;
//   paymentMethod: PaymentMethod;
//   status: SaleStatus;
//   customerId?: string;
//   customerName?: string;
//   staffId?: string;
//   staffName?: string;
//   note?: string;
//   createdAt: string;
//   syncStatus: SyncStatus;
// }

// export interface Customer {
//   id: string;
//   outletId: string;
//   name: string;
//   phone: string;
//   email?: string;
//   address?: string;
//   loyaltyPoints: number;
//   totalSpent: number;
//   visitCount: number;
//   createdAt: string;
//   updatedAt: string;
//   syncStatus: SyncStatus;
// }

// export interface Staff {
//   id: string;
//   outletId: string;
//   name: string;
//   email: string;
//   phone?: string;
//   pin?: string;
//   role: StaffRole;
//   isActive: boolean;
//   createdAt: string;
//   updatedAt: string;
//   syncStatus: SyncStatus;
// }

// export interface Expense {
//   id: string;
//   outletId: string;
//   category: string;
//   amount: number;
//   description: string;
//   date: string;
//   staffId?: string;
//   createdAt: string;
//   syncStatus: SyncStatus;
// }

// export interface StockMovement {
//   id: string;
//   outletId: string;
//   productId: string;
//   productName: string;
//   type: StockMovementType;
//   qty: number;
//   prevStock: number;
//   newStock: number;
//   note?: string;
//   saleId?: string;
//   createdAt: string;
//   syncStatus: SyncStatus;
// }

// export const TIER_LIMITS: Record<
//   MerchantTier,
//   { maxOutlets: number; price: number; name: string }
// > = {
//   basic: { maxOutlets: 1, price: 200000, name: "Basic" },
//   standard: { maxOutlets: 5, price: 230000, name: "Standard" },
//   premium: { maxOutlets: 50, price: 300000, name: "Premium" },
// };

// export interface CartItem extends SaleItem {}

// export interface DashboardStats {
//   todaySales: number;
//   todayRevenue: number;
//   totalProducts: number;
//   lowStockCount: number;
//   totalCustomers: number;
//   monthlyRevenue: number;
// }

export type MerchantTier = "basic" | "standard" | "premium";
export type SubscriptionStatus = "active" | "expired" | "trial";
export type MerchantApprovalStatus = "pending" | "approved" | "rejected";
export type PaymentMethod = "cash" | "transfer" | "card" | "qris";
export type SaleStatus = "completed" | "refunded" | "void";
export type StaffRole = "manager" | "cashier";
export type StockMovementType = "in" | "out" | "adjust" | "sale" | "return";
export type AuditAction =
  | "product_added"
  | "product_edited"
  | "product_deleted"
  | "sale_refunded";
export type SyncStatus = "pending" | "synced";
export type BillingCycle = "monthly" | "yearly";

export interface Merchant {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  passwordHash: string;
  tier: MerchantTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiry: string;
  approvalStatus: MerchantApprovalStatus;
  requestedTier?: MerchantTier;
  billingCycle?: BillingCycle;
  approvedAt?: string;
  deletionScheduledAt?: string;
  address?: string;
  logo?: string;
  currency: string;
  taxRate: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface Outlet {
  id: string;
  merchantId: string;
  outletCode?: string;
  name: string;
  address: string;
  phone?: string;
  logo?: string;
  currency?: string;
  taxRate?: number;
  pin: string;
  isActive: boolean;
  taxEnabled: boolean;
  receiptFooter?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface Category {
  id: string;
  outletId: string;
  name: string;
  color?: string;
  createdAt: string;
  syncStatus: SyncStatus;
}

export interface Product {
  id: string;
  outletId: string;
  categoryId?: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  price: number;
  costPrice: number;
  stock: number;
  lowStockAlert: number;
  unit: string;
  image?: string;
  isActive: boolean;
  trackStock: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface AuditLog {
  id: string;
  outletId: string;
  action: AuditAction;
  actorId?: string;
  actorName: string;
  actorRole?: string;
  productId?: string;
  productName?: string;
  saleId?: string;
  receiptNumber?: string;
  details?: string;
  createdAt: string;
  syncStatus: SyncStatus;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  qty: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  outletId: string;
  receiptNumber: string;
  items: SaleItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  customerId?: string;
  customerName?: string;
  staffId?: string;
  staffName?: string;
  note?: string;
  createdAt: string;
  syncStatus: SyncStatus;
}

export interface Customer {
  id: string;
  outletId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  loyaltyPoints: number;
  totalSpent: number;
  visitCount: number;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface Staff {
  id: string;
  outletId: string;
  name: string;
  email: string;
  phone?: string;
  pin?: string;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface Expense {
  id: string;
  outletId: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  staffId?: string;
  createdAt: string;
  syncStatus: SyncStatus;
}

export interface StockMovement {
  id: string;
  outletId: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  qty: number;
  prevStock: number;
  newStock: number;
  note?: string;
  saleId?: string;
  createdAt: string;
  syncStatus: SyncStatus;
}

export const TIER_LIMITS: Record<
  MerchantTier,
  { maxOutlets: number; price: number; yearlyPrice: number; name: string }
> = {
  basic: { maxOutlets: 1, price: 200000, yearlyPrice: 2220000, name: "Basic" },
  standard: {
    maxOutlets: 5,
    price: 230000,
    yearlyPrice: 2553000,
    name: "Standard",
  },
  premium: {
    maxOutlets: 50,
    price: 300000,
    yearlyPrice: 3330000,
    name: "Premium",
  },
};

export interface CartItem extends SaleItem {}

export interface DashboardStats {
  todaySales: number;
  todayRevenue: number;
  totalProducts: number;
  lowStockCount: number;
  totalCustomers: number;
  monthlyRevenue: number;
}
