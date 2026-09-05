import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PaginationControls } from "@/components/pagination-controls";

describe("PaginationControls", () => {
  it("computes correct page info and enables/disables navigation boundaries", () => {
    const onPageChangeMock = vi.fn();
    render(
      <PaginationControls
        total={50}
        limit={20}
        offset={0}
        onPageChange={onPageChangeMock}
      />
    );

    // Page 1 of 3 (0-20 of 50)
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByText(/showing/i)).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();

    const previousButtons = screen.getAllByRole("button", { name: /previous/i });
    previousButtons.forEach((btn) => expect(btn).toBeDisabled());

    const nextButtons = screen.getAllByRole("button", { name: /next/i });
    expect(nextButtons[1]).not.toBeDisabled();

    fireEvent.click(nextButtons[1]);
    expect(onPageChangeMock).toHaveBeenCalledWith(20);
  });

  it("handles middle page navigation", () => {
    const onPageChangeMock = vi.fn();
    render(
      <PaginationControls
        total={50}
        limit={20}
        offset={20}
        onPageChange={onPageChangeMock}
      />
    );

    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();

    const previousButtons = screen.getAllByRole("button", { name: /previous/i });
    const nextButtons = screen.getAllByRole("button", { name: /next/i });

    expect(previousButtons[1]).not.toBeDisabled();
    expect(nextButtons[1]).not.toBeDisabled();

    fireEvent.click(previousButtons[1]);
    expect(onPageChangeMock).toHaveBeenCalledWith(0);
  });

  it("disables next button on the final page", () => {
    const onPageChangeMock = vi.fn();
    render(
      <PaginationControls
        total={50}
        limit={20}
        offset={40}
        onPageChange={onPageChangeMock}
      />
    );

    expect(screen.getByText("Page 3 of 3")).toBeInTheDocument();

    const nextButtons = screen.getAllByRole("button", { name: /next/i });
    nextButtons.forEach((btn) => expect(btn).toBeDisabled());
  });
});
