// import { db } from "../db/database";
// import { getSupabaseConfigStatus, supabase } from "./supabase";
// import type {
//   Merchant,
//   Outlet,
//   Category,
//   Product,
//   Sale,
//   Customer,
//   Staff,
//   Expense,
//   StockMovement,
// } from "../types";

// export type SyncTable =
//   | "merchants"
//   | "outlets"
//   | "categories"
//   | "products"
//   | "sales"
//   | "customers"
//   | "staff"
//   | "expenses"
//   | "stockMovements";

// export type SyncableRecord =
//   | Merchant
//   | Outlet
//   | Category
//   | Product
//   | Sale
//   | Customer
//   | Staff
//   | Expense
//   | StockMovement;

// const SUPABASE_TABLE_MAP: Record<SyncTable, string> = {
//   merchants: "merchants",
//   outlets: "outlets",
//   categories: "categories",
//   products: "products",
//   sales: "sales",
//   customers: "customers",
//   staff: "staff",
//   expenses: "expenses",
//   stockMovements: "stock_movements",
// };

// const FIELD_MAP: Record<SyncTable, Record<string, string>> = {
//   merchants: {
//     businessName: "business_name",
//     ownerName: "owner_name",
//     passwordHash: "password_hash",
//     subscriptionStatus: "subscription_status",
//     subscriptionExpiry: "subscription_expiry",
//     taxRate: "tax_rate",
//     createdAt: "created_at",
//     updatedAt: "updated_at",
//   },
//   outlets: {
//     merchantId: "merchant_id",
//     taxEnabled: "tax_enabled",
//     receiptFooter: "receipt_footer",
//     createdAt: "created_at",
//     updatedAt: "updated_at",
//   },
//   categories: {
//     outletId: "outlet_id",
//     createdAt: "created_at",
//   },
//   products: {
//     outletId: "outlet_id",
//     categoryId: "category_id",
//     costPrice: "cost_price",
//     lowStockAlert: "low_stock_alert",
//     trackStock: "track_stock",
//     createdAt: "created_at",
//     updatedAt: "updated_at",
//   },
//   sales: {
//     outletId: "outlet_id",
//     receiptNumber: "receipt_number",
//     taxAmount: "tax_amount",
//     discountAmount: "discount_amount",
//     amountPaid: "amount_paid",
//     customerId: "customer_id",
//     customerName: "customer_name",
//     staffId: "staff_id",
//     staffName: "staff_name",
//     createdAt: "created_at",
//   },
//   customers: {
//     outletId: "outlet_id",
//     loyaltyPoints: "loyalty_points",
//     totalSpent: "total_spent",
//     visitCount: "visit_count",
//     createdAt: "created_at",
//     updatedAt: "updated_at",
//   },
//   staff: {
//     outletId: "outlet_id",
//     createdAt: "created_at",
//   },
//   expenses: {
//     outletId: "outlet_id",
//     staffId: "staff_id",
//     createdAt: "created_at",
//   },
//   stockMovements: {
//     outletId: "outlet_id",
//     productId: "product_id",
//     productName: "product_name",
//     prevStock: "prev_stock",
//     newStock: "new_stock",
//     saleId: "sale_id",
//     createdAt: "created_at",
//   },
// };

// function getSupabaseTableName(table: SyncTable) {
//   return SUPABASE_TABLE_MAP[table] ?? table;
// }

// function toSupabasePayload(table: SyncTable, record: SyncableRecord) {
//   const payload: Record<string, unknown> = {};
//   for (const [key, value] of Object.entries(record)) {
//     if (value === undefined || key === "syncStatus") continue;
//     const mappedKey = FIELD_MAP[table][key] ?? key;
//     payload[mappedKey] = value;
//   }
//   return payload;
// }

// export async function syncRecord(
//   table: SyncTable,
//   recordOrId: SyncableRecord | { id: string } | string,
//   operation: "upsert" | "delete" = "upsert",
// ) {
//   const { isConfigured } = getSupabaseConfigStatus();
//   if (!isConfigured) return { ok: false, skipped: true };

//   const id = typeof recordOrId === "string" ? recordOrId : recordOrId.id;
//   if (!id) return { ok: false, skipped: true };

//   try {
//     const supabaseTable = getSupabaseTableName(table);
//     if (operation === "delete") {
//       const { error } = await supabase
//         .from(supabaseTable)
//         .delete()
//         .eq("id", id);
//       if (error) throw error;
//       return { ok: true, deleted: true };
//     }

//     if (typeof recordOrId === "string") {
//       return { ok: false, skipped: true };
//     }

//     const payload = toSupabasePayload(table, recordOrId as SyncableRecord);
//     const { error } = await supabase
//       .from(supabaseTable)
//       .upsert([payload], { onConflict: "id" });
//     if (error) throw error;

//     await (db as Record<string, any>)[table].update(id, {
//       syncStatus: "synced",
//     });
//     return { ok: true, synced: true };
//   } catch (error) {
//     console.warn(`Supabase sync failed for ${table}`, error);
//     return { ok: false, error };
//   }
// }

// export async function syncPendingData() {
//   const { isConfigured } = getSupabaseConfigStatus();
//   if (!isConfigured) return;

//   const tables: Array<{ table: SyncTable; field: string }> = [
//     { table: "merchants", field: "syncStatus" },
//     { table: "outlets", field: "syncStatus" },
//     { table: "categories", field: "syncStatus" },
//     { table: "products", field: "syncStatus" },
//     { table: "sales", field: "syncStatus" },
//     { table: "customers", field: "syncStatus" },
//     { table: "staff", field: "syncStatus" },
//     { table: "expenses", field: "syncStatus" },
//     { table: "stockMovements", field: "syncStatus" },
//   ];

//   for (const entry of tables) {
//     const records = await (db as Record<string, any>)[entry.table]
//       .where(entry.field)
//       .equals("pending")
//       .toArray();

//     for (const record of records) {
//       await syncRecord(entry.table, record, "upsert");
//     }
//   }
// }

// import { db } from "../db/database";
// import { getSupabaseConfigStatus, supabase } from "./supabase";
// import type {
//   Merchant,
//   Outlet,
//   Category,
//   Product,
//   Sale,
//   Customer,
//   Staff,
//   Expense,
//   StockMovement,
// } from "../types";

// export type SyncTable =
//   | "merchants"
//   | "outlets"
//   | "categories"
//   | "products"
//   | "sales"
//   | "customers"
//   | "staff"
//   | "expenses"
//   | "stockMovements";

// export type SyncableRecord =
//   | Merchant
//   | Outlet
//   | Category
//   | Product
//   | Sale
//   | Customer
//   | Staff
//   | Expense
//   | StockMovement;

// const SUPABASE_TABLE_MAP: Record<SyncTable, string> = {
//   merchants: "merchants",
//   outlets: "outlets",
//   categories: "categories",
//   products: "products",
//   sales: "sales",
//   customers: "customers",
//   staff: "staff",
//   expenses: "expenses",
//   stockMovements: "stock_movements",
// };

// const FIELD_MAP: Record<SyncTable, Record<string, string>> = {
//   merchants: {
//     businessName: "business_name",
//     ownerName: "owner_name",
//     passwordHash: "password_hash",
//     subscriptionStatus: "subscription_status",
//     subscriptionExpiry: "subscription_expiry",
//     taxRate: "tax_rate",
//     createdAt: "created_at",
//     updatedAt: "updated_at",
//   },
//   outlets: {
//     merchantId: "merchant_id",
//     isActive: "is_active",
//     taxEnabled: "tax_enabled",
//     receiptFooter: "receipt_footer",
//     createdAt: "created_at",
//     updatedAt: "updated_at",
//   },
//   categories: {
//     outletId: "outlet_id",
//     createdAt: "created_at",
//   },
//   products: {
//     outletId: "outlet_id",
//     categoryId: "category_id",
//     costPrice: "cost_price",
//     lowStockAlert: "low_stock_alert",
//     trackStock: "track_stock",
//     isActive: "is_active",
//     createdAt: "created_at",
//     updatedAt: "updated_at",
//   },
//   sales: {
//     outletId: "outlet_id",
//     receiptNumber: "receipt_number",
//     taxAmount: "tax_amount",
//     discountAmount: "discount_amount",
//     amountPaid: "amount_paid",
//     customerId: "customer_id",
//     customerName: "customer_name",
//     staffId: "staff_id",
//     staffName: "staff_name",
//     createdAt: "created_at",
//   },
//   customers: {
//     outletId: "outlet_id",
//     loyaltyPoints: "loyalty_points",
//     totalSpent: "total_spent",
//     visitCount: "visit_count",
//     createdAt: "created_at",
//     updatedAt: "updated_at",
//   },
//   staff: {
//     outletId: "outlet_id",
//     email: "email",
//     isActive: "is_active",
//     createdAt: "created_at",
//   },
//   expenses: {
//     outletId: "outlet_id",
//     staffId: "staff_id",
//     createdAt: "created_at",
//   },
//   stockMovements: {
//     outletId: "outlet_id",
//     productId: "product_id",
//     productName: "product_name",
//     prevStock: "prev_stock",
//     newStock: "new_stock",
//     saleId: "sale_id",
//     createdAt: "created_at",
//   },
// };

// function getSupabaseTableName(table: SyncTable) {
//   return SUPABASE_TABLE_MAP[table] ?? table;
// }

// function toSupabasePayload(table: SyncTable, record: SyncableRecord) {
//   const payload: Record<string, unknown> = {};
//   for (const [key, value] of Object.entries(record)) {
//     if (value === undefined || key === "syncStatus") continue;
//     const mappedKey = FIELD_MAP[table][key] ?? key;
//     payload[mappedKey] = value;
//   }
//   return payload;
// }

// export async function syncRecord(
//   table: SyncTable,
//   recordOrId: SyncableRecord | { id: string } | string,
//   operation: "upsert" | "delete" = "upsert",
// ) {
//   const { isConfigured } = getSupabaseConfigStatus();
//   if (!isConfigured) return { ok: false, skipped: true };

//   const id = typeof recordOrId === "string" ? recordOrId : recordOrId.id;
//   if (!id) return { ok: false, skipped: true };

//   try {
//     const supabaseTable = getSupabaseTableName(table);
//     if (operation === "delete") {
//       const { error } = await supabase
//         .from(supabaseTable)
//         .delete()
//         .eq("id", id);
//       if (error) throw error;
//       return { ok: true, deleted: true };
//     }

//     if (typeof recordOrId === "string") {
//       return { ok: false, skipped: true };
//     }

//     const payload = toSupabasePayload(table, recordOrId as SyncableRecord);
//     const { error } = await supabase
//       .from(supabaseTable)
//       .upsert([payload], { onConflict: "id" });
//     if (error) throw error;

//     await (db as Record<string, any>)[table].update(id, {
//       syncStatus: "synced",
//     });
//     return { ok: true, synced: true };
//   } catch (error) {
//     console.warn(`Supabase sync failed for ${table}`, error);
//     return { ok: false, error };
//   }
// }

// export async function syncPendingData() {
//   const { isConfigured } = getSupabaseConfigStatus();
//   if (!isConfigured) return;

//   const tables: Array<{ table: SyncTable; field: string }> = [
//     { table: "merchants", field: "syncStatus" },
//     { table: "outlets", field: "syncStatus" },
//     { table: "categories", field: "syncStatus" },
//     { table: "products", field: "syncStatus" },
//     { table: "sales", field: "syncStatus" },
//     { table: "customers", field: "syncStatus" },
//     { table: "staff", field: "syncStatus" },
//     { table: "expenses", field: "syncStatus" },
//     { table: "stockMovements", field: "syncStatus" },
//   ];

//   for (const entry of tables) {
//     const records = await (db as Record<string, any>)[entry.table]
//       .where(entry.field)
//       .equals("pending")
//       .toArray();

//     for (const record of records) {
//       await syncRecord(entry.table, record, "upsert");
//     }
//   }
// }

import { db } from "../db/database";
import { getSupabaseConfigStatus, supabase } from "./supabase";
import type {
  Merchant,
  Outlet,
  Category,
  Product,
  Sale,
  Customer,
  Staff,
  Expense,
  StockMovement,
} from "../types";

export type SyncTable =
  | "merchants"
  | "outlets"
  | "categories"
  | "products"
  | "sales"
  | "customers"
  | "staff"
  | "expenses"
  | "stockMovements";

export type SyncableRecord =
  | Merchant
  | Outlet
  | Category
  | Product
  | Sale
  | Customer
  | Staff
  | Expense
  | StockMovement;

const SUPABASE_TABLE_MAP: Record<SyncTable, string> = {
  merchants: "merchants",
  outlets: "outlets",
  categories: "categories",
  products: "products",
  sales: "sales",
  customers: "customers",
  staff: "staff",
  expenses: "expenses",
  stockMovements: "stock_movements",
};

const FIELD_MAP: Record<SyncTable, Record<string, string>> = {
  merchants: {
    businessName: "business_name",
    ownerName: "owner_name",
    passwordHash: "password_hash",
    subscriptionStatus: "subscription_status",
    subscriptionExpiry: "subscription_expiry",
    taxRate: "tax_rate",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  outlets: {
    merchantId: "merchant_id",
    outletCode: "outlet_code",
    isActive: "is_active",
    taxEnabled: "tax_enabled",
    receiptFooter: "receipt_footer",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  categories: {
    outletId: "outlet_id",
    createdAt: "created_at",
  },
  products: {
    outletId: "outlet_id",
    categoryId: "category_id",
    costPrice: "cost_price",
    lowStockAlert: "low_stock_alert",
    trackStock: "track_stock",
    isActive: "is_active",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  sales: {
    outletId: "outlet_id",
    receiptNumber: "receipt_number",
    taxAmount: "tax_amount",
    discountAmount: "discount_amount",
    amountPaid: "amount_paid",
    customerId: "customer_id",
    customerName: "customer_name",
    staffId: "staff_id",
    staffName: "staff_name",
    createdAt: "created_at",
  },
  customers: {
    outletId: "outlet_id",
    loyaltyPoints: "loyalty_points",
    totalSpent: "total_spent",
    visitCount: "visit_count",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  staff: {
    outletId: "outlet_id",
    name: "name",
    email: "email",
    phone: "phone",
    pin: "pin",
    role: "role",
    isActive: "is_active",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
  expenses: {
    outletId: "outlet_id",
    staffId: "staff_id",
    createdAt: "created_at",
  },
  stockMovements: {
    outletId: "outlet_id",
    productId: "product_id",
    productName: "product_name",
    prevStock: "prev_stock",
    newStock: "new_stock",
    saleId: "sale_id",
    createdAt: "created_at",
  },
};

function getSupabaseTableName(table: SyncTable) {
  return SUPABASE_TABLE_MAP[table] ?? table;
}

function toSupabasePayload(table: SyncTable, record: SyncableRecord) {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || key === "syncStatus") continue;
    const mappedKey = FIELD_MAP[table]?.[key] ?? key;
    payload[mappedKey] = value;
  }
  return payload;
}

export async function syncRecord(
  table: SyncTable,
  recordOrId: SyncableRecord | { id: string } | string,
  operation: "upsert" | "delete" = "upsert",
) {
  const { isConfigured } = getSupabaseConfigStatus();
  if (!isConfigured) return { ok: false, skipped: true };

  const id = typeof recordOrId === "string" ? recordOrId : recordOrId.id;
  if (!id) return { ok: false, skipped: true };

  try {
    const supabaseTable = getSupabaseTableName(table);
    if (operation === "delete") {
      const { error } = await supabase
        .from(supabaseTable)
        .delete()
        .eq("id", id);
      if (error) throw error;
      return { ok: true, deleted: true };
    }

    if (typeof recordOrId === "string") {
      return { ok: false, skipped: true };
    }

    const payload = toSupabasePayload(table, recordOrId as SyncableRecord);
    const { error } = await supabase
      .from(supabaseTable)
      .upsert([payload], { onConflict: "id" });

    if (error) throw error;

    // Safely update Dexie table status if table exists on local db
    const dexieTable = (db as Record<string, any>)[table];
    if (dexieTable && typeof dexieTable.update === "function") {
      await dexieTable.update(id, { syncStatus: "synced" });
    }

    return { ok: true, synced: true };
  } catch (error) {
    console.warn(`Supabase sync failed for ${table}:`, error);
    return { ok: false, error };
  }
}

export async function syncPendingData() {
  const { isConfigured } = getSupabaseConfigStatus();
  if (!isConfigured) return;

  const tables: Array<{ table: SyncTable; field: string }> = [
    { table: "merchants", field: "syncStatus" },
    { table: "outlets", field: "syncStatus" },
    { table: "categories", field: "syncStatus" },
    { table: "products", field: "syncStatus" },
    { table: "sales", field: "syncStatus" },
    { table: "customers", field: "syncStatus" },
    { table: "staff", field: "syncStatus" },
    { table: "expenses", field: "syncStatus" },
    { table: "stockMovements", field: "syncStatus" },
  ];

  for (const entry of tables) {
    const dexieTable = (db as Record<string, any>)[entry.table];
    if (!dexieTable) continue;

    try {
      const records = await dexieTable
        .where(entry.field)
        .equals("pending")
        .toArray();

      for (const record of records) {
        await syncRecord(entry.table, record, "upsert");
      }
    } catch (err) {
      console.warn(`Failed to process pending sync for ${entry.table}:`, err);
    }
  }
}
