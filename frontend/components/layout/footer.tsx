import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-border bg-muted/30 py-12 mt-auto",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-border/60">
          {/* 1. Brand Overview */}
          <div className="space-y-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold tracking-tight text-foreground hover:text-primary transition-colors"
              aria-label="Kalano Home"
            >
              <ShoppingBag
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              />
              <span>Kalano</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A modern multi-vendor marketplace platform where independent
              merchants offer products and Kalano handles delivery.
            </p>
          </div>

          {/* 2. Quick Navigation Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              Quick Links
            </h3>
            <nav aria-label="Footer navigation">
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/products"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Catalog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cart"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cart
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Sign Up
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* 3. Educational Disclaimer */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wider text-foreground uppercase">
              Educational Disclaimer
            </h3>
            <div className="rounded-lg border border-border/60 bg-background/50 p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Kalano is built solely for learning and educational purposes.
                All listings, simulated payments, checkouts, and delivery
                operations are simulated.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© 2026 Kalano. Built for educational purposes.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
