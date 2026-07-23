// import { useEffect, useState } from "react";
// import { Search, Eye, RotateCcw } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { db } from "@/db/database";
// import Header from "@/components/layout/Header";
// import Input from "@/components/ui/Input";
// import Badge from "@/components/ui/Badge";
// import Modal from "@/components/ui/Modal";
// import Button from "@/components/ui/Button";
// import { useToast } from "@/components/ui/Toast";
// import { syncRecord } from "@/lib/sync";
// import { formatCurrency, formatDate } from "@/utils/helpers";
// import type { Sale } from "@/types";

// export default function SalesHistory() {
//   const { outletSession } = useAuth();
//   const outlet = outletSession!.outlet;
//   const { success } = useToast();
//   const [sales, setSales] = useState<Sale[]>([]);
//   const [search, setSearch] = useState("");
//   const [viewing, setViewing] = useState<Sale | null>(null);
//   const [dateFrom, setDateFrom] = useState("");
//   const [dateTo, setDateTo] = useState("");

//   const load = async () => {
//     const data = await db.sales
//       .where("outletId")
//       .equals(outlet.id)
//       .reverse()
//       .sortBy("createdAt");
//     setSales(data);
//   };

//   useEffect(() => {
//     load();
//   }, [outlet.id]);

//   const filtered = sales.filter((s) => {
//     const q = search.toLowerCase();
//     const matchQ =
//       !q ||
//       s.receiptNumber.toLowerCase().includes(q) ||
//       (s.customerName ?? "").toLowerCase().includes(q);
//     const matchFrom = !dateFrom || s.createdAt >= dateFrom;
//     const matchTo = !dateTo || s.createdAt <= dateTo + "T23:59:59";
//     return matchQ && matchFrom && matchTo;
//   });

//   const totalRevenue = filtered
//     .filter((s) => s.status === "completed")
//     .reduce((sum, s) => sum + s.total, 0);

//   const handleRefund = async (sale: Sale) => {
//     if (!confirm(`Refund sale ${sale.receiptNumber}?`)) return;
//     await db.sales.update(sale.id, {
//       status: "refunded",
//       syncStatus: "pending",
//     });
//     const updatedSale = await db.sales.get(sale.id);
//     if (updatedSale) await syncRecord("sales", updatedSale);
//     // Restore stock
//     for (const item of sale.items) {
//       const prod = await db.products.get(item.productId);
//       if (prod && prod.trackStock) {
//         await db.products.update(item.productId, {
//           stock: prod.stock + item.qty,
//           syncStatus: "pending",
//         });
//         const updatedProduct = await db.products.get(item.productId);
//         if (updatedProduct) await syncRecord("products", updatedProduct);
//       }
//     }
//     success("Sale refunded and stock restored.");
//     setViewing(null);
//     load();
//   };

//   return (
//     <div>
//       <Header
//         title="Sales History"
//         subtitle={`${filtered.length} transactions · ${formatCurrency(totalRevenue)} revenue`}
//       />
//       <div className="p-6 space-y-4">
//         <div className="flex flex-wrap gap-3">
//           <Input
//             placeholder="Search receipt or customer..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             leftIcon={<Search size={15} />}
//             className="w-64"
//           />
//           <Input
//             type="date"
//             value={dateFrom}
//             onChange={(e) => setDateFrom(e.target.value)}
//             className="w-40"
//           />
//           <Input
//             type="date"
//             value={dateTo}
//             onChange={(e) => setDateTo(e.target.value)}
//             className="w-40"
//           />
//         </div>

//         <div className="bg-pos-card border border-pos-border rounded-xl overflow-hidden">
//           <table className="w-full text-sm">
//             <thead>
//               <tr className="border-b border-pos-border">
//                 {[
//                   "Receipt #",
//                   "Date",
//                   "Customer",
//                   "Items",
//                   "Payment",
//                   "Total",
//                   "Status",
//                   "",
//                 ].map((h) => (
//                   <th
//                     key={h}
//                     className="text-left px-4 py-3 text-xs font-medium text-pos-muted uppercase tracking-wider"
//                   >
//                     {h}
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-pos-border">
//               {filtered.length === 0 ? (
//                 <tr>
//                   <td
//                     colSpan={8}
//                     className="px-4 py-12 text-center text-pos-muted"
//                   >
//                     No sales found.
//                   </td>
//                 </tr>
//               ) : (
//                 filtered.map((sale) => (
//                   <tr
//                     key={sale.id}
//                     className="hover:bg-pos-hover transition-colors"
//                   >
//                     <td className="px-4 py-3 font-mono text-xs text-blue-400">
//                       {sale.receiptNumber}
//                     </td>
//                     <td className="px-4 py-3 text-pos-muted text-xs">
//                       {formatDate(sale.createdAt)}
//                     </td>
//                     <td className="px-4 py-3 text-pos-text">
//                       {sale.customerName ?? "—"}
//                     </td>
//                     <td className="px-4 py-3 text-pos-muted">
//                       {sale.items.length}
//                     </td>
//                     <td className="px-4 py-3">
//                       <Badge variant="muted">
//                         {sale.paymentMethod.toUpperCase()}
//                       </Badge>
//                     </td>
//                     <td className="px-4 py-3 font-semibold text-pos-text">
//                       {formatCurrency(sale.total)}
//                     </td>
//                     <td className="px-4 py-3">
//                       <Badge
//                         variant={
//                           sale.status === "completed"
//                             ? "success"
//                             : sale.status === "refunded"
//                               ? "warning"
//                               : "danger"
//                         }
//                         dot
//                       >
//                         {sale.status}
//                       </Badge>
//                     </td>
//                     <td className="px-4 py-3">
//                       <button
//                         onClick={() => setViewing(sale)}
//                         className="p-1.5 rounded-lg text-pos-muted hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
//                       >
//                         <Eye size={15} />
//                       </button>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       <Modal
//         open={!!viewing}
//         onClose={() => setViewing(null)}
//         title={`Receipt — ${viewing?.receiptNumber}`}
//         size="sm"
//         footer={
//           viewing?.status === "completed" ? (
//             <Button
//               variant="danger"
//               icon={<RotateCcw size={15} />}
//               onClick={() => viewing && handleRefund(viewing)}
//             >
//               Process Refund
//             </Button>
//           ) : undefined
//         }
//       >
//         {viewing && (
//           <div className="space-y-4 text-sm">
//             <div className="grid grid-cols-2 gap-3 text-xs">
//               <div>
//                 <p className="text-pos-muted">Date</p>
//                 <p className="text-pos-text">{formatDate(viewing.createdAt)}</p>
//               </div>
//               <div>
//                 <p className="text-pos-muted">Payment</p>
//                 <p className="text-pos-text uppercase">
//                   {viewing.paymentMethod}
//                 </p>
//               </div>
//               <div>
//                 <p className="text-pos-muted">Customer</p>
//                 <p className="text-pos-text">
//                   {viewing.customerName ?? "Walk-in"}
//                 </p>
//               </div>
//               <div>
//                 <p className="text-pos-muted">Staff</p>
//                 <p className="text-pos-text">{viewing.staffName ?? "—"}</p>
//               </div>
//             </div>
//             <div className="bg-pos-bg rounded-xl p-3 space-y-2">
//               {viewing.items.map((item) => (
//                 <div key={item.productId} className="flex justify-between">
//                   <span className="text-pos-muted">
//                     {item.productName} × {item.qty}
//                   </span>
//                   <span className="text-pos-text">
//                     {formatCurrency(item.total)}
//                   </span>
//                 </div>
//               ))}
//               <div className="border-t border-pos-border pt-2 space-y-1">
//                 {viewing.discountAmount > 0 && (
//                   <div className="flex justify-between text-red-400">
//                     <span>Discount</span>
//                     <span>-{formatCurrency(viewing.discountAmount)}</span>
//                   </div>
//                 )}
//                 <div className="flex justify-between text-pos-muted">
//                   <span>Tax</span>
//                   <span>{formatCurrency(viewing.taxAmount)}</span>
//                 </div>
//                 <div className="flex justify-between font-bold text-pos-text">
//                   <span>Total</span>
//                   <span>{formatCurrency(viewing.total)}</span>
//                 </div>
//                 {viewing.paymentMethod === "cash" && (
//                   <div className="flex justify-between text-emerald-400">
//                     <span>Change</span>
//                     <span>{formatCurrency(viewing.change)}</span>
//                   </div>
//                 )}
//               </div>
//             </div>
//             {viewing.note && (
//               <p className="text-xs text-pos-muted italic">
//                 Note: {viewing.note}
//               </p>
//             )}
//           </div>
//         )}
//       </Modal>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { Search, Eye, RotateCcw } from "lucide-react";

// Fixed: Cleaned up relative import pathing trees to use the absolute @/ alias
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/db/database";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { syncRecord } from "@/lib/sync";
import { formatCurrency, formatDate } from "@/utils/helpers";
import type { Sale } from "@/types";

export default function SalesHistory() {
  const { outletSession } = useAuth();
  const outlet = outletSession!.outlet;
  const { success } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Sale | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = async () => {
    const data = await db.sales
      .where("outletId")
      .equals(outlet.id)
      .reverse()
      .sortBy("createdAt");
    setSales(data);
  };

  useEffect(() => {
    load();
  }, [outlet.id]);

  const filtered = sales.filter((s) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      s.receiptNumber.toLowerCase().includes(q) ||
      (s.customerName ?? "").toLowerCase().includes(q);
    const matchFrom = !dateFrom || s.createdAt >= dateFrom;
    const matchTo = !dateTo || s.createdAt <= dateTo + "T23:59:59";
    return matchQ && matchFrom && matchTo;
  });

  const totalRevenue = filtered
    .filter((s) => s.status === "completed")
    .reduce((sum, s) => sum + s.total, 0);

  const handleRefund = async (sale: Sale) => {
    if (!confirm(`Refund sale ${sale.receiptNumber}?`)) return;
    await db.sales.update(sale.id, {
      status: "refunded",
      syncStatus: "pending",
    });
    const updatedSale = await db.sales.get(sale.id);
    if (updatedSale) await syncRecord("sales", updatedSale);

    // Restore stock
    for (const item of sale.items) {
      const prod = await db.products.get(item.productId);
      if (prod && prod.trackStock) {
        await db.products.update(item.productId, {
          stock: prod.stock + item.qty,
          syncStatus: "pending",
        });
        const updatedProduct = await db.products.get(item.productId);
        if (updatedProduct) await syncRecord("products", updatedProduct);
      }
    }
    success("Sale refunded and stock restored.");
    setViewing(null);
    load();
  };

  return (
    <div>
      <Header
        title="Sales History"
        subtitle={`${filtered.length} transactions · ${formatCurrency(totalRevenue)} revenue`}
      />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search receipt or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={15} />}
            className="w-64"
          />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
        </div>

        <div className="bg-pos-card border border-pos-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-pos-border">
                {[
                  "Receipt #",
                  "Date",
                  "Customer",
                  "Items",
                  "Payment",
                  "Total",
                  "Status",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-medium text-pos-muted uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-pos-border">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-pos-muted"
                  >
                    No sales found.
                  </td>
                </tr>
              ) : (
                filtered.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-pos-hover transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-blue-400">
                      {sale.receiptNumber}
                    </td>
                    <td className="px-4 py-3 text-pos-muted text-xs">
                      {formatDate(sale.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-pos-text">
                      {sale.customerName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-pos-muted">
                      {sale.items.length}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="muted">
                        {sale.paymentMethod.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-pos-text">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          sale.status === "completed"
                            ? "success"
                            : sale.status === "refunded"
                              ? "warning"
                              : "danger"
                        }
                        dot
                      >
                        {sale.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setViewing(sale)}
                        className="p-1.5 rounded-lg text-pos-muted hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={`Receipt — ${viewing?.receiptNumber}`}
        size="sm"
        footer={
          viewing?.status === "completed" ? (
            <Button
              variant="danger"
              icon={<RotateCcw size={15} />}
              onClick={() => viewing && handleRefund(viewing)}
            >
              Process Refund
            </Button>
          ) : undefined
        }
      >
        {viewing && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-pos-muted">Date</p>
                <p className="text-pos-text">{formatDate(viewing.createdAt)}</p>
              </div>
              <div>
                <p className="text-pos-muted">Payment</p>
                <p className="text-pos-text uppercase">
                  {viewing.paymentMethod}
                </p>
              </div>
              <div>
                <p className="text-pos-muted">Customer</p>
                <p className="text-pos-text">
                  {viewing.customerName ?? "Walk-in"}
                </p>
              </div>
              <div>
                <p className="text-pos-muted">Staff</p>
                <p className="text-pos-text">{viewing.staffName ?? "—"}</p>
              </div>
            </div>
            <div className="bg-pos-bg rounded-xl p-3 space-y-2">
              {viewing.items.map((item) => (
                <div key={item.productId} className="flex justify-between">
                  <span className="text-pos-muted">
                    {item.productName} × {item.qty}
                  </span>
                  <span className="text-pos-text">
                    {formatCurrency(item.total)}
                  </span>
                </div>
              ))}
              <div className="border-t border-pos-border pt-2 space-y-1">
                {viewing.discountAmount > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>Discount</span>
                    <span>-{formatCurrency(viewing.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-pos-muted">
                  <span>Tax</span>
                  <span>{formatCurrency(viewing.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-pos-text">
                  <span>Total</span>
                  <span>{formatCurrency(viewing.total)}</span>
                </div>
                {viewing.paymentMethod === "cash" && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Change</span>
                    <span>{formatCurrency(viewing.change)}</span>
                  </div>
                )}
              </div>
            </div>
            {viewing.note && (
              <p className="text-xs text-pos-muted italic">
                Note: {viewing.note}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
