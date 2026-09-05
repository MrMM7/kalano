import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (newOffset: number) => void;
}

export function PaginationControls({
  total,
  limit,
  offset,
  onPageChange,
}: PaginationControlsProps) {
  const safeLimit = Math.max(1, limit);
  const currentPage = Math.floor(offset / safeLimit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  const hasPrevious = offset > 0;
  const hasNext = offset + safeLimit < total;

  function handlePrevious() {
    if (hasPrevious) {
      onPageChange(Math.max(0, offset - safeLimit));
    }
  }

  function handleNext() {
    if (hasNext) {
      onPageChange(offset + safeLimit);
    }
  }

  return (
    <nav
      aria-label="Pagination Navigation"
      className="flex items-center justify-between border-t border-border/60 px-4 py-4 sm:px-6 mt-8"
    >
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={!hasPrevious}
          aria-label="Go to previous page"
        >
          Previous
        </Button>
        <span className="text-sm font-medium text-muted-foreground self-center">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!hasNext}
          aria-label="Go to next page"
        >
          Next
        </Button>
      </div>

      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-semibold text-foreground">
              {total === 0 ? 0 : offset + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-foreground">
              {Math.min(offset + safeLimit, total)}
            </span>{" "}
            of <span className="font-semibold text-foreground">{total}</span>{" "}
            results
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={!hasPrevious}
            aria-label="Go to previous page"
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={!hasNext}
            aria-label="Go to next page"
            className="gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
