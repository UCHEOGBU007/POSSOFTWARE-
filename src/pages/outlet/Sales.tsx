// import { useEffect, useState } from "react";
// import {
//   Search,
//   Eye,
//   RotateCcw,
//   FileSpreadsheet,
//   FileText,
//   ShieldAlert,
// } from "lucide-react";

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

// /**
//  * SalesHistory Component
//  * Provides a responsive, full-featured sales transaction log with search filtering,
//  * date range querying, CSV/PDF export, receipt breakdown modal, and manager-only refund logic.
//  */
// export default function SalesHistory() {
//   // ---------------------------------------------------------------------------
//   // Context & Hooks
//   // ---------------------------------------------------------------------------
//   const { outletSession } = useAuth();
//   const outlet = outletSession!.outlet;
//   const { success, error } = useToast();

//   // Safe role extraction without breaking OutletSession or AuthContextType interfaces
//   const sessionData = outletSession as unknown as {
//     role?: string;
//     user?: { role?: string };
//   };
//   const isManager =
//     sessionData?.role === "manager" || sessionData?.user?.role === "manager";

//   // ---------------------------------------------------------------------------
//   // State Management
//   // ---------------------------------------------------------------------------
//   /** Complete sales transactions loaded for the current outlet */
//   const [sales, setSales] = useState<Sale[]>([]);
//   /** Text search filter query for receipt number or customer name */
//   const [search, setSearch] = useState("");
//   /** Active sale record selected for modal inspection and refund handling */
//   const [viewing, setViewing] = useState<Sale | null>(null);
//   /** Date range filter boundaries (Format: YYYY-MM-DD) */
//   const [dateFrom, setDateFrom] = useState("");
//   const [dateTo, setDateTo] = useState("");

//   // ---------------------------------------------------------------------------
//   // Data Loading
//   // ---------------------------------------------------------------------------
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

//   // ---------------------------------------------------------------------------
//   // Data Filtering & Revenue Calculations
//   // ---------------------------------------------------------------------------
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

//   // ---------------------------------------------------------------------------
//   // Document / Report Export Handlers
//   // ---------------------------------------------------------------------------
//   const handleExportCSV = () => {
//     if (filtered.length === 0) return;

//     const headers = [
//       "Receipt #",
//       "Date",
//       "Customer",
//       "Items Count",
//       "Payment Method",
//       "Total Amount",
//       "Status",
//     ];

//     const rows = filtered.map((s) => [
//       `"${s.receiptNumber}"`,
//       `"${formatDate(s.createdAt)}"`,
//       `"${s.customerName ?? "Walk-in"}"`,
//       s.items.length,
//       `"${s.paymentMethod.toUpperCase()}"`,
//       s.total,
//       `"${s.status}"`,
//     ]);

//     const csvContent =
//       "data:text/csv;charset=utf-8," +
//       [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

//     const encodedUri = encodeURI(csvContent);
//     const link = document.createElement("a");
//     link.setAttribute("href", encodedUri);
//     link.setAttribute(
//       "download",
//       `sales_history_${new Date().toISOString().slice(0, 10)}.csv`,
//     );
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     success("Sales report exported to CSV document.");
//   };

//   const handleExportPDF = () => {
//     if (filtered.length === 0) return;

//     const printWindow = window.open("", "_blank");
//     if (!printWindow) return;

//     const html = `
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <title>Sales History Report</title>
//           <style>
//             body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #1e293b; background: #fff; }
//             h1 { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
//             p.meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
//             table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
//             th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
//             th { background-color: #f8fafc; font-weight: 600; color: #475569; text-transform: uppercase; font-size: 10px; }
//             .right { text-align: right; }
//             .mono { font-family: monospace; color: #2563eb; }
//             .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
//             .completed { background: #dcfce7; color: #166534; }
//             .refunded { background: #fef3c7; color: #92400e; }
//           </style>
//         </head>
//         <body>
//           <h1>Sales History Report</h1>
//           <p class="meta">Outlet: ${outlet.name || "Main Outlet"} | Generated: ${new Date().toLocaleString()} | Transactions: ${filtered.length} | Net Revenue: ${formatCurrency(totalRevenue)}</p>
//           <table>
//             <thead>
//               <tr>
//                 <th>Receipt #</th>
//                 <th>Date</th>
//                 <th>Customer</th>
//                 <th>Items</th>
//                 <th>Payment</th>
//                 <th class="right">Total</th>
//                 <th>Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               ${filtered
//                 .map(
//                   (s) => `
//                 <tr>
//                   <td class="mono">${s.receiptNumber}</td>
//                   <td>${formatDate(s.createdAt)}</td>
//                   <td>${s.customerName ?? "Walk-in"}</td>
//                   <td>${s.items.length}</td>
//                   <td>${s.paymentMethod.toUpperCase()}</td>
//                   <td class="right">${formatCurrency(s.total)}</td>
//                   <td><span class="badge ${s.status}">${s.status}</span></td>
//                 </tr>
//               `,
//                 )
//                 .join("")}
//             </tbody>
//           </table>
//           <script>
//             window.onload = function() { window.print(); window.close(); };
//           </script>
//         </body>
//       </html>
//     `;

//     printWindow.document.write(html);
//     printWindow.document.close();
//   };

//   // ---------------------------------------------------------------------------
//   // Action Handlers
//   // ---------------------------------------------------------------------------
//   const handleRefund = async (sale: Sale) => {
//     if (!isManager) {
//       error("Manager permission required to refund transactions.");
//       return;
//     }

//     if (!confirm(`Refund sale ${sale.receiptNumber}?`)) return;

//     await db.sales.update(sale.id, {
//       status: "refunded",
//       syncStatus: "pending",
//     });
//     const updatedSale = await db.sales.get(sale.id);
//     if (updatedSale) await syncRecord("sales", updatedSale);

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

//   // ---------------------------------------------------------------------------
//   // View Rendering
//   // ---------------------------------------------------------------------------
//   return (
//     <div className="w-full min-h-screen">
//       <Header
//         title="Sales History"
//         subtitle={`${filtered.length} transactions · ${formatCurrency(totalRevenue)} revenue`}
//       />

//       <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
//           <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center w-full md:w-auto">
//             <Input
//               placeholder="Search receipt or customer..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               leftIcon={<Search size={15} />}
//               className="w-full sm:w-64"
//             />
//             <div className="flex flex-row gap-2 w-full sm:w-auto">
//               <Input
//                 type="date"
//                 value={dateFrom}
//                 onChange={(e) => setDateFrom(e.target.value)}
//                 className="w-1/2 sm:w-40"
//               />
//               <Input
//                 type="date"
//                 value={dateTo}
//                 onChange={(e) => setDateTo(e.target.value)}
//                 className="w-1/2 sm:w-40"
//               />
//             </div>
//           </div>

//           <div className="flex items-center gap-2 w-full md:w-auto">
//             <Button
//               variant="secondary"
//               icon={<FileSpreadsheet size={15} />}
//               onClick={handleExportCSV}
//               className="flex-1 sm:flex-none justify-center text-xs"
//             >
//               Export CSV
//             </Button>
//             <Button
//               variant="secondary"
//               icon={<FileText size={15} />}
//               onClick={handleExportPDF}
//               className="flex-1 sm:flex-none justify-center text-xs"
//             >
//               Export PDF
//             </Button>
//           </div>
//         </div>

//         <div className="bg-pos-card border border-pos-border rounded-xl overflow-hidden shadow-sm">
//           <div className="overflow-x-auto w-full">
//             <table className="w-full text-sm min-w-175">
//               <thead>
//                 <tr className="border-b border-pos-border bg-pos-bg/40">
//                   {[
//                     "Receipt #",
//                     "Date",
//                     "Customer",
//                     "Items",
//                     "Payment",
//                     "Total",
//                     "Status",
//                     "",
//                   ].map((h) => (
//                     <th
//                       key={h}
//                       className="text-left px-4 py-3 text-xs font-medium text-pos-muted uppercase tracking-wider"
//                     >
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-pos-border">
//                 {filtered.length === 0 ? (
//                   <tr>
//                     <td
//                       colSpan={8}
//                       className="px-4 py-12 text-center text-pos-muted"
//                     >
//                       No sales found.
//                     </td>
//                   </tr>
//                 ) : (
//                   filtered.map((sale) => (
//                     <tr
//                       key={sale.id}
//                       className="hover:bg-pos-hover transition-colors"
//                     >
//                       <td className="px-4 py-3 font-mono text-xs text-blue-400 font-medium whitespace-nowrap">
//                         {sale.receiptNumber}
//                       </td>
//                       <td className="px-4 py-3 text-pos-muted text-xs whitespace-nowrap">
//                         {formatDate(sale.createdAt)}
//                       </td>
//                       <td className="px-4 py-3 text-pos-text">
//                         {sale.customerName ?? "—"}
//                       </td>
//                       <td className="px-4 py-3 text-pos-muted">
//                         {sale.items.length}
//                       </td>
//                       <td className="px-4 py-3">
//                         <Badge variant="muted">
//                           {sale.paymentMethod.toUpperCase()}
//                         </Badge>
//                       </td>
//                       <td className="px-4 py-3 font-semibold text-pos-text whitespace-nowrap">
//                         {formatCurrency(sale.total)}
//                       </td>
//                       <td className="px-4 py-3">
//                         <Badge
//                           variant={
//                             sale.status === "completed"
//                               ? "success"
//                               : sale.status === "refunded"
//                                 ? "warning"
//                                 : "danger"
//                           }
//                           dot
//                         >
//                           {sale.status}
//                         </Badge>
//                       </td>
//                       <td className="px-4 py-3 text-right">
//                         <button
//                           onClick={() => setViewing(sale)}
//                           className="p-1.5 rounded-lg text-pos-muted hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
//                           title="View Receipt Details"
//                         >
//                           <Eye size={15} />
//                         </button>
//                       </td>
//                     </tr>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       </div>

//       <Modal
//         open={!!viewing}
//         onClose={() => setViewing(null)}
//         title={`Receipt — ${viewing?.receiptNumber}`}
//         size="sm"
//         footer={
//           viewing?.status === "completed" ? (
//             isManager ? (
//               <Button
//                 variant="danger"
//                 icon={<RotateCcw size={15} />}
//                 onClick={() => viewing && handleRefund(viewing)}
//               >
//                 Process Refund
//               </Button>
//             ) : (
//               <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
//                 <ShieldAlert size={14} />
//                 <span>Manager role required for refunds</span>
//               </div>
//             )
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
//                 <div
//                   key={item.productId}
//                   className="flex justify-between text-xs sm:text-sm"
//                 >
//                   <span className="text-pos-muted">
//                     {item.productName} × {item.qty}
//                   </span>
//                   <span className="text-pos-text">
//                     {formatCurrency(item.total)}
//                   </span>
//                 </div>
//               ))}
//               <div className="border-t border-pos-border pt-2 space-y-1 text-xs sm:text-sm">
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

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  Eye,
  RotateCcw,
  FileSpreadsheet,
  FileText,
  ShieldAlert,
  Clock,
  Calendar,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/db/database";
import Header from "@/components/layout/Header";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { recordAuditLog, syncRecord } from "@/lib/sync";
import { formatCurrency, formatDate } from "@/utils/helpers";
import type { Sale } from "@/types";

/**
 * SalesHistory Component
 * Role-Based Access Rules:
 * - Manager: Can view up to 30 days (1 month) of sales history; can process refunds.
 * - Cashier: Can view only the last 24 hours of sales history; CANNOT process refunds.
 */
export default function SalesHistory() {
  // ---------------------------------------------------------------------------
  // Context & Hooks
  // ---------------------------------------------------------------------------
  const { outletSession } = useAuth();
  const outlet = outletSession?.outlet;
  const outletCurrency = outlet?.currency ?? "NGN";
  const { success, error } = useToast();

  // ---------------------------------------------------------------------------
  // Robust Role Extraction
  // Checks all common property patterns (case-insensitive) for staff/user role
  // ---------------------------------------------------------------------------
  const isManager = useMemo(() => {
    if (!outletSession) return false;

    const session = outletSession as Record<string, any>;
    const rawRole =
      session.role ||
      session.user?.role ||
      session.staff?.role ||
      session.currentStaff?.role ||
      session.activeUser?.role ||
      "";

    const normalizedRole = String(rawRole).trim().toLowerCase();

    // Includes manager, admin, or owner as management roles allowed to process refunds
    return (
      normalizedRole === "manager" ||
      normalizedRole === "admin" ||
      normalizedRole === "owner"
    );
  }, [outletSession]);

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState<Sale | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // ---------------------------------------------------------------------------
  // Data Loading
  // ---------------------------------------------------------------------------
  const load = async () => {
    if (!outlet?.id) return;

    const data = await db.sales
      .where("outletId")
      .equals(outlet.id)
      .reverse()
      .sortBy("createdAt");
    setSales(data);
  };

  useEffect(() => {
    load();
  }, [outlet?.id]);

  // ---------------------------------------------------------------------------
  // Role-Based Date Filtering Logic
  // ---------------------------------------------------------------------------
  const filtered = useMemo(() => {
    const now = Date.now();
    const twentyFourHoursAgo = new Date(
      now - 24 * 60 * 60 * 1000,
    ).toISOString();
    const thirtyDaysAgo = new Date(
      now - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    // Base time cutoff based on staff role
    const roleCutoff = isManager ? thirtyDaysAgo : twentyFourHoursAgo;

    return sales.filter((s) => {
      // 1. Enforce strict role boundary (Cashier: 24h | Manager: 30 days)
      if (s.createdAt < roleCutoff) {
        return false;
      }

      // 2. Search query match (Receipt # or Customer Name)
      const q = search.toLowerCase();
      const matchQ =
        !q ||
        s.receiptNumber.toLowerCase().includes(q) ||
        (s.customerName ?? "").toLowerCase().includes(q);

      // 3. User custom date picker filtering within allowed range
      const matchFrom = !dateFrom || s.createdAt >= dateFrom;
      const matchTo = !dateTo || s.createdAt <= dateTo + "T23:59:59";

      return matchQ && matchFrom && matchTo;
    });
  }, [sales, search, dateFrom, dateTo, isManager]);

  const totalRevenue = useMemo(() => {
    return filtered
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + s.total, 0);
  }, [filtered]);

  // ---------------------------------------------------------------------------
  // Document / Report Export Handlers
  // ---------------------------------------------------------------------------
  const handleExportCSV = () => {
    if (filtered.length === 0) return;

    const headers = [
      "Receipt #",
      "Date",
      "Customer",
      "Items Count",
      "Payment Method",
      "Total Amount",
      "Status",
    ];

    const rows = filtered.map((s) => [
      `"${s.receiptNumber}"`,
      `"${formatDate(s.createdAt)}"`,
      `"${s.customerName ?? "Walk-in"}"`,
      s.items.length,
      `"${s.paymentMethod.toUpperCase()}"`,
      s.total,
      `"${s.status}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `sales_history_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success("Sales report exported to CSV.");
  };

  const handleExportPDF = () => {
    if (filtered.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales History Report</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 24px; color: #1e293b; background: #fff; }
            h1 { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
            p.meta { color: #64748b; font-size: 12px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
            th { background-color: #f8fafc; font-weight: 600; color: #475569; text-transform: uppercase; font-size: 10px; }
            .right { text-align: right; }
            .mono { font-family: monospace; color: #2563eb; }
            .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
            .completed { background: #dcfce7; color: #166534; }
            .refunded { background: #fef3c7; color: #92400e; }
          </style>
        </head>
        <body>
          <h1>Sales History Report (${isManager ? "Manager View - 30 Days" : "Cashier View - 24 Hours"})</h1>
          <p class="meta">Outlet: ${outlet?.name || "Main Outlet"} | Generated: ${new Date().toLocaleString()} | Transactions: ${filtered.length} | Net Revenue: ${formatCurrency(totalRevenue, outletCurrency)}</p>
          <table>
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Payment</th>
                <th class="right">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filtered
                .map(
                  (s) => `
                <tr>
                  <td class="mono">${s.receiptNumber}</td>
                  <td>${formatDate(s.createdAt)}</td>
                  <td>${s.customerName ?? "Walk-in"}</td>
                  <td>${s.items.length}</td>
                  <td>${s.paymentMethod.toUpperCase()}</td>
                  <td class="right">${formatCurrency(s.total, outletCurrency)}</td>
                  <td><span class="badge ${s.status}">${s.status}</span></td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------
  const handleRefund = async (sale: Sale) => {
    // 1. Guard check: Restrict refunds strictly to manager role
    if (!isManager) {
      error("Refund denied: Manager permission is required.");
      return;
    }

    // 2. Prevent refunding non-completed transactions
    if (sale.status !== "completed") {
      error("Only completed transactions can be refunded.");
      return;
    }

    if (
      !confirm(`Are you sure you want to refund sale ${sale.receiptNumber}?`)
    ) {
      return;
    }

    try {
      // Update Sale Status
      await db.sales.update(sale.id, {
        status: "refunded",
        syncStatus: "pending",
      });

      const updatedSale = await db.sales.get(sale.id);
      if (updatedSale) await syncRecord("sales", updatedSale);

      await recordAuditLog({
        id: crypto.randomUUID(),
        outletId: outlet.id,
        action: "sale_refunded",
        actorId: outletSession?.staff?.id,
        actorName: outletSession?.staff?.name ?? "Unknown",
        actorRole: outletSession?.staff?.role,
        saleId: sale.id,
        receiptNumber: sale.receiptNumber,
        details: `Refunded ${formatCurrency(sale.total, outletCurrency)}`,
        createdAt: new Date().toISOString(),
        syncStatus: "pending",
      });

      // Restore Inventory Stock
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

      success(`Sale ${sale.receiptNumber} refunded and stock restored.`);
      setViewing(null);
      await load();
    } catch (err) {
      error("Failed to process refund. Please try again.");
    }
  };

  // ---------------------------------------------------------------------------
  // View Rendering
  // ---------------------------------------------------------------------------
  return (
    <div className="w-full min-h-screen">
      <Header
        title="Sales History"
        subtitle={`${filtered.length} transactions · ${formatCurrency(totalRevenue, outletCurrency)} revenue`}
      />

      <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
        {/* Role Access Scope Alert Banner */}
        {isManager ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-400 font-medium">
            <Calendar size={14} />
            <span>
              Manager Mode: Displaying sales history for the last 30 days.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-500 font-medium">
            <Clock size={14} />
            <span>
              Cashier Mode: Displaying sales from the last 24 hours only. Refund
              controls disabled.
            </span>
          </div>
        )}

        {/* Search & Export Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center w-full md:w-auto">
            <Input
              placeholder="Search receipt or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={15} />}
              className="w-full sm:w-64"
            />
            <div className="flex flex-row gap-2 w-full sm:w-auto">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-1/2 sm:w-40"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-1/2 sm:w-40"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="secondary"
              icon={<FileSpreadsheet size={15} />}
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none justify-center text-xs"
            >
              Export CSV
            </Button>
            <Button
              variant="secondary"
              icon={<FileText size={15} />}
              onClick={handleExportPDF}
              className="flex-1 sm:flex-none justify-center text-xs"
            >
              Export PDF
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-pos-card border border-pos-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm min-w-175">
              <thead>
                <tr className="border-b border-pos-border bg-pos-bg/40">
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
                      No sales found within the permitted timeframe.
                    </td>
                  </tr>
                ) : (
                  filtered.map((sale) => (
                    <tr
                      key={sale.id}
                      className="hover:bg-pos-hover transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-blue-400 font-medium whitespace-nowrap">
                        {sale.receiptNumber}
                      </td>
                      <td className="px-4 py-3 text-pos-muted text-xs whitespace-nowrap">
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
                      <td className="px-4 py-3 font-semibold text-pos-text whitespace-nowrap">
                        {formatCurrency(sale.total, outletCurrency)}
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
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setViewing(sale)}
                          className="p-1.5 rounded-lg text-pos-muted hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="View Receipt Details"
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
      </div>

      {/* Modal Details View */}
      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={`Receipt — ${viewing?.receiptNumber}`}
        size="sm"
        footer={
          viewing?.status === "completed" ? (
            isManager ? (
              <Button
                variant="danger"
                icon={<RotateCcw size={15} />}
                onClick={() => viewing && handleRefund(viewing)}
              >
                Process Refund
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
                <ShieldAlert size={14} />
                <span>Manager role required to issue refunds</span>
              </div>
            )
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
                <div
                  key={item.productId}
                  className="flex justify-between text-xs sm:text-sm"
                >
                  <span className="text-pos-muted">
                    {item.productName} × {item.qty}
                  </span>
                  <span className="text-pos-text">
                    {formatCurrency(item.total, outletCurrency)}
                  </span>
                </div>
              ))}

              <div className="border-t border-pos-border pt-2 space-y-1 text-xs sm:text-sm">
                {viewing.discountAmount > 0 && (
                  <div className="flex justify-between text-red-400">
                    <span>Discount</span>
                    <span>
                      -{formatCurrency(viewing.discountAmount, outletCurrency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-pos-muted">
                  <span>Tax</span>
                  <span>
                    {formatCurrency(viewing.taxAmount, outletCurrency)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-pos-text">
                  <span>Total</span>
                  <span>{formatCurrency(viewing.total, outletCurrency)}</span>
                </div>
                {viewing.paymentMethod === "cash" && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Change</span>
                    <span>
                      {formatCurrency(viewing.change, outletCurrency)}
                    </span>
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
