import { Package, Clock, Truck, CheckCircle2 } from "lucide-react";
import { LogisticsOrderItem } from "@/types/logistics";

export interface LogisticsMetricsProps {
  orders: LogisticsOrderItem[];
}

export function LogisticsMetrics({ orders }: LogisticsMetricsProps) {
  const totalOrders = orders.length;
  const pendingPickup = orders.filter(
    (order) => (order.delivery_types || "").toLowerCase().trim() === "pending"
  ).length;
  const inTransit = orders.filter((order) => {
    const status = (order.delivery_types || "").toLowerCase().trim();
    return status === "confirmed" || status === "shipped";
  }).length;
  const delivered = orders.filter(
    (order) => (order.delivery_types || "").toLowerCase().trim() === "delivered"
  ).length;

  const metrics = [
    {
      title: "Total Orders",
      value: totalOrders,
      description: "All assigned logistics shipments",
      icon: Package,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-100 dark:bg-blue-950/60",
      testId: "metric-total-orders",
    },
    {
      title: "Pending Pickup",
      value: pendingPickup,
      description: "Awaiting courier pickup",
      icon: Clock,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-100 dark:bg-amber-950/60",
      testId: "metric-pending-pickup",
    },
    {
      title: "In Transit",
      value: inTransit,
      description: "On the way to customers",
      icon: Truck,
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-100 dark:bg-purple-950/60",
      testId: "metric-in-transit",
    },
    {
      title: "Delivered",
      value: delivered,
      description: "Completed customer deliveries",
      icon: CheckCircle2,
      iconColor: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-100 dark:bg-emerald-950/60",
      testId: "metric-delivered",
    },
  ];

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      data-testid="logistics-metrics"
    >
      {metrics.map((metric) => (
        <div
          key={metric.title}
          data-testid={metric.testId}
          className="rounded-xl border bg-card p-4 shadow-sm text-card-foreground flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </span>
            <div className={`p-2 rounded-lg ${metric.iconBg}`}>
              <metric.icon className={`h-4 w-4 ${metric.iconColor}`} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight">
              {metric.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metric.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
