"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, children, className }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto px-4 py-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[calc(100vh-4rem)] overflow-y-auto",
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X size={16} />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-5", className)}>{children}</div>;
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-lg font-semibold text-gray-900", className)}>{children}</h2>;
}

export function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("mt-1 text-sm text-gray-500", className)}>{children}</p>;
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mt-6 flex items-center justify-end gap-3", className)}>{children}</div>;
}
