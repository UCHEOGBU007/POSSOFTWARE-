import { useEffect, useState } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Tag,
  User,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  X,
  Printer,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePOS } from "@/contexts/POSContext";
import { db } from "@/db/database";
import Button from "@/components/ui/Button.tsx";
import Modal from "@/components/ui/Modal.tsx";
import Badge from "@/components/ui/Badge.tsx";
import { useToast } from "@/components/ui/Toast.tsx";
import { formatCurrency, clsx } from "@/utils/helpers";
import type { Product, Category, Customer, PaymentMethod } from "@/types";

const paymentMethods: {
  key: PaymentMethod;
  label: string;
  icon: React.ReactNode;
}[] = [
  { key: "cash", label: "Cash", icon: <Banknote size={18} /> },
  { key: "card", label: "Card", icon: <CreditCard size={18} /> },
  { key: "transfer", label: "Transfer", icon: <Building2 size={18} /> },
  { key: "pos", label: "POS", icon: <Smartphone size={18} /> },
];

export default function POSTerminal() {
  const { outletSession } = useAuth();
  const outlet = outletSession!.outlet;
  const staff = outletSession!.staff;
  const { success, error: showError } = useToast();
  const pos = usePOS();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [prods, cats, custs] = await Promise.all([
        db.products
          .where("outletId")
          .equals(outlet.id)
          .filter((p) => p.isActive)
          .toArray(),
        db.categories.where("outletId").equals(outlet.id).toArray(),
        db.customers.where("outletId").equals(outlet.id).toArray(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setCustomers(custs);
    };
    load();
  }, [outlet.id]);

  useEffect(() => {
    pos.setTaxRate(outlet.taxEnabled ? 7.5 : 0);
  }, [outlet.taxEnabled]);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchCat = !activeCat || p.categoryId === activeCat;
    return matchSearch && matchCat;
  });

  const handleCheckout = async () => {
    if (pos.cart.length === 0) return;
    const paid =
      payMethod === "cash" ? parseFloat(amountPaid || "0") : pos.cartTotal;
    if (payMethod === "cash" && paid < pos.cartTotal) {
      showError("Amount paid is less than total.");
      return;
    }
    setProcessing(true);
    try {
      await pos.completeSale(
        outlet.id,
        payMethod,
        paid,
        staff?.id,
        staff?.name,
      );
      setShowPayModal(false);
      setShowReceiptModal(true);
      success("Sale completed!");
    } catch (err: any) {
      showError(err.message);
    } finally {
      setProcessing(false);
      setAmountPaid("");
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const q = customerSearch.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">
      {/* Product grid */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-4 pb-3 border-b border-pos-border bg-pos-bg sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-muted"
              />
              <input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-pos-input border border-pos-border rounded-lg pl-9 pr-3 py-2 text-sm text-pos-text placeholder:text-pos-muted/50 focus:outline-none focus:border-blue-500"
              />
            </div>
            {outlet.taxEnabled && (
              <Badge variant="info">VAT {pos.taxRate}%</Badge>
            )}
            {staff && (
              <div className="flex items-center gap-1.5 text-xs text-pos-muted bg-pos-card border border-pos-border px-2.5 py-1.5 rounded-lg">
                <User size={12} />
                {staff.name}
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCat("")}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                !activeCat
                  ? "bg-blue-600 text-white"
                  : "bg-pos-card text-pos-muted border border-pos-border hover:text-pos-text",
              )}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveCat(activeCat === c.id ? "" : c.id)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  activeCat === c.id
                    ? "bg-blue-600 text-white"
                    : "bg-pos-card text-pos-muted border border-pos-border hover:text-pos-text",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-pos-muted">
              <Search size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No products found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((p) => {
                const inCart = pos.cart.find((i) => i.productId === p.id);
                const outOfStock = p.trackStock && p.stock === 0;
                return (
                  <button
                    key={p.id}
                    disabled={outOfStock}
                    onClick={() => pos.addToCart(p)}
                    className={clsx(
                      "text-left p-3 rounded-xl border transition-all duration-150 group",
                      outOfStock
                        ? "border-pos-border bg-pos-card opacity-50 cursor-not-allowed"
                        : inCart
                          ? "border-blue-500 bg-blue-600/10 hover:bg-blue-600/15"
                          : "border-pos-border bg-pos-card hover:border-blue-500/50 hover:bg-pos-hover",
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-pos-bg flex items-center justify-center text-pos-muted group-hover:text-blue-400 transition-colors">
                        <ShoppingCart size={15} />
                      </div>
                      {inCart && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-md">
                          {inCart.qty}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-pos-text leading-tight mb-1">
                      {p.name}
                    </p>
                    <p className="text-xs text-pos-muted mb-2">{p.sku}</p>
                    <p className="text-sm font-bold text-blue-400">
                      {formatCurrency(p.price)}
                    </p>
                    {p.trackStock && (
                      <p
                        className={clsx(
                          "text-xs mt-1",
                          p.stock <= p.lowStockAlert
                            ? "text-amber-400"
                            : "text-pos-muted",
                        )}
                      >
                        {outOfStock ? "Out of stock" : `${p.stock} ${p.unit}`}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="w-80 shrink-0 flex flex-col bg-pos-sidebar border-l border-pos-border">
        <div className="px-4 py-4 border-b border-pos-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-blue-400" />
            <span className="font-semibold text-pos-text">Cart</span>
            {pos.cart.length > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pos.cart.length}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setShowCustomerModal(true)}
              className={clsx(
                "p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1",
                pos.selectedCustomer
                  ? "text-blue-400 bg-blue-500/10"
                  : "text-pos-muted hover:text-pos-text hover:bg-pos-hover",
              )}
              title="Select customer"
            >
              <User size={15} />
            </button>
            {pos.cart.length > 0 && (
              <button
                onClick={pos.clearCart}
                className="p-1.5 rounded-lg text-pos-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Clear cart"
              >
                <RotateCcw size={15} />
              </button>
            )}
          </div>
        </div>

        {pos.selectedCustomer && (
          <div className="mx-3 mt-3 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-400 text-xs">
              <User size={12} />
              <span>{pos.selectedCustomer.name}</span>
            </div>
            <button
              onClick={() => pos.setSelectedCustomer(null)}
              className="text-pos-muted hover:text-red-400 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-2">
          {pos.cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-pos-muted">
              <ShoppingCart size={36} className="mb-3 opacity-25" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Tap a product to add</p>
            </div>
          ) : (
            pos.cart.map((item) => (
              <div
                key={item.productId}
                className="px-3 py-2.5 flex items-start gap-2 hover:bg-pos-hover transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-pos-text truncate">
                    {item.productName}
                  </p>
                  <p className="text-xs text-pos-muted">
                    {formatCurrency(item.unitPrice)} × {item.qty}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => pos.updateQty(item.productId, item.qty - 1)}
                    className="w-6 h-6 rounded-md bg-pos-hover flex items-center justify-center text-pos-muted hover:text-pos-text transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-7 text-center text-sm font-medium text-pos-text">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => pos.updateQty(item.productId, item.qty + 1)}
                    className="w-6 h-6 rounded-md bg-pos-hover flex items-center justify-center text-pos-muted hover:text-pos-text transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    onClick={() => pos.removeFromCart(item.productId)}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-pos-muted hover:text-red-400 transition-colors ml-1"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
                <p className="text-sm font-semibold text-pos-text min-w-17.5 text-right">
                  {formatCurrency(item.total)}
                </p>
              </div>
            ))
          )}
        </div>

        {pos.cart.length > 0 && (
          <div className="border-t border-pos-border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-pos-muted" />
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Global discount %"
                value={pos.globalDiscount || ""}
                onChange={(e) =>
                  pos.setGlobalDiscount(parseFloat(e.target.value) || 0)
                }
                className="flex-1 bg-pos-input border border-pos-border rounded-lg px-2 py-1.5 text-xs text-pos-text focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-pos-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(pos.cartSubtotal)}</span>
              </div>
              {pos.cartDiscount > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Discount</span>
                  <span>-{formatCurrency(pos.cartDiscount)}</span>
                </div>
              )}
              {outlet.taxEnabled && (
                <div className="flex justify-between text-pos-muted">
                  <span>VAT ({pos.taxRate}%)</span>
                  <span>{formatCurrency(pos.cartTax)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-pos-text pt-1 border-t border-pos-border">
                <span>Total</span>
                <span className="text-blue-400">
                  {formatCurrency(pos.cartTotal)}
                </span>
              </div>
            </div>
            <Button
              className="w-full"
              size="lg"
              icon={<CreditCard size={18} />}
              onClick={() => setShowPayModal(true)}
            >
              Charge {formatCurrency(pos.cartTotal)}
            </Button>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal
        open={showPayModal}
        onClose={() => setShowPayModal(false)}
        title="Complete Payment"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPayModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCheckout}
              loading={processing}
              icon={<CreditCard size={16} />}
            >
              Confirm Sale
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-pos-bg rounded-xl p-4 text-center">
            <p className="text-xs text-pos-muted uppercase tracking-widest mb-1">
              Amount Due
            </p>
            <p className="text-3xl font-bold text-blue-400">
              {formatCurrency(pos.cartTotal)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-pos-muted uppercase tracking-wide mb-2">
              Payment Method
            </p>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setPayMethod(m.key)}
                  className={clsx(
                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-150 text-sm",
                    payMethod === m.key
                      ? "border-blue-500 bg-blue-600/10 text-blue-400"
                      : "border-pos-border bg-pos-card text-pos-muted hover:text-pos-text",
                  )}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          {payMethod === "cash" && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-pos-muted uppercase tracking-wide">
                Amount Tendered
              </p>
              <input
                type="number"
                placeholder={pos.cartTotal.toString()}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full bg-pos-input border border-pos-border rounded-lg px-3 py-2.5 text-lg font-bold text-pos-text focus:outline-none focus:border-blue-500 text-center"
              />
              {parseFloat(amountPaid) >= pos.cartTotal && (
                <div className="flex items-center justify-between text-sm p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <span className="text-pos-muted">Change</span>
                  <span className="font-bold text-emerald-400">
                    {formatCurrency(parseFloat(amountPaid) - pos.cartTotal)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal
        open={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          pos.clearLastSale();
        }}
        title="Sale Complete"
        size="sm"
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowReceiptModal(false);
                pos.clearLastSale();
              }}
            >
              New Sale
            </Button>
            <Button
              variant="secondary"
              icon={<Printer size={16} />}
              onClick={() => window.print()}
            >
              Print Receipt
            </Button>
          </div>
        }
      >
        {pos.lastSale && (
          <div className="space-y-4" id="receipt-content">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                <ShoppingCart size={22} className="text-emerald-400" />
              </div>
              <p className="font-bold text-pos-text text-lg">
                Payment Received
              </p>
              <p className="text-xs text-pos-muted font-mono">
                {pos.lastSale.receiptNumber}
              </p>
            </div>
            <div className="bg-pos-bg rounded-xl p-4 space-y-2 text-sm">
              {pos.lastSale.items.map((item) => (
                <div key={item.productId} className="flex justify-between">
                  <span className="text-pos-muted">
                    {item.productName} × {item.qty}
                  </span>
                  <span className="text-pos-text">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))}
              <div className="border-t border-pos-border pt-2 mt-2 space-y-1">
                {pos.lastSale.discountAmount > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>Discount</span>
                    <span>-{formatCurrency(pos.lastSale.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-pos-muted">
                  <span>Tax</span>
                  <span>{formatCurrency(pos.lastSale.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-pos-text text-base">
                  <span>Total</span>
                  <span className="text-blue-400">
                    {formatCurrency(pos.lastSale.total)}
                  </span>
                </div>
                {pos.lastSale.paymentMethod === "cash" &&
                  pos.lastSale.change > 0 && (
                    <div className="flex justify-between text-emerald-400 font-medium">
                      <span>Change</span>
                      <span>{formatCurrency(pos.lastSale.change)}</span>
                    </div>
                  )}
              </div>
            </div>
            <div className="text-center text-xs text-pos-muted">
              <p>{outlet.receiptFooter || "Thank you for your patronage!"}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Customer Selection Modal */}
      <Modal
        open={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        title="Select Customer"
        size="sm"
      >
        <div className="space-y-3">
          <input
            placeholder="Search by name or phone..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="w-full bg-pos-input border border-pos-border rounded-lg px-3 py-2 text-sm text-pos-text focus:outline-none focus:border-blue-500"
          />
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {filteredCustomers.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  pos.setSelectedCustomer(c);
                  setShowCustomerModal(false);
                }}
                className={clsx(
                  "w-full text-left px-3 py-2.5 rounded-lg border transition-all",
                  pos.selectedCustomer?.id === c.id
                    ? "border-blue-500 bg-blue-600/10"
                    : "border-pos-border bg-pos-card hover:bg-pos-hover",
                )}
              >
                <p className="text-sm font-medium text-pos-text">{c.name}</p>
                <p className="text-xs text-pos-muted">
                  {c.phone} · {c.loyaltyPoints} pts
                </p>
              </button>
            ))}
            {filteredCustomers.length === 0 && (
              <p className="text-center text-sm text-pos-muted py-4">
                No customers found.
              </p>
            )}
          </div>
          {pos.selectedCustomer && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                pos.setSelectedCustomer(null);
                setShowCustomerModal(false);
              }}
            >
              Remove Customer
            </Button>
          )}
        </div>
      </Modal>
    </div>
  );
}
