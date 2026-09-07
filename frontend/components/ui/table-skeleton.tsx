import * as React from "react";
import { cn } from "@/lib/utils";

export interface TableSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
  ...props
}: TableSkeletonProps) {
  return (
    <div
      data-testid="table-skeleton"
      aria-busy="true"
      aria-label="Loading tabular data"
      className={cn(
        "w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        className
      )}
      {...props}
    >
      <div className="overflow-x-auto">
        <table
          className="w-full text-left border-collapse text-sm"
          role="table"
          aria-busy="true"
        >
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <th
                  key={colIndex}
                  scope="col"
                  className="py-3.5 px-4"
                  data-testid="table-skeleton-header-cell"
                >
                  <div className="h-4 w-24 max-w-full animate-pulse rounded bg-muted" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} data-testid="table-skeleton-row">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td
                    key={colIndex}
                    className="py-3.5 px-4"
                    data-testid="table-skeleton-cell"
                  >
                    <div
                      className={cn(
                        "h-4 animate-pulse rounded bg-muted",
                        colIndex === 0
                          ? "w-3/4"
                          : colIndex % 3 === 1
                            ? "w-1/2"
                            : "w-2/3"
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
