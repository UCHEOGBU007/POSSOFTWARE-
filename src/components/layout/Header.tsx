import { Bell, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-pos-border bg-pos-bg sticky top-0 z-10">
      <div>
        <h1 className="text-lg font-semibold text-pos-text">{title}</h1>
        {subtitle && (
          <p className="text-xs text-pos-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
            isOnline
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              : "text-amber-400 bg-amber-500/10 border-amber-500/20"
          }`}
        >
          {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          {isOnline ? "Online" : "Offline"}
        </div>
        {actions}
        <button className="relative p-2 rounded-lg text-pos-muted hover:text-pos-text hover:bg-pos-hover transition-colors">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
