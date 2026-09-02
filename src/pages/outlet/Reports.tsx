// import { useEffect, useState } from "react";
// import { BarChart2, TrendingUp, TrendingDown } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { db } from "@/db/database";
// import Header from "@/components/layout/Header";
// import { StatCard } from "@/components/ui/Card";
// import { formatCurrency, getTodayStart, getMonthStart } from "@/utils/helpers";
// import type { Sale, Expense } from "@/types";

// export default function OutletReports() {
//   const { outletSession } = useAuth();
//   const outlet = outletSession!.outlet;
//   const [sales, setSales] = useState<Sale[]>([]);
//   const [expenses, setExpenses] = useState<Expense[]>([]);

//   useEffect(() => {
//     const load = async () => {
//       const monthStart = getMonthStart();
//       const [s, e] = await Promise.all([
//         db.sales
//           .where("outletId")
//           .equals(outlet.id)
//           .filter((s) => s.createdAt >= monthStart && s.status === "completed")
//           .toArray(),
//         db.expenses
//           .where("outletId")
//           .equals(outlet.id)
//           .filter((e) => e.date >= monthStart.split("T")[0])
//           .toArray(),
//       ]);
//       setSales(s);
//       setExpenses(e);
//     };
//     load();
//   }, [outlet.id]);

//   const todayStart = getTodayStart();
//   const todaySales = sales.filter((s) => s.createdAt >= todayStart);
//   const monthRevenue = sales.reduce((s, r) => s + r.total, 0);
//   const todayRevenue = todaySales.reduce((s, r) => s + r.total, 0);
//   const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
//   const netProfit = monthRevenue - totalExpenses;

//   const topProducts = sales
//     .flatMap((s) => s.items)
//     .reduce(
//       (acc, item) => {
//         const existing = acc.find((x) => x.productId === item.productId);
//         if (existing) {
//           existing.qty += item.qty;
//           existing.revenue += item.total;
//         } else
//           acc.push({
//             productId: item.productId,
//             name: item.productName,
//             qty: item.qty,
//             revenue: item.total,
//           });
//         return acc;
//       },
//       [] as { productId: string; name: string; qty: number; revenue: number }[],
//     )
//     .sort((a, b) => b.revenue - a.revenue)
//     .slice(0, 5);

//   const paymentBreakdown = sales.reduce(
//     (acc, s) => {
//       acc[s.paymentMethod] = (acc[s.paymentMethod] ?? 0) + s.total;
//       return acc;
//     },
//     {} as Record<string, number>,
//   );

//   return (
//     <div>
//       <Header title="Reports" subtitle="Outlet performance — current month" />
//       <div className="p-6 space-y-6">
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//           <StatCard
//             label="Today's Revenue"
//             value={formatCurrency(todayRevenue)}
//             icon={<TrendingUp size={20} />}
//             iconColor="text-emerald-400"
//           />
//           <StatCard
//             label="Monthly Revenue"
//             value={formatCurrency(monthRevenue)}
//             icon={<BarChart2 size={20} />}
//             iconColor="text-blue-400"
//           />
//           <StatCard
//             label="Monthly Expenses"
//             value={formatCurrency(totalExpenses)}
//             icon={<TrendingDown size={20} />}
//             iconColor="text-red-400"
//           />
//           <StatCard
//             label="Net Profit"
//             value={formatCurrency(netProfit)}
//             icon={<TrendingUp size={20} />}
//             iconColor={netProfit >= 0 ? "text-emerald-400" : "text-red-400"}
//           />
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           <div className="bg-pos-card border border-pos-border rounded-xl">
//             <div className="px-6 py-4 border-b border-pos-border">
//               <h3 className="font-semibold text-pos-text">
//                 Top Selling Products
//               </h3>
//             </div>
//             {topProducts.length === 0 ? (
//               <div className="py-8 text-center text-pos-muted text-sm">
//                 No sales data yet.
//               </div>
//             ) : (
//               <div className="divide-y divide-pos-border">
//                 {topProducts.map((p, idx) => (
//                   <div
//                     key={p.productId}
//                     className="px-6 py-3.5 flex items-center gap-3"
//                   >
//                     <span className="w-6 h-6 rounded-full bg-pos-bg border border-pos-border flex items-center justify-center text-xs font-bold text-pos-muted shrink-0">
//                       {idx + 1}
//                     </span>
//                     <div className="flex-1">
//                       <p className="text-sm font-medium text-pos-text">
//                         {p.name}
//                       </p>
//                       <p className="text-xs text-pos-muted">
//                         {p.qty} units sold
//                       </p>
//                     </div>
//                     <p className="text-sm font-semibold text-pos-text">
//                       {formatCurrency(p.revenue)}
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           <div className="bg-pos-card border border-pos-border rounded-xl">
//             <div className="px-6 py-4 border-b border-pos-border">
//               <h3 className="font-semibold text-pos-text">Payment Methods</h3>
//             </div>
//             <div className="divide-y divide-pos-border">
//               {Object.entries(paymentBreakdown).length === 0 ? (
//                 <div className="py-8 text-center text-pos-muted text-sm">
//                   No data yet.
//                 </div>
//               ) : (
//                 Object.entries(paymentBreakdown).map(([method, amount]) => {
//                   const pct =
//                     monthRevenue > 0 ? (amount / monthRevenue) * 100 : 0;
//                   return (
//                     <div key={method} className="px-6 py-4">
//                       <div className="flex justify-between mb-1.5">
//                         <p className="text-sm font-medium text-pos-text uppercase">
//                           {method}
//                         </p>
//                         <p className="text-sm font-semibold text-pos-text">
//                           {formatCurrency(amount)}
//                         </p>
//                       </div>
//                       <div className="h-1.5 bg-pos-bg rounded-full overflow-hidden">
//                         <div
//                           className="h-full bg-blue-500 rounded-full"
//                           style={{ width: `${pct}%` }}
//                         />
//                       </div>
//                       <p className="text-xs text-pos-muted mt-1">
//                         {pct.toFixed(1)}%
//                       </p>
//                     </div>
//                   );
//                 })
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// import { useEffect, useState } from "react";
// import { BarChart2, TrendingUp, TrendingDown } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { db } from "@/db/database";
// import Header from "@/components/layout/Header";
// import { StatCard } from "@/components/ui/Card";
// import { formatCurrency, getTodayStart, getMonthStart } from "@/utils/helpers";
// import type { Sale, Expense } from "@/types";

// export default function OutletReports() {
//   // Retrieve authenticated outlet session details
//   const { outletSession } = useAuth();
//   const outlet = outletSession!.outlet;

//   // Local state for fetched monthly sales and expenses records
//   const [sales, setSales] = useState<Sale[]>([]);
//   const [expenses, setExpenses] = useState<Expense[]>([]);

//   // Query database on component mount or when outlet ID changes
//   useEffect(() => {
//     const load = async () => {
//       const monthStart = getMonthStart();
//       // Execute parallel queries for sales and expenses starting from the current month
//       const [s, e] = await Promise.all([
//         db.sales
//           .where("outletId")
//           .equals(outlet.id)
//           .filter((s) => s.createdAt >= monthStart && s.status === "completed")
//           .toArray(),
//         db.expenses
//           .where("outletId")
//           .equals(outlet.id)
//           .filter((e) => e.date >= monthStart.split("T")[0])
//           .toArray(),
//       ]);
//       setSales(s);
//       setExpenses(e);
//     };
//     load();
//   }, [outlet.id]);

//   // Compute key financial metrics (Revenue, Expenses, Net Profit)
//   const todayStart = getTodayStart();
//   const todaySales = sales.filter((s) => s.createdAt >= todayStart);
//   const monthRevenue = sales.reduce((s, r) => s + r.total, 0);
//   const todayRevenue = todaySales.reduce((s, r) => s + r.total, 0);
//   const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
//   const netProfit = monthRevenue - totalExpenses;

//   // Aggregate line items from all completed sales to calculate top 5 products by revenue
//   const topProducts = sales
//     .flatMap((s) => s.items)
//     .reduce(
//       (acc, item) => {
//         const existing = acc.find((x) => x.productId === item.productId);
//         if (existing) {
//           existing.qty += item.qty;
//           existing.revenue += item.total;
//         } else
//           acc.push({
//             productId: item.productId,
//             name: item.productName,
//             qty: item.qty,
//             revenue: item.total,
//           });
//         return acc;
//       },
//       [] as { productId: string; name: string; qty: number; revenue: number }[],
//     )
//     .sort((a, b) => b.revenue - a.revenue)
//     .slice(0, 5);

//   // Group monthly revenue totals by payment method (e.g., cash, card, transfer)
//   const paymentBreakdown = sales.reduce(
//     (acc, s) => {
//       acc[s.paymentMethod] = (acc[s.paymentMethod] ?? 0) + s.total;
//       return acc;
//     },
//     {} as Record<string, number>,
//   );

//   return (
//     <div>
//       {/* Top Navigation Header */}
//       <Header title="Reports" subtitle="Outlet performance — current month" />

//       <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
//         {/* Key Metrics Grid (1 col on mobile, 2 cols on tablet, 4 cols on laptop/desktop) */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
//           <StatCard
//             label="Today's Revenue"
//             value={formatCurrency(todayRevenue)}
//             icon={<TrendingUp size={20} />}
//             iconColor="text-emerald-400"
//           />
//           <StatCard
//             label="Monthly Revenue"
//             value={formatCurrency(monthRevenue)}
//             icon={<BarChart2 size={20} />}
//             iconColor="text-blue-400"
//           />
//           <StatCard
//             label="Monthly Expenses"
//             value={formatCurrency(totalExpenses)}
//             icon={<TrendingDown size={20} />}
//             iconColor="text-red-400"
//           />
//           <StatCard
//             label="Net Profit"
//             value={formatCurrency(netProfit)}
//             icon={<TrendingUp size={20} />}
//             iconColor={netProfit >= 0 ? "text-emerald-400" : "text-red-400"}
//           />
//         </div>

//         {/* Breakdown Section Grid (1 col on mobile/tablet, 2 cols on laptop/desktop) */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
//           {/* Top Selling Products List */}
//           <div className="bg-pos-card border border-pos-border rounded-xl">
//             <div className="px-4 sm:px-6 py-4 border-b border-pos-border">
//               <h3 className="font-semibold text-pos-text">
//                 Top Selling Products
//               </h3>
//             </div>
//             {topProducts.length === 0 ? (
//               <div className="py-8 text-center text-pos-muted text-sm">
//                 No sales data yet.
//               </div>
//             ) : (
//               <div className="divide-y divide-pos-border">
//                 {topProducts.map((p, idx) => (
//                   <div
//                     key={p.productId}
//                     className="px-4 sm:px-6 py-3.5 flex items-center gap-3"
//                   >
//                     {/* Ranking Index Badge */}
//                     <span className="w-6 h-6 rounded-full bg-pos-bg border border-pos-border flex items-center justify-center text-xs font-bold text-pos-muted shrink-0">
//                       {idx + 1}
//                     </span>
//                     <div className="flex-1 min-w-0">
//                       <p className="text-sm font-medium text-pos-text truncate">
//                         {p.name}
//                       </p>
//                       <p className="text-xs text-pos-muted">
//                         {p.qty} units sold
//                       </p>
//                     </div>
//                     <p className="text-sm font-semibold text-pos-text shrink-0">
//                       {formatCurrency(p.revenue)}
//                     </p>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Payment Methods Breakdown Card */}
//           <div className="bg-pos-card border border-pos-border rounded-xl">
//             <div className="px-4 sm:px-6 py-4 border-b border-pos-border">
//               <h3 className="font-semibold text-pos-text">Payment Methods</h3>
//             </div>
//             <div className="divide-y divide-pos-border">
//               {Object.entries(paymentBreakdown).length === 0 ? (
//                 <div className="py-8 text-center text-pos-muted text-sm">
//                   No data yet.
//                 </div>
//               ) : (
//                 Object.entries(paymentBreakdown).map(([method, amount]) => {
//                   // Calculate percentage share of total revenue
//                   const pct =
//                     monthRevenue > 0 ? (amount / monthRevenue) * 100 : 0;
//                   return (
//                     <div key={method} className="px-4 sm:px-6 py-4">
//                       <div className="flex justify-between mb-1.5 gap-2">
//                         <p className="text-sm font-medium text-pos-text uppercase truncate">
//                           {method}
//                         </p>
//                         <p className="text-sm font-semibold text-pos-text shrink-0">
//                           {formatCurrency(amount)}
//                         </p>
//                       </div>
//                       {/* Visual progress bar reflecting percentage */}
//                       <div className="h-1.5 bg-pos-bg rounded-full overflow-hidden">
//                         <div
//                           className="h-full bg-blue-500 rounded-full"
//                           style={{ width: `${pct}%` }}
//                         />
//                       </div>
//                       <p className="text-xs text-pos-muted mt-1">
//                         {pct.toFixed(1)}%
//                       </p>
//                     </div>
//                   );
//                 })
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { BarChart2, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/db/database";
import Header from "@/components/layout/Header";
import { StatCard } from "@/components/ui/Card";
import { formatCurrency, getTodayStart, getMonthStart } from "@/utils/helpers";
import type { Sale, Expense } from "@/types";

export default function OutletReports() {
  // Retrieve authenticated outlet session and user details
  const { outletSession } = useAuth();
  const outlet = outletSession!.outlet;
  const outletCurrency = outlet.currency ?? "NGN";

  // Determine user role and whether cashier masking should apply
  const role = outletSession?.staff?.role ?? "cashier"; // Default to "cashier" if role is undefined
  const isCashier = role === "cashier";

  // Local state for fetched monthly sales and expenses records
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Query database on component mount or when outlet ID changes
  useEffect(() => {
    const load = async () => {
      const monthStart = getMonthStart();
      // Execute parallel queries for sales and expenses starting from the current month
      const [s, e] = await Promise.all([
        db.sales
          .where("outletId")
          .equals(outlet.id)
          .filter((s) => s.createdAt >= monthStart && s.status === "completed")
          .toArray(),
        db.expenses
          .where("outletId")
          .equals(outlet.id)
          .filter((e) => e.date >= monthStart.split("T")[0])
          .toArray(),
      ]);
      setSales(s);
      setExpenses(e);
    };
    load();
  }, [outlet.id]);

  // Compute key financial metrics (Revenue, Expenses, Net Profit)
  const todayStart = getTodayStart();
  const todaySales = sales.filter((s) => s.createdAt >= todayStart);
  const monthRevenue = sales.reduce((s, r) => s + r.total, 0);
  const todayRevenue = todaySales.reduce((s, r) => s + r.total, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = monthRevenue - totalExpenses;

  // Aggregate line items from all completed sales to calculate top 5 products by revenue
  const topProducts = sales
    .flatMap((s) => s.items)
    .reduce(
      (acc, item) => {
        const existing = acc.find((x) => x.productId === item.productId);
        if (existing) {
          existing.qty += item.qty;
          existing.revenue += item.total;
        } else
          acc.push({
            productId: item.productId,
            name: item.productName,
            qty: item.qty,
            revenue: item.total,
          });
        return acc;
      },
      [] as { productId: string; name: string; qty: number; revenue: number }[],
    )
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Group monthly revenue totals by payment method (e.g., cash, card, transfer)
  const paymentBreakdown = sales.reduce(
    (acc, s) => {
      acc[s.paymentMethod] = (acc[s.paymentMethod] ?? 0) + s.total;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div>
      {/* Top Navigation Header */}
      <Header title="Reports" subtitle="Outlet performance — current month" />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Key Metrics Grid (1 col on mobile, 2 cols on tablet, 4 cols on laptop/desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <StatCard
            label="Today's Revenue"
            value={
              isCashier
                ? "******"
                : formatCurrency(todayRevenue, outletCurrency)
            }
            icon={<TrendingUp size={20} />}
            iconColor="text-emerald-400"
          />
          <StatCard
            label="Monthly Revenue"
            value={
              isCashier
                ? "******"
                : formatCurrency(monthRevenue, outletCurrency)
            }
            icon={<BarChart2 size={20} />}
            iconColor="text-blue-400"
          />
          <StatCard
            label="Monthly Expenses"
            value={formatCurrency(totalExpenses, outletCurrency)}
            icon={<TrendingDown size={20} />}
            iconColor="text-red-400"
          />
          <StatCard
            label="Net Profit"
            value={
              isCashier ? "******" : formatCurrency(netProfit, outletCurrency)
            }
            icon={<TrendingUp size={20} />}
            iconColor={netProfit >= 0 ? "text-emerald-400" : "text-red-400"}
          />
        </div>

        {/* Breakdown Section Grid (1 col on mobile/tablet, 2 cols on laptop/desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Top Selling Products List */}
          <div className="bg-pos-card border border-pos-border rounded-xl">
            <div className="px-4 sm:px-6 py-4 border-b border-pos-border">
              <h3 className="font-semibold text-pos-text">
                Top Selling Products
              </h3>
            </div>
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-pos-muted text-sm">
                No sales data yet.
              </div>
            ) : (
              <div className="divide-y divide-pos-border">
                {topProducts.map((p, idx) => (
                  <div
                    key={p.productId}
                    className="px-4 sm:px-6 py-3.5 flex items-center gap-3"
                  >
                    {/* Ranking Index Badge */}
                    <span className="w-6 h-6 rounded-full bg-pos-bg border border-pos-border flex items-center justify-center text-xs font-bold text-pos-muted shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-pos-text truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-pos-muted">
                        {p.qty} units sold
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-pos-text shrink-0">
                      {formatCurrency(p.revenue, outletCurrency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Methods Breakdown Card */}
          <div className="bg-pos-card border border-pos-border rounded-xl">
            <div className="px-4 sm:px-6 py-4 border-b border-pos-border">
              <h3 className="font-semibold text-pos-text">Payment Methods</h3>
            </div>
            <div className="divide-y divide-pos-border">
              {Object.entries(paymentBreakdown).length === 0 ? (
                <div className="py-8 text-center text-pos-muted text-sm">
                  No data yet.
                </div>
              ) : (
                Object.entries(paymentBreakdown).map(([method, amount]) => {
                  // Calculate percentage share of total revenue
                  const pct =
                    monthRevenue > 0 ? (amount / monthRevenue) * 100 : 0;
                  return (
                    <div key={method} className="px-4 sm:px-6 py-4">
                      <div className="flex justify-between mb-1.5 gap-2">
                        <p className="text-sm font-medium text-pos-text uppercase truncate">
                          {method}
                        </p>
                        <p className="text-sm font-semibold text-pos-text shrink-0">
                          {formatCurrency(amount, outletCurrency)}
                        </p>
                      </div>
                      {/* Visual progress bar reflecting percentage */}
                      <div className="h-1.5 bg-pos-bg rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-pos-muted mt-1">
                        {pct.toFixed(1)}%
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
