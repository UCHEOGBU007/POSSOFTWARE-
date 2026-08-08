import { useEffect, useState } from "react";
import {
  ShoppingCart,
  TrendingUp,
  Package,
  Users,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/db/database";
import Header from "@/components/layout/Header";
import { StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  formatCurrency,
  formatDateShort,
  getTodayStart,
} from "@/utils/helpers";
import type { Sale, Product } from "@/types";

export default function OutletDashboard() {
  const { outletSession } = useAuth();
  const outlet = outletSession!.outlet;
  const [todaySales, setTodaySales] = useState<Sale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    const load = async () => {
      const todayStart = getTodayStart();
      const sales = await db.sales
        .where("outletId")
        .equals(outlet.id)
        .filter((s) => s.createdAt >= todayStart && s.status === "completed")
        .toArray();
      setTodaySales(
        sales.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      );

      const products = await db.products
        .where({ outletId: outlet.id, isActive: 1 })
        .toArray();
      setTotalProducts(products.length);
      setLowStockProducts(
        products.filter((p) => p.trackStock && p.stock <= p.lowStockAlert),
      );

      const custs = await db.customers
        .where("outletId")
        .equals(outlet.id)
        .count();
      setTotalCustomers(custs);
    };
    load();
  }, [outlet.id]);

  const outletCurrency = outlet.currency ?? "NGN";
  const todayRevenue = todaySales.reduce((s, r) => s + r.total, 0);

  return (
    <div className="w-full min-w-0 overflow-x-hidden ">
      <Header
        title={outlet.name}
        subtitle={outlet.address}
        actions={
          <Link to="/outlet/pos" className="w-full sm:w-auto">
            <Button
              size="sm"
              icon={<ShoppingCart size={16} />}
              className="w-full sm:w-auto justify-center"
            >
              New Sale
            </Button>
          </Link>
        }
      />
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-full">
        {lowStockProducts.length > 0 && (
          <div className="flex items-start sm:items-center gap-2.5 p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs sm:text-sm">
            <AlertCircle size={18} className="shrink-0 mt-0.5 sm:mt-0" />
            <p className="wrap-break-word">
              <strong>
                {lowStockProducts.length} product
                {lowStockProducts.length > 1 ? "s" : ""}
              </strong>{" "}
              {lowStockProducts.length === 1 ? "is" : "are"} running low on
              stock.{" "}
              <Link to="/outlet/inventory" className="underline font-medium">
                Restock now
              </Link>
            </p>
          </div>
        )}

        {/* 1 column on mobile, 2 on tablet, 4 on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            label="Today's Revenue"
            value={formatCurrency(todayRevenue)}
            icon={<TrendingUp size={20} />}
            iconColor="text-emerald-400"
          />
          <StatCard
            label="Today's Sales"
            value={todaySales.length.toString()}
            icon={<ShoppingCart size={20} />}
            iconColor="text-blue-400"
          />
          <StatCard
            label="Products"
            value={totalProducts.toString()}
            icon={<Package size={20} />}
            iconColor="text-violet-400"
          />
          <StatCard
            label="Customers"
            value={totalCustomers.toString()}
            icon={<Users size={20} />}
            iconColor="text-amber-400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Today's Transactions */}
          <div className="bg-pos-card border border-pos-border rounded-xl min-w-0">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-pos-border">
              <h3 className="font-semibold text-pos-text text-sm sm:text-base">
                Today's Transactions
              </h3>
            </div>
            {todaySales.length === 0 ? (
              <div className="py-8 sm:py-12 text-center text-pos-muted text-xs sm:text-sm px-4">
                No sales today.
                <div className="mt-3">
                  <Link to="/outlet/pos">
                    <Button size="sm" icon={<ShoppingCart size={14} />}>
                      Start Selling
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-pos-border max-h-72 overflow-y-auto">
                {todaySales.map((sale) => (
                  <div
                    key={sale.id}
                    className="px-4 sm:px-6 py-3 flex flex-row items-center justify-between gap-2 min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-pos-text truncate">
                        {sale.receiptNumber}
                      </p>
                      <p className="text-[11px] sm:text-xs text-pos-muted truncate">
                        {sale.items.length} item
                        {sale.items.length !== 1 ? "s" : ""} ·{" "}
                        {sale.paymentMethod.toUpperCase()} ·{" "}
                        {formatDateShort(sale.createdAt)}
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold text-emerald-400 shrink-0">
                      {formatCurrency(sale.total, outletCurrency)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-pos-card border border-pos-border rounded-xl min-w-0">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-pos-border">
              <h3 className="font-semibold text-pos-text text-sm sm:text-base">
                Low Stock Alerts
              </h3>
            </div>
            {lowStockProducts.length === 0 ? (
              <div className="py-8 sm:py-12 text-center text-pos-muted text-xs sm:text-sm px-4">
                All products well stocked.
              </div>
            ) : (
              <div className="divide-y divide-pos-border max-h-72 overflow-y-auto">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="px-4 sm:px-6 py-3 flex flex-row items-center justify-between gap-2 min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-pos-text truncate">
                        {p.name}
                      </p>
                      <p className="text-[11px] sm:text-xs text-pos-muted truncate">
                        {p.sku}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <Badge variant={p.stock === 0 ? "danger" : "warning"} dot>
                        {p.stock === 0
                          ? "Out of stock"
                          : `${p.stock} ${p.unit} left`}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
