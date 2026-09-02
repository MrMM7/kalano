import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Home Page", () => {
  it("renders the Kalano platform title and description", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: /kalano/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/a modern multi-vendor marketplace/i)
    ).toBeInTheDocument();
  });

  it("renders the API status indicator", () => {
    render(<Home />);
    expect(
      screen.getByText(/frontend ready - api: http:\/\/localhost:8000/i)
    ).toBeInTheDocument();
  });
});
