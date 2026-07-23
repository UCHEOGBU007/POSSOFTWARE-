import { Moon, Sun } from "lucide-react";
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

  return (
    <div className="flex h-screen bg-pos-bg overflow-hidden">
      <Sidebar
        type={type}
        businessName={businessName}
        subtitle={subtitle}
        onLogout={onLogout}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="flex justify-end px-4 pt-4">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-full border border-pos-border bg-pos-card px-3 py-2 text-sm text-pos-muted transition-colors hover:text-pos-text"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
