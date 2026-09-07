import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Footer } from "@/components/layout/footer";

describe("Footer", () => {
  it("renders semantic footer element", () => {
    const { container } = render(<Footer />);
    const footerElement = container.querySelector("footer");
    expect(footerElement).toBeInTheDocument();
    expect(footerElement).toHaveClass(
      "border-t",
      "border-border",
      "bg-muted/30"
    );
  });

  it("renders brand overview with logo link and tagline", () => {
    render(<Footer />);

    const brandLink = screen.getByRole("link", { name: /kalano home/i });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute("href", "/");

    expect(
      screen.getByText(
        /a modern multi-vendor marketplace platform where independent merchants offer products and kalano handles delivery/i
      )
    ).toBeInTheDocument();
  });

  it("renders quick navigation links with correct destinations", () => {
    render(<Footer />);

    const nav = screen.getByRole("navigation", { name: /footer navigation/i });
    expect(nav).toBeInTheDocument();

    const homeLink = screen.getByRole("link", { name: /^home$/i });
    expect(homeLink).toHaveAttribute("href", "/");

    const catalogLink = screen.getByRole("link", { name: /^catalog$/i });
    expect(catalogLink).toHaveAttribute("href", "/products");

    const cartLink = screen.getByRole("link", { name: /^cart$/i });
    expect(cartLink).toHaveAttribute("href", "/cart");

    const loginLink = screen.getByRole("link", { name: /^login$/i });
    expect(loginLink).toHaveAttribute("href", "/login");

    const signUpLink = screen.getByRole("link", { name: /^sign up$/i });
    expect(signUpLink).toHaveAttribute("href", "/signup");
  });

  it("renders educational disclaimer statement", () => {
    render(<Footer />);

    expect(
      screen.getByText(
        /kalano is built solely for learning and educational purposes\. all listings, simulated payments, checkouts, and delivery operations are simulated\./i
      )
    ).toBeInTheDocument();
  });

  it("renders copyright notice in bottom bar", () => {
    render(<Footer />);

    expect(
      screen.getByText(/© 2026 kalano\. built for educational purposes\./i)
    ).toBeInTheDocument();
  });
});
