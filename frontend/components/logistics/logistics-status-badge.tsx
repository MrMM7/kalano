import { cn } from "@/lib/utils";

export interface LogisticsStatusBadgeProps {
  status: string;
  className?: string;
}

interface StatusConfig {
  label: string;
  className: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  },
  confirmed: {
    label: "Confirmed",
    className:
      "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800",
  },
  shipped: {
    label: "Shipped",
    className:
      "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800",
  },
  delivered: {
    label: "Delivered",
    className:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
  },
  returned: {
    label: "Returned",
    className:
      "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800",
  },
};

export function LogisticsStatusBadge({
  status,
  className,
}: LogisticsStatusBadgeProps) {
  const normalized = (status || "").toLowerCase().trim();
  const config = STATUS_CONFIG[normalized] || {
    label: normalized
      ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
      : "Unknown",
    className:
      "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-900/60 dark:text-slate-400 dark:border-slate-800",
  };

  return (
    <span
      data-testid="logistics-status-badge"
      data-status={normalized}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
