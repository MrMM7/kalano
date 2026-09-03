import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoleSelector } from "@/components/role-selector";

describe("RoleSelector Component", () => {
  it("renders Merchant and Buyer options with their benefit bullet items", () => {
    const handleSelect = vi.fn();
    render(<RoleSelector selectedRole={null} onRoleSelect={handleSelect} />);

    expect(screen.getByText("Merchant")).toBeInTheDocument();
    expect(screen.getByText("Buyer")).toBeInTheDocument();

    expect(
      screen.getByText("List products on the marketplace")
    ).toBeInTheDocument();
    expect(screen.getByText("Set your own prices")).toBeInTheDocument();
    expect(screen.getByText("Manage your inventory")).toBeInTheDocument();
    expect(screen.getByText("Track orders")).toBeInTheDocument();

    expect(
      screen.getByText("Browse thousands of products")
    ).toBeInTheDocument();
    expect(screen.getByText("Compare seller prices")).toBeInTheDocument();
    expect(screen.getByText("Track your orders")).toBeInTheDocument();
    expect(screen.getByText("Easy checkout")).toBeInTheDocument();
  });

  it("calls onRoleSelect('merchant') when clicking Merchant panel", () => {
    const handleSelect = vi.fn();
    render(<RoleSelector selectedRole={null} onRoleSelect={handleSelect} />);

    const merchantCard = screen.getByRole("radio", { name: /merchant/i });
    fireEvent.click(merchantCard);

    expect(handleSelect).toHaveBeenCalledWith("merchant");
  });

  it("calls onRoleSelect('buyer') when clicking Buyer panel", () => {
    const handleSelect = vi.fn();
    render(<RoleSelector selectedRole={null} onRoleSelect={handleSelect} />);

    const buyerCard = screen.getByRole("radio", { name: /buyer/i });
    fireEvent.click(buyerCard);

    expect(handleSelect).toHaveBeenCalledWith("buyer");
  });

  it("applies active aria-checked when selectedRole is provided", () => {
    const { rerender } = render(
      <RoleSelector selectedRole="merchant" onRoleSelect={vi.fn()} />
    );

    const merchantRadio = screen.getByRole("radio", { name: /merchant/i });
    const buyerRadio = screen.getByRole("radio", { name: /buyer/i });

    expect(merchantRadio).toHaveAttribute("aria-checked", "true");
    expect(buyerRadio).toHaveAttribute("aria-checked", "false");

    rerender(<RoleSelector selectedRole="buyer" onRoleSelect={vi.fn()} />);

    expect(merchantRadio).toHaveAttribute("aria-checked", "false");
    expect(buyerRadio).toHaveAttribute("aria-checked", "true");
  });

  it("renders error message when errorMessage prop is passed", () => {
    render(
      <RoleSelector
        selectedRole={null}
        onRoleSelect={vi.fn()}
        errorMessage="Please select a role"
      />
    );

    expect(screen.getByText("Please select a role")).toBeInTheDocument();
  });
});
