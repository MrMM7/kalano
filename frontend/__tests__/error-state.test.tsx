import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ErrorState } from "@/components/ui/error-state";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import NotFound from "@/app/not-found";

describe("ErrorState", () => {
  it("renders with role='alert'", () => {
    render(<ErrorState />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
  });

  it("renders default title and message when props are omitted", () => {
    render(<ErrorState />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText("An error occurred while loading data.")
    ).toBeInTheDocument();
  });

  it("renders custom title and message when provided", () => {
    render(
      <ErrorState
        title="Failed to load orders"
        message="Please check your network connection and try again."
      />
    );
    expect(screen.getByText("Failed to load orders")).toBeInTheDocument();
    expect(
      screen.getByText("Please check your network connection and try again.")
    ).toBeInTheDocument();
  });

  it("does not render a retry button when onRetry is not provided", () => {
    render(<ErrorState />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders retry button with default label 'Try Again' when onRetry is provided", () => {
    const handleRetry = vi.fn();
    render(<ErrorState onRetry={handleRetry} />);

    const button = screen.getByRole("button", { name: /try again/i });
    expect(button).toBeInTheDocument();
  });

  it("renders retry button with custom retryLabel when provided", () => {
    const handleRetry = vi.fn();
    render(<ErrorState onRetry={handleRetry} retryLabel="Reload Offers" />);

    const button = screen.getByRole("button", { name: /reload offers/i });
    expect(button).toBeInTheDocument();
  });

  it("fires onRetry callback when retry button is clicked", () => {
    const handleRetry = vi.fn();
    render(<ErrorState onRetry={handleRetry} />);

    const button = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(button);

    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});

describe("TableSkeleton", () => {
  it("has aria-busy='true' and aria-label='Loading tabular data'", () => {
    render(<TableSkeleton />);
    const skeleton = screen.getByTestId("table-skeleton");
    expect(skeleton).toHaveAttribute("aria-busy", "true");
    expect(skeleton).toHaveAttribute("aria-label", "Loading tabular data");
  });

  it("renders with default rows (5) and columns (4)", () => {
    render(<TableSkeleton />);
    const headers = screen.getAllByTestId("table-skeleton-header-cell");
    const rows = screen.getAllByTestId("table-skeleton-row");
    const cells = screen.getAllByTestId("table-skeleton-cell");

    expect(headers).toHaveLength(4);
    expect(rows).toHaveLength(5);
    expect(cells).toHaveLength(20);
  });

  it("renders custom rows and custom columns", () => {
    render(<TableSkeleton rows={3} columns={2} />);
    const headers = screen.getAllByTestId("table-skeleton-header-cell");
    const rows = screen.getAllByTestId("table-skeleton-row");
    const cells = screen.getAllByTestId("table-skeleton-cell");

    expect(headers).toHaveLength(2);
    expect(rows).toHaveLength(3);
    expect(cells).toHaveLength(6);
  });
});

describe("NotFound", () => {
  it("renders 404 heading, Page Not Found, and a return to home link", () => {
    render(<NotFound />);

    expect(
      screen.getByRole("heading", { level: 1, name: "404" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /page not found/i })
    ).toBeInTheDocument();

    const homeLink = screen.getByRole("link", { name: /return to home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute("href", "/");
  });
});
