import { useState } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

interface LayoutProps {
  type: "merchant" | "outlet";
  businessName: string;
  subtitle: string;
  onLogout: () => void;
  children: ReactNode;
}

export default function Layout({
  type,
  businessName,
  subtitle,
  onLogout,
  children,
}: LayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex h-screen w-full bg-pos-bg overflow-hidden flex-col md:flex-row">
      {/* Mobile Top Navigation Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-pos-card border-b border-pos-border md:hidden shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-pos-muted hover:text-pos-text hover:bg-pos-hover focus:outline-none transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-pos-text truncate">
              {businessName}
            </h1>
            <p className="text-xs text-pos-muted truncate">{subtitle}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-pos-border bg-pos-bg text-pos-muted hover:text-pos-text transition-colors shrink-0"
          title={
            theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
          }
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Backdrop overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar Container with Close Button */}
      <aside
        onClick={(e) => {
          // Closes sidebar when any link or button inside is clicked
          const target = e.target as HTMLElement;
          if (target.closest("a") || target.closest("button")) {
            closeMobileMenu();
          }
        }}
        className={`
          fixed md:relative inset-y-0 left-0 z-40 w-64 bg-pos-card transform transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile-Only Close Icon Button inside Sidebar */}
        <div className="flex justify-end p-2 md:hidden absolute top-2 right-2 z-50">
          <button
            type="button"
            onClick={closeMobileMenu}
            className="p-1.5 rounded-lg text-pos-muted hover:text-pos-text hover:bg-pos-hover transition-colors"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <Sidebar
          type={type}
          businessName={businessName}
          subtitle={subtitle}
          onLogout={() => {
            closeMobileMenu();
            onLogout();
          }}
        />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Desktop Header Controls */}
        <div className="hidden md:flex justify-end px-6 pt-4 shrink-0">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-full border border-pos-border bg-pos-card px-3 py-1.5 text-xs font-medium text-pos-muted transition-colors hover:text-pos-text"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>

        {/* Scrollable View Container */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
