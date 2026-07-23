import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { clsx } from "@/utils/helpers";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  footer?: ReactNode;
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
  full: "max-w-5xl",
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  footer,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={clsx(
          "relative w-full bg-pos-card border border-pos-border rounded-2xl shadow-2xl shadow-black/50",
          "flex flex-col max-h-[90vh]",
          sizes[size],
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-pos-border shrink-0">
            <h2 className="font-semibold text-pos-text text-base">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-pos-muted hover:text-pos-text hover:bg-pos-hover transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-pos-border shrink-0 bg-pos-bg/50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
