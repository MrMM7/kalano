import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../middleware";

describe("Next.js Route Protection Middleware", () => {
  it("redirects unauthenticated request for /dashboard to /login?redirect=/dashboard", () => {
    const req = new NextRequest("http://localhost:3000/dashboard");
    const response = middleware(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?redirect=%2Fdashboard"
    );
  });

  it("redirects unauthenticated request for nested path /cart/checkout to /login?redirect=/cart/checkout", () => {
    const req = new NextRequest("http://localhost:3000/cart/checkout");
    const response = middleware(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?redirect=%2Fcart%2Fcheckout"
    );
  });

  it("preserves search parameters in redirect query parameter", () => {
    const req = new NextRequest(
      "http://localhost:3000/orders?status=pending&page=2"
    );
    const response = middleware(req);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?redirect=%2Forders%3Fstatus%3Dpending%26page%3D2"
    );
  });

  it("allows access when kalano_token cookie is present", () => {
    const req = new NextRequest("http://localhost:3000/dashboard", {
      headers: {
        cookie: "kalano_token=valid_access_token_mock",
      },
    });
    const response = middleware(req);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("allows public routes through without cookie", () => {
    const publicRoutes = [
      "http://localhost:3000/",
      "http://localhost:3000/login",
      "http://localhost:3000/signup",
      "http://localhost:3000/products",
      "http://localhost:3000/products/123",
    ];

    for (const url of publicRoutes) {
      const req = new NextRequest(url);
      const response = middleware(req);
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    }
  });
});
