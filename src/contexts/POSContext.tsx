import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type {
  CartItem,
  Product,
  PaymentMethod,
  Sale,
  Customer,
  StockMovement,
} from "../types";
import { db } from "../db/database";
import { syncRecord } from "../lib/sync";
import { generateId, generateReceiptNumber } from "../utils/helpers";

interface POSContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  updateItemDiscount: (productId: string, discount: number) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;
  cartDiscount: number;
  globalDiscount: number;
  setGlobalDiscount: (d: number) => void;
  taxRate: number;
  setTaxRate: (r: number) => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (c: Customer | null) => void;
  completeSale: (
    outletId: string,
    paymentMethod: PaymentMethod,
    amountPaid: number,
    staffId?: string,
    staffName?: string,
    note?: string,
  ) => Promise<Sale>;
  lastSale: Sale | null;
  clearLastSale: () => void;
}

const POSContext = createContext<POSContextType | null>(null);

export function POSProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(7.5);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? {
                ...i,
                qty: i.qty + 1,
                total: (i.qty + 1) * i.unitPrice * (1 - i.discount / 100),
              }
            : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          qty: 1,
          unitPrice: product.price,
          discount: 0,
          total: product.price,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, qty, total: qty * i.unitPrice * (1 - i.discount / 100) }
          : i,
      ),
    );
  }, []);

  const updateItemDiscount = useCallback(
    (productId: string, discount: number) => {
      setCart((prev) =>
        prev.map((i) =>
          i.productId === productId
            ? {
                ...i,
                discount,
                total: i.qty * i.unitPrice * (1 - discount / 100),
              }
            : i,
        ),
      );
    },
    [],
  );

  const clearCart = useCallback(() => {
    setCart([]);
    setGlobalDiscount(0);
    setSelectedCustomer(null);
  }, []);

  const cartSubtotal = cart.reduce((sum, i) => sum + i.total, 0);
  const itemDiscountTotal = cart.reduce(
    (sum, i) => sum + i.qty * i.unitPrice * (i.discount / 100),
    0,
  );
  const afterItemDiscount = cartSubtotal;
  const globalDiscountAmount = afterItemDiscount * (globalDiscount / 100);
  const taxableAmount = afterItemDiscount - globalDiscountAmount;
  const cartTax = taxableAmount * (taxRate / 100);
  const cartTotal = taxableAmount + cartTax;
  const cartDiscount = itemDiscountTotal + globalDiscountAmount;

  const completeSale = async (
    outletId: string,
    paymentMethod: PaymentMethod,
    amountPaid: number,
    staffId?: string,
    staffName?: string,
    note?: string,
  ): Promise<Sale> => {
    const now = new Date().toISOString();
    const sale: Sale = {
      id: generateId(),
      outletId,
      receiptNumber: generateReceiptNumber(outletId),
      items: [...cart],
      subtotal: cartSubtotal,
      taxAmount: cartTax,
      discountAmount: cartDiscount,
      total: cartTotal,
      amountPaid,
      change: amountPaid - cartTotal,
      paymentMethod,
      status: "completed",
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      staffId,
      staffName,
      note,
      createdAt: now,
      syncStatus: "pending",
    };

    await db.transaction(
      "rw",
      db.sales,
      db.products,
      db.stockMovements,
      db.customers,
      async () => {
        await db.sales.add(sale);
        await syncRecord("sales", sale);

        for (const item of cart) {
          const product = await db.products.get(item.productId);
          if (product && product.trackStock) {
            const newStock = product.stock - item.qty;
            await db.products.update(item.productId, {
              stock: newStock,
              updatedAt: now,
              syncStatus: "pending",
            });
            const updatedProduct = await db.products.get(item.productId);
            if (updatedProduct) {
              await syncRecord("products", updatedProduct);
            }
            const stockMovement: StockMovement = {
              id: generateId(),
              outletId,
              productId: item.productId,
              productName: item.productName,
              type: "sale",
              qty: -item.qty,
              prevStock: product.stock,
              newStock,
              saleId: sale.id,
              createdAt: now,
              syncStatus: "pending",
            };
            await db.stockMovements.add(stockMovement);
            await syncRecord("stockMovements", stockMovement);
          }
        }

        if (selectedCustomer) {
          await db.customers.update(selectedCustomer.id, {
            loyaltyPoints:
              selectedCustomer.loyaltyPoints + Math.floor(cartTotal / 100),
            totalSpent: selectedCustomer.totalSpent + cartTotal,
            visitCount: selectedCustomer.visitCount + 1,
            updatedAt: now,
            syncStatus: "pending",
          });
          const updatedCustomer = await db.customers.get(selectedCustomer.id);
          if (updatedCustomer) {
            await syncRecord("customers", updatedCustomer);
          }
        }
      },
    );

    setLastSale(sale);
    clearCart();
    return sale;
  };

  const clearLastSale = () => setLastSale(null);

  return (
    <POSContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQty,
        updateItemDiscount,
        clearCart,
        cartSubtotal,
        cartTax,
        cartTotal,
        cartDiscount,
        globalDiscount,
        setGlobalDiscount,
        taxRate,
        setTaxRate,
        selectedCustomer,
        setSelectedCustomer,
        completeSale,
        lastSale,
        clearLastSale,
      }}
    >
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error("usePOS must be used within POSProvider");
  return ctx;
}
