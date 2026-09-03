"use client";

import React from "react";
import { Store, ShoppingBag, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RoleSelectorProps {
  selectedRole: "buyer" | "merchant" | null;
  onRoleSelect: (role: "buyer" | "merchant") => void;
  errorMessage?: string;
}

export function RoleSelector({
  selectedRole,
  onRoleSelect,
  errorMessage,
}: RoleSelectorProps) {
  const merchantBenefits = [
    "List products on the marketplace",
    "Set your own prices",
    "Manage your inventory",
    "Track orders",
  ];

  const buyerBenefits = [
    "Browse thousands of products",
    "Compare seller prices",
    "Track your orders",
    "Easy checkout",
  ];

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    role: "buyer" | "merchant"
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRoleSelect(role);
    }
  };

  return (
    <div className="w-full space-y-2">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        I want to join as
      </label>
      <div
        role="radiogroup"
        aria-label="Select account type"
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        {/* Merchant Panel */}
        <div
          role="radio"
          aria-checked={selectedRole === "merchant"}
          tabIndex={0}
          onClick={() => onRoleSelect("merchant")}
          onKeyDown={(e) => handleKeyDown(e, "merchant")}
          className={cn(
            "flex flex-col justify-between p-4 rounded-xl border-2 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            selectedRole === "merchant"
              ? "border-primary bg-primary/5 ring-2 ring-primary/20 text-foreground"
              : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30"
          )}
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  selectedRole === "merchant"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Store className="size-5" />
              </div>
              <span className="font-semibold text-base">Merchant</span>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {merchantBenefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-2">
                  <Check className="size-3.5 text-primary shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Buyer Panel */}
        <div
          role="radio"
          aria-checked={selectedRole === "buyer"}
          tabIndex={0}
          onClick={() => onRoleSelect("buyer")}
          onKeyDown={(e) => handleKeyDown(e, "buyer")}
          className={cn(
            "flex flex-col justify-between p-4 rounded-xl border-2 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            selectedRole === "buyer"
              ? "border-primary bg-primary/5 ring-2 ring-primary/20 text-foreground"
              : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30"
          )}
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  selectedRole === "buyer"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <ShoppingBag className="size-5" />
              </div>
              <span className="font-semibold text-base">Buyer</span>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {buyerBenefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-2">
                  <Check className="size-3.5 text-primary shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {errorMessage && (
        <p className="text-xs text-destructive mt-1.5">{errorMessage}</p>
      )}
    </div>
  );
}
