// import { useEffect, useState } from "react";
// import { BarChart2, TrendingUp } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { db } from "@/db/database";
// import Header from "@/components/layout/Header";
// import { StatCard } from "@/components/ui/Card";
// import { formatCurrency, getMonthStart, getTodayStart } from "@/utils/helpers";
// import type { Sale, Outlet } from "@/types";

// export default function MerchantReports() {
//   const { merchantSession } = useAuth();
//   const merchant = merchantSession!.merchant;
//   const [outlets, setOutlets] = useState<Outlet[]>([]);
//   const [sales, setSales] = useState<Sale[]>([]);
//   const [_loading, setLoading] = useState(true);

//   useEffect(() => {
//     const load = async () => {
//       const outs = await db.outlets.where("merchantId").equals(merchant.id).toArray();
//       setOutlets(outs);
//       const outletIds = outs.map((o) => o.id);
//       const monthStart = getMonthStart();
//       let allSales: Sale[] = [];
//       for (const oid of outletIds) {
//         const s = await db.sales
//           .where("outletId")
//           .equals(oid)
//           .filter((s) => s.createdAt >= monthStart && s.status === "completed")
//           .toArray();
//         allSales = [...allSales, ...s];
//       }
//       allSales.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
//       setSales(allSales);
//       setLoading(false);
//     };
//     load();
//   }, [merchant.id]);

//   const todayStart = getTodayStart();
//   const todaySales = sales.filter((s) => s.createdAt >= todayStart);
//   const monthRevenue = sales.reduce((sum, s) => sum + s.total, 0);
//   const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
//   const avgOrderValue = sales.length > 0 ? monthRevenue / sales.length : 0;

//   const outletRevenue = outlets.map((o) => ({
//     outlet: o,
//     revenue: sales.filter((s) => s.outletId === o.id).reduce((sum, s) => sum + s.total, 0),
//     count: sales.filter((s) => s.outletId === o.id).length,
//   })).sort((a, b) => b.revenue - a.revenue);

//   return (
//     <div>
//       <Header title="Reports" subtitle="Business performance overview" />
//       <div className="p-6 space-y-6">
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//           <StatCard label="Today's Revenue" value={formatCurrency(todayRevenue)} icon={<TrendingUp size={20} />} iconColor="text-emerald-400" />
//           <StatCard label="Today's Sales" value={todaySales.length.toString()} icon={<BarChart2 size={20} />} iconColor="text-blue-400" />
//           <StatCard label="Monthly Revenue" value={formatCurrency(monthRevenue)} icon={<TrendingUp size={20} />} iconColor="text-violet-400" />
//           <StatCard label="Avg Order Value" value={formatCurrency(avgOrderValue)} icon={<BarChart2 size={20} />} iconColor="text-amber-400" />
//         </div>

//         <div className="bg-pos-card border border-pos-border rounded-xl">
//           <div className="px-6 py-4 border-b border-pos-border">
//             <h3 className="font-semibold text-pos-text">Revenue by Outlet (This Month)</h3>
//           </div>
//           {outletRevenue.length === 0 ? (
//             <div className="py-12 text-center text-pos-muted text-sm">No sales data yet.</div>
//           ) : (
//             <div className="divide-y divide-pos-border">
//               {outletRevenue.map(({ outlet, revenue, count }) => {
//                 const pct = monthRevenue > 0 ? (revenue / monthRevenue) * 100 : 0;
//                 return (
//                   <div key={outlet.id} className="px-6 py-4">
//                     <div className="flex items-center justify-between mb-2">
//                       <p className="text-sm font-medium text-pos-text">{outlet.name}</p>
//                       <div className="text-right">
//                         <p className="text-sm font-semibold text-pos-text">{formatCurrency(revenue)}</p>
//                         <p className="text-xs text-pos-muted">{count} sales</p>
//                       </div>
//                     </div>
//                     <div className="h-1.5 bg-pos-bg rounded-full overflow-hidden">
//                       <div
//                         className="h-full bg-blue-500 rounded-full transition-all duration-500"
//                         style={{ width: `${pct}%` }}
//                       />
//                     </div>
//                     <p className="text-xs text-pos-muted mt-1">{pct.toFixed(1)}% of total revenue</p>
//                   </div>
//                 );
//               })}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { BarChart2, TrendingUp } from "lucide-react";
// Kept relative if context lives strictly parallel or nested under shared components directory
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import { StatCard } from "@/components/ui/Card";
import type { Sale, Outlet } from "@/types";

// Fixed: Replaced relative paths with global @/ alias pointers
import { db } from "@/db/database";
import { formatCurrency, getMonthStart, getTodayStart } from "@/utils/helpers";

export default function MerchantReports() {
  const { merchantSession } = useAuth();
  const merchant = merchantSession!.merchant;
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const outs = await db.outlets
        .where("merchantId")
        .equals(merchant.id)
        .toArray();
      setOutlets(outs);
      const outletIds = outs.map((o) => o.id);
      const monthStart = getMonthStart();
      let allSales: Sale[] = [];
      for (const oid of outletIds) {
        const s = await db.sales
          .where("outletId")
          .equals(oid)
          .filter((s) => s.createdAt >= monthStart && s.status === "completed")
          .toArray();
        allSales = [...allSales, ...s];
      }
      allSales.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setSales(allSales);
      setLoading(false);
    };
    load();
  }, [merchant.id]);

  const todayStart = getTodayStart();
  const todaySales = sales.filter((s) => s.createdAt >= todayStart);
  const monthRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const avgOrderValue = sales.length > 0 ? monthRevenue / sales.length : 0;

  const outletRevenue = outlets
    .map((o) => ({
      outlet: o,
      revenue: sales
        .filter((s) => s.outletId === o.id)
        .reduce((sum, s) => sum + s.total, 0),
      count: sales.filter((s) => s.outletId === o.id).length,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div>
      <Header title="Reports" subtitle="Business performance overview" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Today's Revenue"
            value={formatCurrency(todayRevenue)}
            icon={<TrendingUp size={20} />}
            iconColor="text-emerald-400"
          />
          <StatCard
            label="Today's Sales"
            value={todaySales.length.toString()}
            icon={<BarChart2 size={20} />}
            iconColor="text-blue-400"
          />
          <StatCard
            label="Monthly Revenue"
            value={formatCurrency(monthRevenue)}
            icon={<TrendingUp size={20} />}
            iconColor="text-violet-400"
          />
          <StatCard
            label="Avg Order Value"
            value={formatCurrency(avgOrderValue)}
            icon={<BarChart2 size={20} />}
            iconColor="text-amber-400"
          />
        </div>

        <div className="bg-pos-card border border-pos-border rounded-xl">
          <div className="px-6 py-4 border-b border-pos-border">
            <h3 className="font-semibold text-pos-text">
              Revenue by Outlet (This Month)
            </h3>
          </div>
          {outletRevenue.length === 0 ? (
            <div className="py-12 text-center text-pos-muted text-sm">
              No sales data yet.
            </div>
          ) : (
            <div className="divide-y divide-pos-border">
              {outletRevenue.map(({ outlet, revenue, count }) => {
                const pct =
                  monthRevenue > 0 ? (revenue / monthRevenue) * 100 : 0;
                return (
                  <div key={outlet.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-pos-text">
                        {outlet.name}
                      </p>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-pos-text">
                          {formatCurrency(revenue)}
                        </p>
                        <p className="text-xs text-pos-muted">{count} sales</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-pos-bg rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-pos-muted mt-1">
                      {pct.toFixed(1)}% of total revenue
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
