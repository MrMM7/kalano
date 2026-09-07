import { DeliveryStatus } from "@/types/order";
import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  status: DeliveryStatus | string;
  className?: string;
  "aria-label"?: string;
}

interface StatusConfig {
  label: string;
  className: string;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  pending: {
    label: "Order Placed",
    className:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  confirmed: {
    label: "Ready for Pickup",
    className:
      "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  },
  shipped: {
    label: "In Transit",
    className:
      "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30",
  },
  delivered: {
    label: "Delivered",
    className:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
  },
  returned: {
    label: "Returned",
    className:
      "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/30",
  },
};

export function OrderStatusBadge({
  status,
  className,
  "aria-label": ariaLabel,
}: OrderStatusBadgeProps) {
  const config = STATUS_MAP[status] || {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      data-testid="order-status-badge"
      data-status={status}
      role="status"
      aria-label={ariaLabel || `Order status: ${config.label}`}
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
