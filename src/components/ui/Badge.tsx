import type { ReactNode } from "react";
import { clsx } from "@/utils/helpers";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  danger: "bg-red-500/15 text-red-400 border-red-500/20",
  info: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
  muted: "bg-pos-muted/10 text-pos-muted border-pos-muted/20",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-blue-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  info: "bg-cyan-400",
  muted: "bg-pos-muted",
};

export default function Badge({
  variant = "default",
  children,
  dot,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
        variants[variant],
      )}
    >
      {dot && (
        <span
          className={clsx("w-1.5 h-1.5 rounded-full", dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
}
