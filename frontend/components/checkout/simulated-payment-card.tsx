"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Info, Lock, ShieldCheck } from "lucide-react";

export function SimulatedPaymentCard() {
  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
            <CardTitle className="text-lg font-bold text-foreground">
              Payment Method
            </CardTitle>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Simulated 256-bit Encrypted Checkout</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        {/* Educational Disclaimer Banner */}
        <div
          role="note"
          className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-foreground flex items-start gap-3"
        >
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <strong className="font-semibold text-foreground block mb-0.5">
              Simulated Payment
            </strong>
            This is an educational prototype. No actual payment will be
            processed or charged. Orders are automatically fulfilled in
            simulated logistics mode.
          </div>
        </div>

        {/* Dummy Card Preview */}
        <button
          type="button"
          aria-label="Selected Payment Method: Simulated Test Card ending in 4242"
          aria-pressed="true"
          className="w-full text-left rounded-xl border border-primary/40 bg-muted/40 p-4 space-y-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all cursor-default"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Simulated Card
            </span>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
              TEST CARD
            </span>
          </div>
          <div className="font-mono text-base font-semibold tracking-widest text-foreground">
            •••• •••• •••• 4242
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>Expires: 12/28</span>
            <span>CVV: •••</span>
          </div>
        </button>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck
            className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0"
            aria-hidden="true"
          />
          <span>
            No credit card information is collected or stored on our servers.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
