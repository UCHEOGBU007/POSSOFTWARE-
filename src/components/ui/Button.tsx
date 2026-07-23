import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { clsx } from "@/utils/helpers";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "ghost"
    | "outline"
    | "success";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

const variants = {
  primary:
    "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-900/30 border border-blue-500",
  secondary:
    "bg-pos-card hover:bg-pos-hover text-pos-text border border-pos-border",
  danger: "bg-red-600 hover:bg-red-700 text-white border border-red-500",
  ghost:
    "bg-transparent hover:bg-pos-hover text-pos-muted hover:text-pos-text border border-transparent",
  outline:
    "bg-transparent hover:bg-pos-hover text-pos-text border border-pos-border",
  success:
    "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500",
};

const sizes = {
  xs: "px-2 py-1 text-xs rounded-md gap-1",
  sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-lg gap-2",
  lg: "px-5 py-2.5 text-base rounded-xl gap-2",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-pos-bg",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}
