// import Dexie, { type Table } from "dexie";
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

// export class POSDatabase extends Dexie {
//   merchants!: Table<Merchant>;
//   outlets!: Table<Outlet>;
//   categories!: Table<Category>;
//   products!: Table<Product>;
//   sales!: Table<Sale>;
//   customers!: Table<Customer>;
//   staff!: Table<Staff>;
//   expenses!: Table<Expense>;
//   stockMovements!: Table<StockMovement>;

//   constructor() {
//     super("STOCKURA Pro");

//     this.version(1).stores({
//       merchants: "id, email, syncStatus",
//       outlets: "id, merchantId, isActive, syncStatus",
//       categories: "id, outletId, syncStatus",
//       products: "id, outletId, categoryId, sku, isActive, syncStatus",
//       sales: "id, outletId, receiptNumber, status, createdAt, syncStatus",
//       customers: "id, outletId, phone, syncStatus",
//       staff: "id, outletId, pin, isActive, syncStatus",
//       expenses: "id, outletId, date, syncStatus",
//       stockMovements: "id, outletId, productId, createdAt, syncStatus",
//     });
//   }

//   async deleteSyncedData(outletId: string) {
//     await Promise.all([
//       this.sales.where({ outletId, syncStatus: "synced" }).delete(),
//       this.stockMovements.where({ outletId, syncStatus: "synced" }).delete(),
//       this.expenses.where({ outletId, syncStatus: "synced" }).delete(),
//     ]);
//   }
// }

// export const db = new POSDatabase();

import Dexie, { type Table } from "dexie";
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
  AuditLog,
} from "../types";

export class POSDatabase extends Dexie {
  merchants!: Table<Merchant>;
  outlets!: Table<Outlet>;
  categories!: Table<Category>;
  products!: Table<Product>;
  sales!: Table<Sale>;
  customers!: Table<Customer>;
  staff!: Table<Staff>;
  expenses!: Table<Expense>;
  stockMovements!: Table<StockMovement>;
  auditLogs!: Table<AuditLog>;

  constructor() {
    super("STOCKURA Pro");

    // Version 1 (Legacy schema)
    this.version(1).stores({
      merchants: "id, email, syncStatus",
      outlets: "id, merchantId, outletCode, isActive, syncStatus",
      categories: "id, outletId, syncStatus",
      products: "id, outletId, categoryId, sku, isActive, syncStatus",
      sales: "id, outletId, receiptNumber, status, createdAt, syncStatus",
      customers: "id, outletId, phone, syncStatus",
      staff: "id, outletId, pin, isActive, syncStatus",
      expenses: "id, outletId, date, syncStatus",
      stockMovements: "id, outletId, productId, createdAt, syncStatus",
    });

    // Version 2 (Adds 'email' index to staff table to allow IndexedDB lookups by email)
    this.version(2).stores({
      staff: "id, outletId, email, pin, isActive, syncStatus",
    });

    this.version(3).stores({
      auditLogs: "id, outletId, action, createdAt, syncStatus",
    });

    // Version 4 removes the legacy credential index and clears any remnants
    // that may have been written by earlier versions of the app.
    this.version(4)
      .stores({
        staff: "id, outletId, email, isActive, syncStatus",
      })
      .upgrade(async (transaction) => {
        await transaction
          .table("staff")
          .toCollection()
          .modify((staff: Record<string, unknown>) => {
            delete staff.pin;
          });
        await transaction
          .table("merchants")
          .toCollection()
          .modify((merchant: Record<string, unknown>) => {
            delete merchant.passwordHash;
          });
        await transaction
          .table("outlets")
          .toCollection()
          .modify((outlet: Record<string, unknown>) => {
            delete outlet.pin;
          });
      });
  }

  async deleteSyncedData(outletId: string) {
    await Promise.all([
      this.sales.where({ outletId, syncStatus: "synced" }).delete(),
      this.stockMovements.where({ outletId, syncStatus: "synced" }).delete(),
      this.expenses.where({ outletId, syncStatus: "synced" }).delete(),
    ]);
  }

  /** Remove all offline business data when a user explicitly signs out. */
  async clearCachedData() {
    await this.transaction(
      "rw",
      [
        this.merchants,
        this.outlets,
        this.categories,
        this.products,
        this.sales,
        this.customers,
        this.staff,
        this.expenses,
        this.stockMovements,
        this.auditLogs,
      ],
      async () => {
        await Promise.all([
          this.merchants.clear(),
          this.outlets.clear(),
          this.categories.clear(),
          this.products.clear(),
          this.sales.clear(),
          this.customers.clear(),
          this.staff.clear(),
          this.expenses.clear(),
          this.stockMovements.clear(),
          this.auditLogs.clear(),
        ]);
      },
    );
  }
}

export const db = new POSDatabase();
