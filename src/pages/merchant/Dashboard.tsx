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
import { getSupabaseConfigStatus, supabase } from "@/lib/supabase";
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

/**
 * MerchantDashboard Component
 * Serves as the main overview screen for merchants, displaying key business metrics,
 * recent sales activity across outlets, subscription warnings, and outlet statuses.
 */
export default function MerchantDashboard() {
  // Retrieve current active merchant session from authentication context
  const { merchantSession } = useAuth();
  const merchant = merchantSession?.merchant;

  // Local state for dashboard metrics and queries
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch metrics and operational data from IndexedDB when merchant ID changes
  useEffect(() => {
    if (!merchant?.id) return;

    let isMounted = true;

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Cloud data is authoritative so a merchant sees sales, inventory and
        // expenses entered by every outlet/device, not just this browser cache.
        const { isConfigured } = getSupabaseConfigStatus();
        let outs: Outlet[];
        if (isConfigured) {
          const { data, error } = await supabase.from("outlets").select("*").eq("merchant_id", merchant.id);
          if (error) throw error;
          outs = (data ?? []).map((row: any) => ({
            id: row.id, merchantId: row.merchant_id, outletCode: row.outlet_code,
            name: row.name, address: row.address, phone: row.phone, currency: row.currency,
            pin: "", isActive: row.is_active, taxEnabled: row.tax_enabled,
            receiptFooter: row.receipt_footer, createdAt: row.created_at, updatedAt: row.updated_at,
            syncStatus: "synced" as const,
          }));
          await db.outlets.bulkPut(outs);
        } else {
          outs = await db.outlets.where("merchantId").equals(merchant.id).toArray();
        }

        if (!isMounted) return;
        setOutlets(outs);

        const outletIds = outs.map((o) => o.id);

        // If no outlets exist, reset counts to zero and skip further querying
        if (outletIds.length === 0) {
          setRecentSales([]);
          setTodayRevenue(0);
          setTotalProducts(0);
          setTotalCustomers(0);
          setTodayExpenses(0);
          setLoading(false);
          return;
        }

        const todayStart = getTodayStart();

        let todaySales: Sale[];
        let prodsCount: number;
        let custsCount: number;
        let expenseTotal: number;
        if (isConfigured) {
          const [salesResult, productsResult, customersResult, expensesResult] = await Promise.all([
            supabase.from("sales").select("*").in("outlet_id", outletIds).eq("status", "completed").gte("created_at", todayStart),
            supabase.from("products").select("id", { count: "exact", head: true }).in("outlet_id", outletIds),
            supabase.from("customers").select("id", { count: "exact", head: true }).in("outlet_id", outletIds),
            supabase.from("expenses").select("amount").in("outlet_id", outletIds).gte("expense_date", todayStart.slice(0, 10)),
          ]);
          if (salesResult.error || productsResult.error || customersResult.error || expensesResult.error) throw salesResult.error || productsResult.error || customersResult.error || expensesResult.error;
          todaySales = (salesResult.data ?? []).map((row: any) => ({
            id: row.id, outletId: row.outlet_id, receiptNumber: row.receipt_number, items: row.items,
            subtotal: Number(row.subtotal), taxAmount: Number(row.tax_amount), discountAmount: Number(row.discount_amount), total: Number(row.total), amountPaid: Number(row.amount_paid), change: Number(row.change), paymentMethod: row.payment_method, status: row.status, customerId: row.customer_id, customerName: row.customer_name, staffId: row.staff_id, staffName: row.staff_name, note: row.note, createdAt: row.created_at, syncStatus: "synced" as const,
          }));
          await db.sales.bulkPut(todaySales);
          prodsCount = productsResult.count ?? 0;
          custsCount = customersResult.count ?? 0;
          expenseTotal = (expensesResult.data ?? []).reduce((sum, expense: { amount: number | string }) => sum + Number(expense.amount), 0);
        } else {
          todaySales = await db.sales.where("outletId").anyOf(outletIds).filter((s) => s.createdAt >= todayStart && s.status === "completed").toArray();
          [prodsCount, custsCount] = await Promise.all([
            db.products.where("outletId").anyOf(outletIds).count(),
            db.customers.where("outletId").anyOf(outletIds).count(),
          ]);
          expenseTotal = (await db.expenses.where("outletId").anyOf(outletIds).filter((expense) => expense.date >= todayStart.slice(0, 10)).toArray()).reduce((sum, expense) => sum + expense.amount, 0);
        }

        // Calculate total revenue generated today
        const revenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);

        // Sort sales chronologically (newest first)
        const sortedSales = [...todaySales].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        );

        if (!isMounted) return;

        // Update dashboard state with aggregated database query results
        setTodayRevenue(revenue);
        setRecentSales(sortedSales.slice(0, 5)); // Keep only the 5 most recent sales
        setTotalProducts(prodsCount);
        setTotalCustomers(custsCount);
        setTodayExpenses(expenseTotal);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDashboardData();

    // Cleanup flag to prevent updating state on unmounted component
    return () => {
      isMounted = false;
    };
  }, [merchant?.id]);

  // Compute whether subscription is expiring within a 7-day window
  const isExpiringSoon = useMemo(() => {
    if (!merchant?.subscriptionExpiry) return false;
    const expiryDate = new Date(merchant.subscriptionExpiry).getTime();
    const warningThreshold = Date.now() + 7 * 24 * 60 * 60 * 1000;
    return expiryDate < warningThreshold;
  }, [merchant?.subscriptionExpiry]);

  // Render loading state while waiting for session initialization
  if (!merchant) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-pos-muted text-sm gap-2">
        <RefreshCw size={18} className="animate-spin text-blue-500" />
        Loading merchant session...
      </div>
    );
  }

  // Fallback defaults for subscription tier limits
  const tierLimit = TIER_LIMITS[merchant.tier] || {
    name: merchant.tier || "Basic",
    maxOutlets: 1,
  };

  // Count currently active outlets
  const activeOutletsCount = outlets.filter((o) => o.isActive).length;

  return (
    <div>
      {/* Header section displaying personalized merchant welcome greeting */}
      <Header
        title={`Welcome back, ${merchant.ownerName?.split(" ")[0] || "Merchant"}`}
        subtitle={`${merchant.businessName} — ${tierLimit.name} Plan`}
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Subscription Renewal Alert Banner */}
        {isExpiringSoon && (
          <div className="flex items-start sm:items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5 sm:mt-0" />
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

        {/* ==================================================================== */}
        {/* KEY PERFORMANCE METRICS GRID                                         */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Today's Revenue"
            value={
              loading ? "..." : formatCurrency(todayRevenue, merchant.currency)
            }
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
          <StatCard
            label="Today's Expenses"
            value={loading ? "..." : formatCurrency(todayExpenses, merchant.currency)}
            icon={<AlertCircle size={20} />}
            iconColor="text-red-400"
          />
        </div>

        {/* ==================================================================== */}
        {/* MAIN CONTENT GRID: TRANSACTIONS & OUTLETS OVERVIEW                   */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Sales Activity List */}
          <div className="lg:col-span-2 bg-pos-card border border-pos-border rounded-xl">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-pos-border">
              <h3 className="font-semibold text-pos-text text-sm sm:text-base">
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
                    className="px-4 sm:px-6 py-3.5 flex items-center justify-between hover:bg-pos-hover/50 transition-colors gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-pos-text truncate">
                        {sale.receiptNumber}
                      </p>
                      <p className="text-xs text-pos-muted">
                        {sale.items?.length || 0} item
                        {sale.items?.length !== 1 ? "s" : ""} ·{" "}
                        {formatDateShort(sale.createdAt)} · {outlets.find((outlet) => outlet.id === sale.outletId)?.name ?? "Outlet"}
                        {sale.staffName ? ` · ${sale.staffName}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-pos-text">
                        {formatCurrency(sale.total, merchant.currency)}
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

          {/* Outlets Overview & Status Card */}
          <div className="bg-pos-card border border-pos-border rounded-xl flex flex-col justify-between">
            <div>
              <div className="px-4 sm:px-6 py-4 border-b border-pos-border">
                <h3 className="font-semibold text-pos-text text-sm sm:text-base">
                  Your Outlets
                </h3>
              </div>
              <div className="divide-y divide-pos-border">
                {loading ? (
                  <div className="py-8 text-center text-pos-muted text-sm">
                    Loading outlets...
                  </div>
                ) : outlets.length === 0 ? (
                  /* Empty State: Prompt user to add their first outlet */
                  <div className="py-8 text-center px-4">
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
                      className="px-4 sm:px-6 py-3.5 flex items-center justify-between hover:bg-pos-hover/50 transition-colors gap-2"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-sm font-medium text-pos-text truncate">
                          {outlet.name}
                        </p>
                        <p className="text-xs text-pos-muted truncate">
                          {outlet.address}
                        </p>
                      </div>
                      <div className="shrink-0">
                        <Badge
                          variant={outlet.isActive ? "success" : "muted"}
                          dot
                        >
                          {outlet.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Outlets Management Quick Link */}
            <div className="px-4 sm:px-6 py-3 border-t border-pos-border bg-pos-card/50 rounded-b-xl">
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
