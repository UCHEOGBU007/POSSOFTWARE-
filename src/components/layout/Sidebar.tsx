import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  ShoppingCart,
  Users,
  BarChart2,
  Settings,
  CreditCard,
  Receipt,
  LogOut,
  ChevronRight,
  TrendingUp,
  UserCheck,
  Boxes,
} from "lucide-react";
import { clsx } from "@/utils/helpers";
import type { ReactNode } from "react";

interface NavItem {
  to: string;
  icon: ReactNode;
  label: string;
}

interface SidebarProps {
  type: "merchant" | "outlet";
  businessName: string;
  subtitle: string;
  onLogout: () => void;
}

const merchantNav: NavItem[] = [
  {
    to: "/merchant/dashboard",
    icon: <LayoutDashboard size={18} />,
    label: "Dashboard",
  },
  { to: "/merchant/outlets", icon: <Store size={18} />, label: "Outlets" },
  {
    to: "/merchant/staff",
    icon: <UserCheck size={18} />,
    label: "Staff & Cashiers",
  },
  {
    to: "/merchant/billing",
    icon: <CreditCard size={18} />,
    label: "Billing & Tier",
  },
  { to: "/merchant/reports", icon: <BarChart2 size={18} />, label: "Reports" },
  { to: "/merchant/settings", icon: <Settings size={18} />, label: "Settings" },
];

const outletNav: NavItem[] = [
  {
    to: "/outlet/dashboard",
    icon: <LayoutDashboard size={18} />,
    label: "Dashboard",
  },
  {
    to: "/outlet/pos",
    icon: <ShoppingCart size={18} />,
    label: "POS Terminal",
  },
  { to: "/outlet/inventory", icon: <Boxes size={18} />, label: "Inventory" },
  { to: "/outlet/sales", icon: <Receipt size={18} />, label: "Sales History" },
  { to: "/outlet/customers", icon: <Users size={18} />, label: "Customers" },
  // { to: "/outlet/staff", icon: <UserCheck size={18} />, label: "Staff" },
  { to: "/outlet/expenses", icon: <TrendingUp size={18} />, label: "Expenses" },
  { to: "/outlet/reports", icon: <BarChart2 size={18} />, label: "Reports" },
  { to: "/outlet/settings", icon: <Settings size={18} />, label: "Settings" },
];

export default function Sidebar({
  type,
  businessName,
  subtitle,
  onLogout,
}: SidebarProps) {
  const navItems = type === "merchant" ? merchantNav : outletNav;

  return (
    <aside className="w-60 shrink-0 flex flex-col bg-pos-sidebar border-r border-pos-border h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-pos-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {businessName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-pos-text truncate">
              {businessName}
            </p>
            <p className="text-xs text-pos-muted truncate">{subtitle}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group",
                  isActive
                    ? "bg-blue-600/15 text-blue-400 font-medium"
                    : "text-pos-muted hover:text-pos-text hover:bg-pos-hover",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={clsx(
                      isActive
                        ? "text-blue-400"
                        : "text-pos-muted group-hover:text-pos-text",
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {isActive && (
                    <ChevronRight
                      size={12}
                      className="text-blue-400 opacity-60"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="px-2 py-3 border-t border-pos-border">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-pos-muted hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
