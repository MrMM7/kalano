"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";

export interface LogisticsConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "destructive" | "default";
  isPending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogisticsConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  confirmVariant = "default",
  isPending = false,
  onClose,
  onConfirm,
}: LogisticsConfirmDialogProps) {
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-md text-muted-foreground hover:text-foreground p-1 transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-2">
          <h2
            id="confirm-dialog-title"
            className="text-lg font-semibold text-foreground"
          >
            {title}
          </h2>
          <p
            id="confirm-dialog-description"
            className="text-sm text-muted-foreground"
          >
            {description}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={
              confirmVariant === "destructive" ? "destructive" : "default"
            }
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
