import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamsCta } from "./TeamsCta";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("TeamsCta", () => {
  it("renders the title", () => {
    render(<TeamsCta />);
    expect(
      screen.getByText("Aansluiten bij KCVV Elewijt?"),
    ).toBeInTheDocument();
  });

  it("renders the body text", () => {
    render(<TeamsCta />);
    expect(screen.getByText(/iedereen is welkom/i)).toBeInTheDocument();
  });

  it("renders CTA link", () => {
    render(<TeamsCta />);
    const link = screen.getByRole("link", { name: /meer info/i });
    expect(link).toHaveAttribute("href", "/club/aansluiten");
  });
});
