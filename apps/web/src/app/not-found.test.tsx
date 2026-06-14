import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "./not-found";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Global NotFound page", () => {
  it("renders the locked 404 pun heading", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("heading", { level: 1, name: /buiten de lijnen/i }),
    ).toBeInTheDocument();
  });

  it("renders the 404 body copy", () => {
    render(<NotFound />);
    expect(
      screen.getByText(/deze pagina staat niet \(meer\) op het veld/i),
    ).toBeInTheDocument();
  });

  it("renders a primary link to the homepage", () => {
    render(<NotFound />);
    const homeLink = screen.getByRole("link", { name: "Naar de homepage" });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("renders a secondary search affordance to /zoeken", () => {
    render(<NotFound />);
    const searchLink = screen.getByRole("link", { name: "Zoeken" });
    expect(searchLink).toHaveAttribute("href", "/zoeken");
  });

  it("does not render header or footer landmarks", () => {
    const { container } = render(<NotFound />);
    expect(container.querySelector("header")).toBeNull();
    expect(container.querySelector("footer")).toBeNull();
  });
});
