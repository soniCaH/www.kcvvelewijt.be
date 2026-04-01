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
  it("renders a Dutch heading", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("heading", { name: /pagina niet gevonden/i }),
    ).toBeInTheDocument();
  });

  it("renders a description", () => {
    render(<NotFound />);
    expect(
      screen.getByText(/de pagina die je zoekt bestaat niet/i),
    ).toBeInTheDocument();
  });

  it("renders a link to the homepage", () => {
    render(<NotFound />);
    const homeLink = screen.getByRole("link", { name: /naar home/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("does not render PageHeader or PageFooter", () => {
    const { container } = render(<NotFound />);
    expect(container.querySelector("header")).toBeNull();
    expect(container.querySelector("footer")).toBeNull();
  });
});
