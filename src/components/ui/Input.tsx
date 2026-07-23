import { type InputHTMLAttributes, type ReactNode, forwardRef } from "react";
import { clsx } from "@/utils/helpers";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-pos-muted uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-pos-muted pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={clsx(
              "w-full bg-pos-input border border-pos-border rounded-lg px-3 py-2 text-sm text-pos-text",
              "placeholder:text-pos-muted/50",
              "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30",
              "transition-colors duration-150",
              error &&
                "border-red-500 focus:border-red-500 focus:ring-red-500/30",
              !!leftIcon && "pl-9",
              !!rightIcon && "pr-9",
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-pos-muted pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-pos-muted">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
