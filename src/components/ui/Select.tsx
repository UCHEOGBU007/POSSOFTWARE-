import { type SelectHTMLAttributes } from "react";
import { clsx } from "@/utils/helpers";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export default function Select({
  label,
  error,
  options,
  placeholder,
  className,
  ...props
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-pos-muted uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        className={clsx(
          "w-full bg-pos-input border border-pos-border rounded-lg px-3 py-2 text-sm text-pos-text",
          "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30",
          "transition-colors duration-150 cursor-pointer",
          error && "border-red-500",
          className,
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
