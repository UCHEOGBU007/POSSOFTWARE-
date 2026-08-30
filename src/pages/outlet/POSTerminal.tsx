// import { useEffect, useState } from "react";
// import {
//   Search,
//   ShoppingCart,
//   Plus,
//   Minus,
//   Trash2,
//   Tag,
//   User,
//   CreditCard,
//   Banknote,
//   Smartphone,
//   Building2,
//   X,
//   Printer,
//   RotateCcw,
//   ChevronUp,
//   Package,
// } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { usePOS } from "@/contexts/POSContext";
// import { db } from "@/db/database";
// import Button from "@/components/ui/Button.tsx";
// import Modal from "@/components/ui/Modal.tsx";
// import Badge from "@/components/ui/Badge.tsx";
// import { useToast } from "@/components/ui/Toast.tsx";
// import { formatCurrency, clsx } from "@/utils/helpers";
// import type { Product, Category, Customer, PaymentMethod } from "@/types";

// const paymentMethods: {
//   key: PaymentMethod;
//   label: string;
//   icon: React.ReactNode;
// }[] = [
//   { key: "cash", label: "Cash", icon: <Banknote size={18} /> },
//   { key: "card", label: "Card", icon: <CreditCard size={18} /> },
//   { key: "transfer", label: "Transfer", icon: <Building2 size={18} /> },
//   { key: "pos", label: "POS", icon: <Smartphone size={18} /> },
// ];

// export default function POSTerminal() {
//   const { outletSession } = useAuth();
//   const outlet = outletSession!.outlet;
//   const staff = outletSession!.staff;
//   const { success, error: showError } = useToast();
//   const pos = usePOS();

//   const [products, setProducts] = useState<Product[]>([]);
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [search, setSearch] = useState("");
//   const [activeCat, setActiveCat] = useState("");
//   const [showPayModal, setShowPayModal] = useState(false);
//   const [showReceiptModal, setShowReceiptModal] = useState(false);
//   const [payMethod, setPayMethod] = useState<PaymentMethod>("cash");
//   const [amountPaid, setAmountPaid] = useState("");
//   const [showCustomerModal, setShowCustomerModal] = useState(false);
//   const [customerSearch, setCustomerSearch] = useState("");
//   const [processing, setProcessing] = useState(false);

//   // Responsive state: Controls mobile cart drawer open/close
//   const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

//   useEffect(() => {
//     const load = async () => {
//       const [prods, cats, custs] = await Promise.all([
//         db.products
//           .where("outletId")
//           .equals(outlet.id)
//           .filter((p) => p.isActive)
//           .toArray(),
//         db.categories.where("outletId").equals(outlet.id).toArray(),
//         db.customers.where("outletId").equals(outlet.id).toArray(),
//       ]);
//       setProducts(prods);
//       setCategories(cats);
//       setCustomers(custs);
//     };
//     load();
//   }, [outlet.id]);

//   useEffect(() => {
//     pos.setTaxRate(outlet.taxEnabled ? 7.5 : 0);
//   }, [outlet.taxEnabled]);

//   const filtered = products.filter((p) => {
//     const q = search.toLowerCase();
//     const matchSearch =
//       !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
//     const matchCat = !activeCat || p.categoryId === activeCat;
//     return matchSearch && matchCat;
//   });

//   const handleCheckout = async () => {
//     if (pos.cart.length === 0) return;

//     const stockErrors = pos.cart
//       .map((item) => {
//         const product = products.find((p) => p.id === item.productId);
//         if (!product) return `Product ${item.productName} is unavailable.`;
//         if (product.trackStock && item.qty > product.stock) {
//           return `${item.productName} only has ${product.stock} ${product.unit} left.`;
//         }
//         return null;
//       })
//       .filter(Boolean) as string[];

//     if (stockErrors.length > 0) {
//       showError(stockErrors[0]);
//       return;
//     }

//     const paid =
//       payMethod === "cash" ? parseFloat(amountPaid || "0") : pos.cartTotal;
//     if (payMethod === "cash" && paid < pos.cartTotal) {
//       showError("Amount paid is less than total.");
//       return;
//     }
//     setProcessing(true);
//     try {
//       await pos.completeSale(
//         outlet.id,
//         payMethod,
//         paid,
//         staff?.id,
//         staff?.name,
//       );
//       setShowPayModal(false);
//       setShowReceiptModal(true);
//       setIsMobileCartOpen(false);
//       success("Sale completed!");
//     } catch (err: any) {
//       showError(err.message);
//     } finally {
//       setProcessing(false);
//       setAmountPaid("");
//     }
//   };

//   const filteredCustomers = customers.filter((c) => {
//     const q = customerSearch.toLowerCase();
//     return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
//   });

//   return (
//     <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-pos-bg relative">
//       {/* Product Grid Area */}
//       <div className="flex-1 flex flex-col overflow-hidden">
//         {/* Top Header & Search Bar */}
//         <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-3 border-b border-pos-border bg-pos-bg sticky top-0 z-10">
//           <div className="flex items-center gap-2 sm:gap-3">
//             <div className="relative flex-1 max-w-sm">
//               <Search
//                 size={15}
//                 className="absolute left-3 top-1/2 -translate-y-1/2 text-pos-muted"
//               />
//               <input
//                 placeholder="Search products..."
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 className="w-full bg-pos-input border border-pos-border rounded-lg pl-9 pr-3 py-2 text-sm text-pos-text placeholder:text-pos-muted/50 focus:outline-none focus:border-blue-500"
//               />
//             </div>
//             {outlet.taxEnabled && (
//               <Badge variant="info">VAT {pos.taxRate}%</Badge>
//             )}
//             {staff && (
//               <div className="hidden sm:flex items-center gap-1.5 text-xs text-pos-muted bg-pos-card border border-pos-border px-2.5 py-1.5 rounded-lg">
//                 <User size={12} />
//                 {staff.name}
//               </div>
//             )}
//           </div>

//           {/* Categories Bar */}
//           <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
//             <button
//               onClick={() => setActiveCat("")}
//               className={clsx(
//                 "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all touch-manipulation",
//                 !activeCat
//                   ? "bg-blue-600 text-white"
//                   : "bg-pos-card text-pos-muted border border-pos-border hover:text-pos-text",
//               )}
//             >
//               All
//             </button>
//             {categories.map((c) => (
//               <button
//                 key={c.id}
//                 onClick={() => setActiveCat(activeCat === c.id ? "" : c.id)}
//                 className={clsx(
//                   "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all touch-manipulation",
//                   activeCat === c.id
//                     ? "bg-blue-600 text-white"
//                     : "bg-pos-card text-pos-muted border border-pos-border hover:text-pos-text",
//                 )}
//               >
//                 {c.name}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Product Cards Grid */}
//         <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-24 md:pb-4">
//           {filtered.length === 0 ? (
//             <div className="flex flex-col items-center justify-center h-full text-center text-pos-muted">
//               <Search size={40} className="mb-3 opacity-30" />
//               <p className="text-sm">No products found.</p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
//               {filtered.map((p) => {
//                 const inCart = pos.cart.find((i) => i.productId === p.id);
//                 const outOfStock = p.trackStock && p.stock === 0;
//                 const imageUrl = (p as any).image || (p as any).imageUrl;

//                 return (
//                   <button
//                     key={p.id}
//                     disabled={outOfStock}
//                     onClick={() => {
//                       if (outOfStock) return;
//                       if (p.trackStock) {
//                         const currentQty = inCart?.qty ?? 0;
//                         if (currentQty + 1 > p.stock) {
//                           showError("Cannot add more items than are in stock.");
//                           return;
//                         }
//                       }
//                       pos.addToCart(p);
//                     }}
//                     className={clsx(
//                       "text-left p-3 rounded-xl border transition-all duration-150 group active:scale-[0.98] touch-manipulation flex flex-col justify-between",
//                       outOfStock
//                         ? "border-pos-border bg-pos-card opacity-50 cursor-not-allowed"
//                         : inCart
//                           ? "border-blue-500 bg-blue-600/10 hover:bg-blue-600/15"
//                           : "border-pos-border bg-pos-card hover:border-blue-500/50 hover:bg-pos-hover",
//                     )}
//                   >
//                     <div>
//                       {/* Image & Badge Header */}
//                       <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-pos-bg mb-2.5 flex items-center justify-center border border-pos-border/50">
//                         {imageUrl ? (
//                           <img
//                             src={imageUrl}
//                             alt={p.name}
//                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
//                             onError={(e) => {
//                               // Hide broken images and display fallback icon
//                               (e.target as HTMLElement).style.display = "none";
//                               const parent = (e.target as HTMLElement)
//                                 .parentElement;
//                               if (parent) {
//                                 const fallback =
//                                   parent.querySelector(".img-fallback");
//                                 if (fallback)
//                                   fallback.classList.remove("hidden");
//                               }
//                             }}
//                           />
//                         ) : null}
//                         <div
//                           className={clsx(
//                             "img-fallback flex flex-col items-center justify-center text-pos-muted group-hover:text-blue-400 transition-colors",
//                             imageUrl ? "hidden" : "flex",
//                           )}
//                         >
//                           <Package size={24} className="opacity-60" />
//                         </div>

//                         {inCart && (
//                           <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-md shadow-md z-10">
//                             {inCart.qty}
//                           </span>
//                         )}
//                       </div>

//                       <p className="text-sm font-medium text-pos-text leading-tight mb-1 line-clamp-2">
//                         {p.name}
//                       </p>
//                       <p className="text-xs text-pos-muted mb-2 truncate">
//                         {p.sku}
//                       </p>
//                     </div>

//                     <div>
//                       <p className="text-sm font-bold text-blue-400">
//                         {formatCurrency(p.price)}
//                       </p>
//                       {p.trackStock && (
//                         <p
//                           className={clsx(
//                             "text-xs mt-1",
//                             p.stock <= p.lowStockAlert
//                               ? "text-amber-400"
//                               : "text-pos-muted",
//                           )}
//                         >
//                           {outOfStock ? "Out of stock" : `${p.stock} ${p.unit}`}
//                         </p>
//                       )}
//                     </div>
//                   </button>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Mobile Cart Overlay Background */}
//       {isMobileCartOpen && (
//         <div
//           onClick={() => setIsMobileCartOpen(false)}
//           className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden transition-opacity"
//         />
//       )}

//       {/* Cart Container (Responsive Side Drawer on Desktop/Tablet, Bottom Drawer on Mobile) */}
//       <div
//         className={clsx(
//           "bg-pos-sidebar border-t md:border-t-0 md:border-l border-pos-border flex flex-col z-40 transition-transform duration-300 ease-in-out",
//           // Mobile View Positioning (Bottom Sheet / Overlay)
//           "fixed inset-x-0 bottom-0 h-[85vh] rounded-t-2xl shadow-2xl md:shadow-none md:rounded-none md:static",
//           // Tablet, Laptop, Desktop Resizing
//           "md:w-72 lg:w-80 xl:w-96 md:h-full md:translate-y-0",
//           // Toggle slide visibility on mobile screens
//           isMobileCartOpen
//             ? "translate-y-0"
//             : "translate-y-full md:translate-y-0",
//         )}
//       >
//         {/* Cart Header */}
//         <div className="px-4 py-3.5 border-b border-pos-border flex items-center justify-between shrink-0">
//           <div className="flex items-center gap-2">
//             <ShoppingCart size={18} className="text-blue-400" />
//             <span className="font-semibold text-pos-text">Cart</span>
//             {pos.cart.length > 0 && (
//               <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
//                 {pos.cart.length}
//               </span>
//             )}
//           </div>
//           <div className="flex items-center gap-1">
//             <button
//               onClick={() => setShowCustomerModal(true)}
//               className={clsx(
//                 "p-2 rounded-lg transition-colors text-xs flex items-center gap-1 touch-manipulation",
//                 pos.selectedCustomer
//                   ? "text-blue-400 bg-blue-500/10"
//                   : "text-pos-muted hover:text-pos-text hover:bg-pos-hover",
//               )}
//               title="Select customer"
//             >
//               <User size={16} />
//             </button>
//             {pos.cart.length > 0 && (
//               <button
//                 onClick={pos.clearCart}
//                 className="p-2 rounded-lg text-pos-muted hover:text-red-400 hover:bg-red-500/10 transition-colors touch-manipulation"
//                 title="Clear cart"
//               >
//                 <RotateCcw size={16} />
//               </button>
//             )}
//             {/* Close button for Mobile Drawer */}
//             <button
//               onClick={() => setIsMobileCartOpen(false)}
//               className="p-2 rounded-lg text-pos-muted hover:text-pos-text md:hidden touch-manipulation"
//               title="Close cart"
//             >
//               <X size={18} />
//             </button>
//           </div>
//         </div>

//         {/* Selected Customer Banner */}
//         {pos.selectedCustomer && (
//           <div className="mx-3 mt-3 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between shrink-0">
//             <div className="flex items-center gap-2 text-blue-400 text-xs truncate mr-2">
//               <User size={12} className="shrink-0" />
//               <span className="truncate">{pos.selectedCustomer.name}</span>
//             </div>
//             <button
//               onClick={() => pos.setSelectedCustomer(null)}
//               className="text-pos-muted hover:text-red-400 transition-colors shrink-0 p-1"
//             >
//               <X size={12} />
//             </button>
//           </div>
//         )}

//         {/* Cart Items List */}
//         <div className="flex-1 overflow-y-auto py-2">
//           {pos.cart.length === 0 ? (
//             <div className="flex flex-col items-center justify-center h-full text-center p-6 text-pos-muted">
//               <ShoppingCart size={36} className="mb-3 opacity-25" />
//               <p className="text-sm">Cart is empty</p>
//               <p className="text-xs mt-1">Tap a product to add</p>
//             </div>
//           ) : (
//             pos.cart.map((item) => (
//               <div
//                 key={item.productId}
//                 className="px-3 py-2.5 flex items-center gap-2 hover:bg-pos-hover transition-colors border-b border-pos-border/40 last:border-0"
//               >
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-medium text-pos-text truncate">
//                     {item.productName}
//                   </p>
//                   <p className="text-xs text-pos-muted">
//                     {formatCurrency(item.unitPrice)} × {item.qty}
//                   </p>
//                 </div>
//                 <div className="flex items-center gap-1 shrink-0">
//                   <button
//                     onClick={() => pos.updateQty(item.productId, item.qty - 1)}
//                     className="w-7 h-7 rounded-md bg-pos-hover flex items-center justify-center text-pos-muted hover:text-pos-text active:bg-pos-border transition-colors touch-manipulation"
//                   >
//                     <Minus size={14} />
//                   </button>
//                   <span className="w-6 text-center text-sm font-medium text-pos-text">
//                     {item.qty}
//                   </span>
//                   <button
//                     onClick={() => pos.updateQty(item.productId, item.qty + 1)}
//                     className="w-7 h-7 rounded-md bg-pos-hover flex items-center justify-center text-pos-muted hover:text-pos-text active:bg-pos-border transition-colors touch-manipulation"
//                   >
//                     <Plus size={14} />
//                   </button>
//                   <button
//                     onClick={() => pos.removeFromCart(item.productId)}
//                     className="w-7 h-7 rounded-md flex items-center justify-center text-pos-muted hover:text-red-400 transition-colors ml-0.5 touch-manipulation"
//                   >
//                     <Trash2 size={14} />
//                   </button>
//                 </div>
//                 <p className="text-sm font-semibold text-pos-text min-w-18 text-right shrink-0">
//                   {formatCurrency(item.total)}
//                 </p>
//               </div>
//             ))
//           )}
//         </div>

//         {/* Cart Summary & Action Footer */}
//         {pos.cart.length > 0 && (
//           <div className="border-t border-pos-border p-3 space-y-2 shrink-0 bg-pos-sidebar">
//             <div className="flex items-center gap-2">
//               <Tag size={14} className="text-pos-muted shrink-0" />
//               <input
//                 type="number"
//                 min="0"
//                 max="100"
//                 placeholder="Global discount %"
//                 value={pos.globalDiscount || ""}
//                 onChange={(e) =>
//                   pos.setGlobalDiscount(parseFloat(e.target.value) || 0)
//                 }
//                 className="flex-1 bg-pos-input border border-pos-border rounded-lg px-2 py-1.5 text-xs text-pos-text focus:outline-none focus:border-blue-500"
//               />
//             </div>
//             <div className="space-y-1 text-sm">
//               <div className="flex justify-between text-pos-muted">
//                 <span>Subtotal</span>
//                 <span>{formatCurrency(pos.cartSubtotal)}</span>
//               </div>
//               {pos.cartDiscount > 0 && (
//                 <div className="flex justify-between text-red-400">
//                   <span>Discount</span>
//                   <span>-{formatCurrency(pos.cartDiscount)}</span>
//                 </div>
//               )}
//               {outlet.taxEnabled && (
//                 <div className="flex justify-between text-pos-muted">
//                   <span>VAT ({pos.taxRate}%)</span>
//                   <span>{formatCurrency(pos.cartTax)}</span>
//                 </div>
//               )}
//               <div className="flex justify-between font-bold text-base text-pos-text pt-1 border-t border-pos-border">
//                 <span>Total</span>
//                 <span className="text-blue-400">
//                   {formatCurrency(pos.cartTotal)}
//                 </span>
//               </div>
//             </div>
//             <Button
//               className="w-full py-3 text-base touch-manipulation"
//               size="lg"
//               icon={<CreditCard size={18} />}
//               onClick={() => setShowPayModal(true)}
//             >
//               Charge {formatCurrency(pos.cartTotal)}
//             </Button>
//           </div>
//         )}
//       </div>

//       {/* Floating Bottom Bar (Visible ONLY on Mobile when Cart has Items and Drawer is Closed) */}
//       {!isMobileCartOpen && pos.cart.length > 0 && (
//         <div className="fixed bottom-0 inset-x-0 bg-pos-sidebar border-t border-pos-border p-3 flex items-center justify-between z-20 md:hidden shadow-lg">
//           <button
//             onClick={() => setIsMobileCartOpen(true)}
//             className="flex items-center gap-2 text-left text-pos-text"
//           >
//             <div className="relative bg-blue-600/20 p-2 rounded-lg text-blue-400">
//               <ShoppingCart size={20} />
//               <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
//                 {pos.cart.length}
//               </span>
//             </div>
//             <div>
//               <p className="text-xs text-pos-muted flex items-center gap-0.5 font-medium">
//                 View Cart <ChevronUp size={12} />
//               </p>
//               <p className="text-sm font-bold text-blue-400">
//                 {formatCurrency(pos.cartTotal)}
//               </p>
//             </div>
//           </button>
//           <Button
//             size="md"
//             icon={<CreditCard size={16} />}
//             onClick={() => setShowPayModal(true)}
//             className="touch-manipulation"
//           >
//             Pay Now
//           </Button>
//         </div>
//       )}

//       {/* Payment Modal */}
//       <Modal
//         open={showPayModal}
//         onClose={() => setShowPayModal(false)}
//         title="Complete Payment"
//         size="sm"
//         footer={
//           <div className="flex gap-3">
//             <Button
//               variant="outline"
//               onClick={() => setShowPayModal(false)}
//               className="flex-1"
//             >
//               Cancel
//             </Button>
//             <Button
//               className="flex-1"
//               onClick={handleCheckout}
//               loading={processing}
//               icon={<CreditCard size={16} />}
//             >
//               Confirm Sale
//             </Button>
//           </div>
//         }
//       >
//         <div className="space-y-4">
//           <div className="bg-pos-bg rounded-xl p-4 text-center">
//             <p className="text-xs text-pos-muted uppercase tracking-widest mb-1">
//               Amount Due
//             </p>
//             <p className="text-3xl font-bold text-blue-400">
//               {formatCurrency(pos.cartTotal)}
//             </p>
//           </div>
//           <div>
//             <p className="text-xs font-medium text-pos-muted uppercase tracking-wide mb-2">
//               Payment Method
//             </p>
//             <div className="grid grid-cols-2 gap-2">
//               {paymentMethods.map((m) => (
//                 <button
//                   key={m.key}
//                   onClick={() => setPayMethod(m.key)}
//                   className={clsx(
//                     "flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-150 text-sm touch-manipulation",
//                     payMethod === m.key
//                       ? "border-blue-500 bg-blue-600/10 text-blue-400"
//                       : "border-pos-border bg-pos-card text-pos-muted hover:text-pos-text",
//                   )}
//                 >
//                   {m.icon}
//                   {m.label}
//                 </button>
//               ))}
//             </div>
//           </div>
//           {payMethod === "cash" && (
//             <div className="space-y-2">
//               <p className="text-xs font-medium text-pos-muted uppercase tracking-wide">
//                 Amount Tendered
//               </p>
//               <input
//                 type="number"
//                 placeholder={pos.cartTotal.toString()}
//                 value={amountPaid}
//                 onChange={(e) => setAmountPaid(e.target.value)}
//                 className="w-full bg-pos-input border border-pos-border rounded-lg px-3 py-2.5 text-lg font-bold text-pos-text focus:outline-none focus:border-blue-500 text-center"
//               />
//               {parseFloat(amountPaid) >= pos.cartTotal && (
//                 <div className="flex items-center justify-between text-sm p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
//                   <span className="text-pos-muted">Change</span>
//                   <span className="font-bold text-emerald-400">
//                     {formatCurrency(parseFloat(amountPaid) - pos.cartTotal)}
//                   </span>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </Modal>

//       {/* Receipt Modal */}
//       <Modal
//         open={showReceiptModal}
//         onClose={() => {
//           setShowReceiptModal(false);
//           pos.clearLastSale();
//         }}
//         title="Sale Complete"
//         size="sm"
//         footer={
//           <div className="flex gap-3">
//             <Button
//               variant="outline"
//               className="flex-1"
//               onClick={() => {
//                 setShowReceiptModal(false);
//                 pos.clearLastSale();
//               }}
//             >
//               New Sale
//             </Button>
//             <Button
//               variant="secondary"
//               icon={<Printer size={16} />}
//               onClick={() => window.print()}
//             >
//               Print Receipt
//             </Button>
//           </div>
//         }
//       >
//         {pos.lastSale && (
//           <div className="space-y-4" id="receipt-content">
//             <div className="text-center">
//               <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
//                 <ShoppingCart size={22} className="text-emerald-400" />
//               </div>
//               <p className="font-bold text-pos-text text-lg">{outlet.name}</p>
//               <p className="text-sm text-pos-muted">Sale Receipt</p>
//               <p className="text-xs text-pos-muted font-mono mt-1">
//                 {pos.lastSale.receiptNumber}
//               </p>
//             </div>
//             <div className="bg-pos-bg rounded-xl p-4 space-y-2 text-sm">
//               {pos.lastSale.items.map((item) => (
//                 <div key={item.productId} className="flex justify-between">
//                   <span className="text-pos-muted">
//                     {item.productName} × {item.qty}
//                   </span>
//                   <span className="text-pos-text">
//                     {formatCurrency(item.total)}
//                   </span>
//                 </div>
//               ))}
//               <div className="border-t border-pos-border pt-2 mt-2 space-y-1">
//                 {pos.lastSale.discountAmount > 0 && (
//                   <div className="flex justify-between text-red-400">
//                     <span>Discount</span>
//                     <span>-{formatCurrency(pos.lastSale.discountAmount)}</span>
//                   </div>
//                 )}
//                 <div className="flex justify-between text-pos-muted">
//                   <span>Tax</span>
//                   <span>{formatCurrency(pos.lastSale.taxAmount)}</span>
//                 </div>
//                 <div className="flex justify-between font-bold text-pos-text text-base">
//                   <span>Total</span>
//                   <span className="text-blue-400">
//                     {formatCurrency(pos.lastSale.total)}
//                   </span>
//                 </div>
//                 {pos.lastSale.paymentMethod === "cash" &&
//                   pos.lastSale.change > 0 && (
//                     <div className="flex justify-between text-emerald-400 font-medium">
//                       <span>Change</span>
//                       <span>{formatCurrency(pos.lastSale.change)}</span>
//                     </div>
//                   )}
//               </div>
//             </div>
//             <div className="text-center text-xs text-pos-muted">
//               <p>{outlet.receiptFooter || "Thank you for your patronage!"}</p>
//             </div>
//           </div>
//         )}
//       </Modal>

//       {/* Customer Selection Modal */}
//       <Modal
//         open={showCustomerModal}
//         onClose={() => setShowCustomerModal(false)}
//         title="Select Customer"
//         size="sm"
//       >
//         <div className="space-y-3">
//           <input
//             placeholder="Search by name or phone..."
//             value={customerSearch}
//             onChange={(e) => setCustomerSearch(e.target.value)}
//             className="w-full bg-pos-input border border-pos-border rounded-lg px-3 py-2 text-sm text-pos-text focus:outline-none focus:border-blue-500"
//           />
//           <div className="space-y-1.5 max-h-64 overflow-y-auto">
//             {filteredCustomers.map((c) => (
//               <button
//                 key={c.id}
//                 onClick={() => {
//                   pos.setSelectedCustomer(c);
//                   setShowCustomerModal(false);
//                 }}
//                 className={clsx(
//                   "w-full text-left px-3 py-2.5 rounded-lg border transition-all touch-manipulation",
//                   pos.selectedCustomer?.id === c.id
//                     ? "border-blue-500 bg-blue-600/10"
//                     : "border-pos-border bg-pos-card hover:bg-pos-hover",
//                 )}
//               >
//                 <p className="text-sm font-medium text-pos-text">{c.name}</p>
//                 <p className="text-xs text-pos-muted">
//                   {c.phone} · {c.loyaltyPoints} pts
//                 </p>
//               </button>
//             ))}
//             {filteredCustomers.length === 0 && (
//               <p className="text-center text-sm text-pos-muted py-4">
//                 No customers found.
//               </p>
//             )}
//           </div>
//           {pos.selectedCustomer && (
//             <Button
//               variant="outline"
//               className="w-full"
//               onClick={() => {
//                 pos.setSelectedCustomer(null);
//                 setShowCustomerModal(false);
//               }}
//             >
//               Remove Customer
//             </Button>
//           )}
//         </div>
//       </Modal>
//     </div>
//   );
// }

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
  ChevronUp,
  Package,
  Wifi,
  Bluetooth,
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

/* ==========================================================================
   WEB BLUETOOTH TYPES & AMBIENT EXTENSIONS
   ========================================================================== */
declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options?: Record<string, any>): Promise<any>;
    };
  }
}

type BluetoothRemoteGATTCharacteristic = any;

/* ==========================================================================
   PRINTING UTILITIES & HARDWARE ABSTRACTION LAYER (ESC/POS & THERMAL PRINTERS)
   ========================================================================== */

/**
 * Generates raw ESC/POS binary buffer for standard 58mm / 80mm thermal printers.
 *
 * SCALABILITY NOTE:
 * If you need to support custom logos, QR codes, or different character sets
 * (e.g. Chinese, Arabic, Cyrillic), extend this byte encoder function using an
 * external ESC/POS library like `esc-pos-encoder` or `@node-escpos/core`.
 */
function generateEscPosBuffer(sale: any, outlet: any): Uint8Array {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];

  const addStr = (str: string) => parts.push(encoder.encode(str));
  const addBytes = (bytes: number[]) => parts.push(new Uint8Array(bytes));

  // ESC/POS Command Byte Constants
  const INIT = [0x1b, 0x40];
  const ALIGN_CENTER = [0x1b, 0x61, 0x01];
  const ALIGN_LEFT = [0x1b, 0x61, 0x00];
  const ALIGN_RIGHT = [0x1b, 0x61, 0x02];
  const BOLD_ON = [0x1b, 0x45, 0x01];
  const BOLD_OFF = [0x1b, 0x45, 0x00];
  const DOUBLE_SIZE = [0x1d, 0x21, 0x11];
  const NORMAL_SIZE = [0x1d, 0x21, 0x00];
  const CUT_PAPER = [0x1d, 0x56, 0x41, 0x00];

  // 1. Initialize Printer
  addBytes(INIT);

  // 2. Receipt Header
  addBytes(ALIGN_CENTER);
  addBytes(DOUBLE_SIZE);
  addBytes(BOLD_ON);
  addStr(`${outlet.name}\n`);
  addBytes(NORMAL_SIZE);
  addBytes(BOLD_OFF);
  addStr("Sale Receipt\n");
  addStr(`${sale.receiptNumber}\n`);
  addStr("--------------------------------\n");

  // 3. Item List
  addBytes(ALIGN_LEFT);
  sale.items.forEach((item: any) => {
    addStr(`${item.productName} x${item.qty}\n`);
    addBytes(ALIGN_RIGHT);
    addStr(`${formatCurrency(item.total)}\n`);
    addBytes(ALIGN_LEFT);
  });
  addStr("--------------------------------\n");

  // 4. Financial Totals
  if (sale.discountAmount > 0) {
    addStr(`Discount: -${formatCurrency(sale.discountAmount)}\n`);
  }
  addStr(`Tax: ${formatCurrency(sale.taxAmount)}\n`);
  addBytes(BOLD_ON);
  addStr(`TOTAL: ${formatCurrency(sale.total)}\n`);
  addBytes(BOLD_OFF);

  if (sale.paymentMethod === "cash" && sale.change > 0) {
    addStr(`Change: ${formatCurrency(sale.change)}\n`);
  }

  // 5. Receipt Footer & Paper Cut Command
  addStr("--------------------------------\n");
  addBytes(ALIGN_CENTER);
  addStr(`${outlet.receiptFooter || "Thank you for your patronage!"}\n\n\n`);
  addBytes(CUT_PAPER);

  // Merge byte arrays into a single contiguous Uint8Array
  const totalLength = parts.reduce((acc, curr) => acc + curr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}

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

  // Responsive state: Controls mobile cart drawer open/close
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  /* --------------------------------------------------------------------------
     PRINTER HARDWARE STATES (Bluetooth & Wireless/Network Printer Configurations)
     -------------------------------------------------------------------------- */
  const [printType, setPrintType] = useState<
    "system" | "bluetooth" | "network"
  >("system");
  const [networkPrinterIp, setNetworkPrinterIp] = useState<string>(
    localStorage.getItem("pos_network_printer_url") ||
      "http://192.168.1.100:8080/print",
  );
  const [isPrinting, setIsPrinting] = useState(false);

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

    const stockErrors = pos.cart
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return `Product ${item.productName} is unavailable.`;
        if (product.trackStock && item.qty > product.stock) {
          return `${item.productName} only has ${product.stock} ${product.unit} left.`;
        }
        return null;
      })
      .filter(Boolean) as string[];

    if (stockErrors.length > 0) {
      showError(stockErrors[0]);
      return;
    }

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
      setIsMobileCartOpen(false);
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

  /* ==========================================================================
     HARDWARE PRINTING DISPATCHER & CONNECTION HANDLERS
     ========================================================================== */

  /**
   * Bluetooth Print Handler using Web Bluetooth API.
   * Scans for paired Bluetooth thermal printers, establishes GATT connection,
   * and writes byte chunks to the serial characteristic.
   */
  const handleBluetoothPrint = async () => {
    if (!navigator.bluetooth) {
      showError("Web Bluetooth is not supported on this browser/device.");
      return;
    }

    if (!pos.lastSale) {
      showError("No sale receipt available to print.");
      return;
    }

    setIsPrinting(true);
    try {
      // Prompt user to select a paired Bluetooth Thermal Printer
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          "000018f0-0000-1000-8000-00805f9b34fb", // Standard ESC/POS UUID
          "00001101-0000-1000-8000-00805f9b34fb", // SPP UUID
          "49535343-fe7d-4ae5-8fa9-9fafd205e455", // ISSC UUID
        ],
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error("Could not connect to printer GATT server.");

      // Discover writable printer service & characteristic
      const services = await server.getPrimaryServices();
      let printCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            printCharacteristic = char;
            break;
          }
        }
        if (printCharacteristic) break;
      }

      if (!printCharacteristic) {
        throw new Error("No writable printing characteristic found on device.");
      }

      // Generate binary buffer and send in chunks
      const data = generateEscPosBuffer(pos.lastSale, outlet);
      const chunkSize = 512; // Transmit in safe 512-byte chunks
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await printCharacteristic.writeValue(chunk);
      }

      success("Receipt printed successfully via Bluetooth!");
    } catch (err: any) {
      if (err.name !== "NotFoundError") {
        showError(err.message || "Failed to print via Bluetooth.");
      }
    } finally {
      setIsPrinting(false);
    }
  };

  /**
   * Wireless / Network Print Handler.
   * Sends raw binary ESC/POS buffer over HTTP to a LAN IP, Print Agent Gateway,
   * or proxy server (e.g. QZ Tray, Epson ePOS, Star WebPRNT, or local Node print bridge).
   */
  const handleNetworkPrint = async () => {
    if (!pos.lastSale) {
      showError("No sale receipt available to print.");
      return;
    }

    const targetUrl = prompt(
      "Enter Wireless Thermal Printer LAN IP or Print Agent Endpoint:",
      networkPrinterIp,
    );

    if (!targetUrl) return;

    setNetworkPrinterIp(targetUrl);
    localStorage.setItem("pos_network_printer_url", targetUrl);
    setIsPrinting(true);

    try {
      const data = generateEscPosBuffer(pos.lastSale, outlet);

      // POST raw ESC/POS payload as an ArrayBuffer to LAN print agent
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/octet-stream" },
        body: data.buffer as BodyInit,
      });

      if (!response.ok) {
        throw new Error(`Printer bridge returned status ${response.status}`);
      }

      success("Receipt sent to Network Printer!");
    } catch (err: any) {
      showError(
        `Wireless print failed: ${err.message}. Check IP or Local Print Agent.`,
      );
    } finally {
      setIsPrinting(false);
    }
  };

  /**
   * Master Print Trigger Dispatcher.
   * Routes the print action based on the cashier's active selection.
   */
  const handlePrint = () => {
    if (printType === "bluetooth") {
      handleBluetoothPrint();
    } else if (printType === "network") {
      handleNetworkPrint();
    } else {
      // Standard OS Dialog / Driver / AirPrint Print Fallback
      window.print();
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-pos-bg relative">
      {/* 
        PRINT STYLESHEET ISOLATION:
        Ensures window.print() only renders the receipt modal content (#receipt-content)
        and hides the rest of the POS interface when printing via OS print drivers.
      */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #receipt-content, #receipt-content * {
            visibility: visible !important;
          }
          #receipt-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important; /* Standard Thermal Receipt Width */
            margin: 0 !important;
            padding: 10px !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>

      {/* Product Grid Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header & Search Bar */}
        <div className="px-3 sm:px-4 pt-3 sm:pt-4 pb-3 border-b border-pos-border bg-pos-bg sticky top-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3">
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
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-pos-muted bg-pos-card border border-pos-border px-2.5 py-1.5 rounded-lg">
                <User size={12} />
                {staff.name}
              </div>
            )}
          </div>

          {/* Categories Bar */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveCat("")}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all touch-manipulation",
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
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all touch-manipulation",
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

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 pb-24 md:pb-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-pos-muted">
              <Search size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No products found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
              {filtered.map((p) => {
                const inCart = pos.cart.find((i) => i.productId === p.id);
                const outOfStock = p.trackStock && p.stock === 0;
                const imageUrl = (p as any).image || (p as any).imageUrl;

                return (
                  <button
                    key={p.id}
                    disabled={outOfStock}
                    onClick={() => {
                      if (outOfStock) return;
                      if (p.trackStock) {
                        const currentQty = inCart?.qty ?? 0;
                        if (currentQty + 1 > p.stock) {
                          showError("Cannot add more items than are in stock.");
                          return;
                        }
                      }
                      pos.addToCart(p);
                    }}
                    className={clsx(
                      "text-left p-3 rounded-xl border transition-all duration-150 group active:scale-[0.98] touch-manipulation flex flex-col justify-between",
                      outOfStock
                        ? "border-pos-border bg-pos-card opacity-50 cursor-not-allowed"
                        : inCart
                          ? "border-blue-500 bg-blue-600/10 hover:bg-blue-600/15"
                          : "border-pos-border bg-pos-card hover:border-blue-500/50 hover:bg-pos-hover",
                    )}
                  >
                    <div>
                      {/* Image & Badge Header */}
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-pos-bg mb-2.5 flex items-center justify-center border border-pos-border/50">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                              const parent = (e.target as HTMLElement)
                                .parentElement;
                              if (parent) {
                                const fallback =
                                  parent.querySelector(".img-fallback");
                                if (fallback)
                                  fallback.classList.remove("hidden");
                              }
                            }}
                          />
                        ) : null}
                        <div
                          className={clsx(
                            "img-fallback flex flex-col items-center justify-center text-pos-muted group-hover:text-blue-400 transition-colors",
                            imageUrl ? "hidden" : "flex",
                          )}
                        >
                          <Package size={24} className="opacity-60" />
                        </div>

                        {inCart && (
                          <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-md shadow-md z-10">
                            {inCart.qty}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-medium text-pos-text leading-tight mb-1 line-clamp-2">
                        {p.name}
                      </p>
                      <p className="text-xs text-pos-muted mb-2 truncate">
                        {p.sku}
                      </p>
                    </div>

                    <div>
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
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Cart Overlay Background */}
      {isMobileCartOpen && (
        <div
          onClick={() => setIsMobileCartOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-30 md:hidden transition-opacity"
        />
      )}

      {/* Cart Container (Responsive Side Drawer on Desktop/Tablet, Bottom Drawer on Mobile) */}
      <div
        className={clsx(
          "bg-pos-sidebar border-t md:border-t-0 md:border-l border-pos-border flex flex-col z-40 transition-transform duration-300 ease-in-out",
          "fixed inset-x-0 bottom-0 h-[85vh] rounded-t-2xl shadow-2xl md:shadow-none md:rounded-none md:static",
          "md:w-72 lg:w-80 xl:w-96 md:h-full md:translate-y-0",
          isMobileCartOpen
            ? "translate-y-0"
            : "translate-y-full md:translate-y-0",
        )}
      >
        {/* Cart Header */}
        <div className="px-4 py-3.5 border-b border-pos-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-blue-400" />
            <span className="font-semibold text-pos-text">Cart</span>
            {pos.cart.length > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pos.cart.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowCustomerModal(true)}
              className={clsx(
                "p-2 rounded-lg transition-colors text-xs flex items-center gap-1 touch-manipulation",
                pos.selectedCustomer
                  ? "text-blue-400 bg-blue-500/10"
                  : "text-pos-muted hover:text-pos-text hover:bg-pos-hover",
              )}
              title="Select customer"
            >
              <User size={16} />
            </button>
            {pos.cart.length > 0 && (
              <button
                onClick={pos.clearCart}
                className="p-2 rounded-lg text-pos-muted hover:text-red-400 hover:bg-red-500/10 transition-colors touch-manipulation"
                title="Clear cart"
              >
                <RotateCcw size={16} />
              </button>
            )}
            <button
              onClick={() => setIsMobileCartOpen(false)}
              className="p-2 rounded-lg text-pos-muted hover:text-pos-text md:hidden touch-manipulation"
              title="Close cart"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Selected Customer Banner */}
        {pos.selectedCustomer && (
          <div className="mx-3 mt-3 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-blue-400 text-xs truncate mr-2">
              <User size={12} className="shrink-0" />
              <span className="truncate">{pos.selectedCustomer.name}</span>
            </div>
            <button
              onClick={() => pos.setSelectedCustomer(null)}
              className="text-pos-muted hover:text-red-400 transition-colors shrink-0 p-1"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Cart Items List */}
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
                className="px-3 py-2.5 flex items-center gap-2 hover:bg-pos-hover transition-colors border-b border-pos-border/40 last:border-0"
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
                    className="w-7 h-7 rounded-md bg-pos-hover flex items-center justify-center text-pos-muted hover:text-pos-text active:bg-pos-border transition-colors touch-manipulation"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-medium text-pos-text">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => pos.updateQty(item.productId, item.qty + 1)}
                    className="w-7 h-7 rounded-md bg-pos-hover flex items-center justify-center text-pos-muted hover:text-pos-text active:bg-pos-border transition-colors touch-manipulation"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => pos.removeFromCart(item.productId)}
                    className="w-7 h-7 rounded-md flex items-center justify-center text-pos-muted hover:text-red-400 transition-colors ml-0.5 touch-manipulation"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="text-sm font-semibold text-pos-text min-w-18 text-right shrink-0">
                  {formatCurrency(item.total)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary & Action Footer */}
        {pos.cart.length > 0 && (
          <div className="border-t border-pos-border p-3 space-y-2 shrink-0 bg-pos-sidebar">
            <div className="flex items-center gap-2">
              <Tag size={14} className="text-pos-muted shrink-0" />
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
              className="w-full py-3 text-base touch-manipulation"
              size="lg"
              icon={<CreditCard size={18} />}
              onClick={() => setShowPayModal(true)}
            >
              Charge {formatCurrency(pos.cartTotal)}
            </Button>
          </div>
        )}
      </div>

      {/* Floating Bottom Bar (Visible ONLY on Mobile when Cart has Items and Drawer is Closed) */}
      {!isMobileCartOpen && pos.cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-pos-sidebar border-t border-pos-border p-3 flex items-center justify-between z-20 md:hidden shadow-lg">
          <button
            onClick={() => setIsMobileCartOpen(true)}
            className="flex items-center gap-2 text-left text-pos-text"
          >
            <div className="relative bg-blue-600/20 p-2 rounded-lg text-blue-400">
              <ShoppingCart size={20} />
              <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {pos.cart.length}
              </span>
            </div>
            <div>
              <p className="text-xs text-pos-muted flex items-center gap-0.5 font-medium">
                View Cart <ChevronUp size={12} />
              </p>
              <p className="text-sm font-bold text-blue-400">
                {formatCurrency(pos.cartTotal)}
              </p>
            </div>
          </button>
          <Button
            size="md"
            icon={<CreditCard size={16} />}
            onClick={() => setShowPayModal(true)}
            className="touch-manipulation"
          >
            Pay Now
          </Button>
        </div>
      )}

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
                    "flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-150 text-sm touch-manipulation",
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

      {/* Receipt Modal (WITH MULTI-PRINTER HARDWARE SUPPORT) */}
      <Modal
        open={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          pos.clearLastSale();
        }}
        title="Sale Complete"
        size="sm"
        footer={
          <div className="flex flex-col gap-3 w-full">
            {/* PRINTER HARDWARE MODE SELECTOR */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-pos-bg rounded-lg border border-pos-border">
              <button
                onClick={() => setPrintType("system")}
                className={clsx(
                  "flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-all",
                  printType === "system"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-pos-muted hover:text-pos-text",
                )}
                title="Use System Printer / Driver / AirPrint"
              >
                <Printer size={13} /> System
              </button>
              <button
                onClick={() => setPrintType("bluetooth")}
                className={clsx(
                  "flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-all",
                  printType === "bluetooth"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-pos-muted hover:text-pos-text",
                )}
                title="Connect directly via Web Bluetooth ESC/POS"
              >
                <Bluetooth size={13} /> Bluetooth
              </button>
              <button
                onClick={() => setPrintType("network")}
                className={clsx(
                  "flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-all",
                  printType === "network"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-pos-muted hover:text-pos-text",
                )}
                title="Print via Wi-Fi / LAN / Local Print Gateway"
              >
                <Wifi size={13} /> Wireless
              </button>
            </div>

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
                onClick={handlePrint}
                loading={isPrinting}
              >
                {printType === "bluetooth"
                  ? "Print via BT"
                  : printType === "network"
                    ? "Print via Wi-Fi"
                    : "Print Receipt"}
              </Button>
            </div>
          </div>
        }
      >
        {pos.lastSale && (
          <div className="space-y-4" id="receipt-content">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
                <ShoppingCart size={22} className="text-emerald-400" />
              </div>
              <p className="font-bold text-pos-text text-lg">{outlet.name}</p>
              <p className="text-sm text-pos-muted">Sale Receipt</p>
              <p className="text-xs text-pos-muted font-mono mt-1">
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
                  "w-full text-left px-3 py-2.5 rounded-lg border transition-all touch-manipulation",
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
