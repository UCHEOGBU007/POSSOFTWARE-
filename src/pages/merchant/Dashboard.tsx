// import { useEffect, useState } from "react";
// import {
//   Store,
//   TrendingUp,
//   Package,
//   Users,
//   AlertCircle,
//   ArrowRight,
// } from "lucide-react";
// import { Link } from "react-router-dom";
// import { useAuth } from "@/contexts/AuthContext";
// import { db } from "@/db/database";
// import Header from "@/components/layout/Header";
// import { StatCard } from "@/components/ui/Card";
// import Badge from "@/components/ui/Badge";
// import {
//   formatCurrency,
//   formatDateShort,
//   getTodayStart,
// } from "@/utils/helpers";
// import type { Outlet, Sale } from "@/types";
// import { TIER_LIMITS } from "@/types";

// export default function MerchantDashboard() {
//   const { merchantSession } = useAuth();
//   const merchant = merchantSession!.merchant;
//   const [outlets, setOutlets] = useState<Outlet[]>([]);
//   const [recentSales, setRecentSales] = useState<Sale[]>([]);
//   const [todayRevenue, setTodayRevenue] = useState(0);
//   const [totalProducts, setTotalProducts] = useState(0);
//   const [totalCustomers, setTotalCustomers] = useState(0);

//   useEffect(() => {
//     const load = async () => {
//       const outs = await db.outlets
//         .where("merchantId")
//         .equals(merchant.id)
//         .toArray();
//       setOutlets(outs);
//       const outletIds = outs.map((o) => o.id);
//       const todayStart = getTodayStart();
//       let revenue = 0;
//       let sales: Sale[] = [];
//       for (const oid of outletIds) {
//         const os = await db.sales
//           .where("outletId")
//           .equals(oid)
//           .filter((s) => s.createdAt >= todayStart && s.status === "completed")
//           .toArray();
//         revenue += os.reduce((s, r) => s + r.total, 0);
//         sales = [...sales, ...os];
//       }
//       sales.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
//       setRecentSales(sales.slice(0, 5));
//       setTodayRevenue(revenue);
//       const prods = await db.products
//         .where("outletId")
//         .anyOf(outletIds)
//         .count();
//       setTotalProducts(prods);
//       const custs = await db.customers
//         .where("outletId")
//         .anyOf(outletIds)
//         .count();
//       setTotalCustomers(custs);
//     };
//     load();
//   }, [merchant.id]);

//   const tierLimit = TIER_LIMITS[merchant.tier];
//   const isExpiringSoon =
//     new Date(merchant.subscriptionExpiry) <
//     new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

//   return (
//     <div>
//       <Header
//         title={`Welcome back, ${merchant.ownerName.split(" ")[0]}`}
//         subtitle={`${merchant.businessName} — ${tierLimit.name} Plan`}
//       />
//       <div className="p-6 space-y-6">
//         {isExpiringSoon && (
//           <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
//             <AlertCircle size={18} className="shrink-0" />
//             <p>
//               Your subscription expires on{" "}
//               <strong>{formatDateShort(merchant.subscriptionExpiry)}</strong>.{" "}
//               <Link to="/merchant/billing" className="underline font-medium">
//                 Renew now
//               </Link>{" "}
//               to avoid service interruption.
//             </p>
//           </div>
//         )}

//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//           <StatCard
//             label="Today's Revenue"
//             value={formatCurrency(todayRevenue)}
//             icon={<TrendingUp size={20} />}
//             iconColor="text-emerald-400"
//           />
//           <StatCard
//             label="Active Outlets"
//             value={`${outlets.filter((o) => o.isActive).length} / ${tierLimit.maxOutlets}`}
//             icon={<Store size={20} />}
//             iconColor="text-blue-400"
//           />
//           <StatCard
//             label="Total Products"
//             value={totalProducts.toLocaleString()}
//             icon={<Package size={20} />}
//             iconColor="text-violet-400"
//           />
//           <StatCard
//             label="Total Customers"
//             value={totalCustomers.toLocaleString()}
//             icon={<Users size={20} />}
//             iconColor="text-amber-400"
//           />
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           <div className="lg:col-span-2 bg-pos-card border border-pos-border rounded-xl">
//             <div className="flex items-center justify-between px-6 py-4 border-b border-pos-border">
//               <h3 className="font-semibold text-pos-text">
//                 Recent Transactions
//               </h3>
//               <Link
//                 to="/merchant/reports"
//                 className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
//               >
//                 View all <ArrowRight size={12} />
//               </Link>
//             </div>
//             {recentSales.length === 0 ? (
//               <div className="py-12 text-center text-pos-muted text-sm">
//                 No sales recorded today.
//               </div>
//             ) : (
//               <div className="divide-y divide-pos-border">
//                 {recentSales.map((sale) => (
//                   <div
//                     key={sale.id}
//                     className="px-6 py-3.5 flex items-center justify-between"
//                   >
//                     <div>
//                       <p className="text-sm font-medium text-pos-text">
//                         {sale.receiptNumber}
//                       </p>
//                       <p className="text-xs text-pos-muted">
//                         {sale.items.length} item
//                         {sale.items.length !== 1 ? "s" : ""} ·{" "}
//                         {formatDateShort(sale.createdAt)}
//                       </p>
//                     </div>
//                     <div className="text-right">
//                       <p className="text-sm font-semibold text-pos-text">
//                         {formatCurrency(sale.total)}
//                       </p>
//                       <Badge
//                         variant={
//                           sale.status === "completed" ? "success" : "danger"
//                         }
//                       >
//                         {sale.status}
//                       </Badge>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>

//           <div className="bg-pos-card border border-pos-border rounded-xl">
//             <div className="px-6 py-4 border-b border-pos-border">
//               <h3 className="font-semibold text-pos-text">Your Outlets</h3>
//             </div>
//             <div className="divide-y divide-pos-border">
//               {outlets.length === 0 ? (
//                 <div className="py-8 text-center">
//                   <p className="text-pos-muted text-sm mb-3">No outlets yet.</p>
//                   <Link
//                     to="/merchant/outlets"
//                     className="text-blue-400 text-sm hover:text-blue-300"
//                   >
//                     + Create outlet
//                   </Link>
//                 </div>
//               ) : (
//                 outlets.map((outlet) => (
//                   <div
//                     key={outlet.id}
//                     className="px-6 py-3.5 flex items-center justify-between"
//                   >
//                     <div>
//                       <p className="text-sm font-medium text-pos-text">
//                         {outlet.name}
//                       </p>
//                       <p className="text-xs text-pos-muted truncate max-w-35">
//                         {outlet.address}
//                       </p>
//                     </div>
//                     <Badge variant={outlet.isActive ? "success" : "muted"} dot>
//                       {outlet.isActive ? "Active" : "Inactive"}
//                     </Badge>
//                   </div>
//                 ))
//               )}
//             </div>
//             <div className="px-6 py-3 border-t border-pos-border">
//               <Link
//                 to="/merchant/outlets"
//                 className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
//               >
//                 Manage outlets <ArrowRight size={12} />
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState, useMemo } from "react";
import {
  Store,
  TrendingUp,
  Package,
  Users,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/db/database";
import Header from "@/components/layout/Header";
import { StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import {
  formatCurrency,
  formatDateShort,
  getTodayStart,
} from "@/utils/helpers";
import type { Outlet, Sale } from "@/types";
import { TIER_LIMITS } from "@/types";

export default function MerchantDashboard() {
  const { merchantSession } = useAuth();
  const merchant = merchantSession?.merchant;

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!merchant?.id) return;

    let isMounted = true;

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // 1. Fetch all outlets for this merchant in a single query
        const outs = await db.outlets
          .where("merchantId")
          .equals(merchant.id)
          .toArray();

        if (!isMounted) return;
        setOutlets(outs);

        const outletIds = outs.map((o) => o.id);

        if (outletIds.length === 0) {
          setRecentSales([]);
          setTodayRevenue(0);
          setTotalProducts(0);
          setTotalCustomers(0);
          setLoading(false);
          return;
        }

        const todayStart = getTodayStart();

        // 2. Optimized Dexie batch fetch using `.anyOf` instead of a loop
        const todaySales = await db.sales
          .where("outletId")
          .anyOf(outletIds)
          .filter((s) => s.createdAt >= todayStart && s.status === "completed")
          .toArray();

        // Calculate revenue
        const revenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);

        // Sort sales descending by creation date
        const sortedSales = [...todaySales].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        );

        // Batch counts for Products and Customers
        const [prodsCount, custsCount] = await Promise.all([
          db.products.where("outletId").anyOf(outletIds).count(),
          db.customers.where("outletId").anyOf(outletIds).count(),
        ]);

        if (!isMounted) return;

        setTodayRevenue(revenue);
        setRecentSales(sortedSales.slice(0, 5));
        setTotalProducts(prodsCount);
        setTotalCustomers(custsCount);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [merchant?.id]);

  // Memoize subscription expiry check
  const isExpiringSoon = useMemo(() => {
    if (!merchant?.subscriptionExpiry) return false;
    const expiryDate = new Date(merchant.subscriptionExpiry).getTime();
    const warningThreshold = Date.now() + 7 * 24 * 60 * 60 * 1000;
    return expiryDate < warningThreshold;
  }, [merchant?.subscriptionExpiry]);

  // Fallback state if auth context is still resolving
  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-pos-muted text-sm gap-2">
        <RefreshCw size={18} className="animate-spin text-blue-500" />
        Loading merchant session...
      </div>
    );
  }

  const tierLimit = TIER_LIMITS[merchant.tier] || {
    name: merchant.tier || "Basic",
    maxOutlets: 1,
  };

  const activeOutletsCount = outlets.filter((o) => o.isActive).length;

  return (
    <div>
      <Header
        title={`Welcome back, ${merchant.ownerName?.split(" ")[0] || "Merchant"}`}
        subtitle={`${merchant.businessName} — ${tierLimit.name} Plan`}
      />

      <div className="p-6 space-y-6">
        {/* Subscription Alert */}
        {isExpiringSoon && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <p>
              Your subscription expires on{" "}
              <strong>{formatDateShort(merchant.subscriptionExpiry)}</strong>.{" "}
              <Link
                to="/merchant/billing"
                className="underline font-medium hover:text-amber-300"
              >
                Renew now
              </Link>{" "}
              to avoid service interruption.
            </p>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Today's Revenue"
            value={loading ? "..." : formatCurrency(todayRevenue)}
            icon={<TrendingUp size={20} />}
            iconColor="text-emerald-400"
          />
          <StatCard
            label="Active Outlets"
            value={
              loading
                ? "..."
                : `${activeOutletsCount} / ${tierLimit.maxOutlets}`
            }
            icon={<Store size={20} />}
            iconColor="text-blue-400"
          />
          <StatCard
            label="Total Products"
            value={loading ? "..." : totalProducts.toLocaleString()}
            icon={<Package size={20} />}
            iconColor="text-violet-400"
          />
          <StatCard
            label="Total Customers"
            value={loading ? "..." : totalCustomers.toLocaleString()}
            icon={<Users size={20} />}
            iconColor="text-amber-400"
          />
        </div>

        {/* Dashboard Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Sales Section */}
          <div className="lg:col-span-2 bg-pos-card border border-pos-border rounded-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-pos-border">
              <h3 className="font-semibold text-pos-text">
                Recent Transactions
              </h3>
              <Link
                to="/merchant/reports"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="py-12 text-center text-pos-muted text-sm flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin text-blue-400" />
                Loading transactions...
              </div>
            ) : recentSales.length === 0 ? (
              <div className="py-12 text-center text-pos-muted text-sm">
                No sales recorded today.
              </div>
            ) : (
              <div className="divide-y divide-pos-border">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="px-6 py-3.5 flex items-center justify-between hover:bg-pos-hover/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-pos-text">
                        {sale.receiptNumber}
                      </p>
                      <p className="text-xs text-pos-muted">
                        {sale.items?.length || 0} item
                        {sale.items?.length !== 1 ? "s" : ""} ·{" "}
                        {formatDateShort(sale.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-pos-text">
                        {formatCurrency(sale.total)}
                      </p>
                      <Badge
                        variant={
                          sale.status === "completed" ? "success" : "danger"
                        }
                      >
                        {sale.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outlets Overview Section */}
          <div className="bg-pos-card border border-pos-border rounded-xl flex flex-col justify-between">
            <div>
              <div className="px-6 py-4 border-b border-pos-border">
                <h3 className="font-semibold text-pos-text">Your Outlets</h3>
              </div>
              <div className="divide-y divide-pos-border">
                {loading ? (
                  <div className="py-8 text-center text-pos-muted text-sm">
                    Loading outlets...
                  </div>
                ) : outlets.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-pos-muted text-sm mb-3">
                      No outlets created yet.
                    </p>
                    <Link
                      to="/merchant/outlets"
                      className="text-blue-400 text-sm hover:text-blue-300 font-medium"
                    >
                      + Create outlet
                    </Link>
                  </div>
                ) : (
                  outlets.map((outlet) => (
                    <div
                      key={outlet.id}
                      className="px-6 py-3.5 flex items-center justify-between hover:bg-pos-hover/50 transition-colors"
                    >
                      <div className="pr-2">
                        <p className="text-sm font-medium text-pos-text">
                          {outlet.name}
                        </p>
                        <p className="text-xs text-pos-muted truncate max-w-35">
                          {outlet.address}
                        </p>
                      </div>
                      <Badge
                        variant={outlet.isActive ? "success" : "muted"}
                        dot
                      >
                        {outlet.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-pos-border bg-pos-card/50 rounded-b-xl">
              <Link
                to="/merchant/outlets"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
              >
                Manage outlets <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
