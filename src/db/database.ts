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
//     super("NaijaPosPro");

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

  constructor() {
    super("NaijaPosPro");

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
  }

  async deleteSyncedData(outletId: string) {
    await Promise.all([
      this.sales.where({ outletId, syncStatus: "synced" }).delete(),
      this.stockMovements.where({ outletId, syncStatus: "synced" }).delete(),
      this.expenses.where({ outletId, syncStatus: "synced" }).delete(),
    ]);
  }
}

export const db = new POSDatabase();
