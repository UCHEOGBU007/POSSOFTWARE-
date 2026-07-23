import type { ReactNode, HTMLAttributes } from "react";
import { clsx } from "@/utils/helpers";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

const paddings = { none: "", sm: "p-3", md: "p-5", lg: "p-6" };

export default function Card({
  children,
  padding = "md",
  hover,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        "bg-pos-card border border-pos-border rounded-xl",
        hover &&
          "hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-900/10 transition-all duration-200 cursor-pointer",
        paddings[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  iconColor?: string;
  trend?: { value: number; label: string };
}

export function StatCard({
  label,
  value,
  icon,
  iconColor = "text-blue-400",
  trend,
}: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-pos-muted uppercase tracking-widest font-medium mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-pos-text">{value}</p>
          {trend && (
            <p
              className={clsx(
                "text-xs mt-1",
                trend.value >= 0 ? "text-emerald-400" : "text-red-400",
              )}
            >
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%{" "}
              {trend.label}
            </p>
          )}
        </div>
        <div className={clsx("p-2.5 rounded-xl bg-pos-hover", iconColor)}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
