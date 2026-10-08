import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  useLinkStatus: () => ({ pending: false }),
  default: ({
    children,
    href,
    ...props
  }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { JeugdCtaBand } from "./JeugdCtaBand";

describe("JeugdCtaBand", () => {
  it("renders the invitation heading without a spurious period", () => {
    render(<JeugdCtaBand />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Interesse in onze jeugd?");
    expect(heading.textContent).not.toContain("?.");
  });

  it('renders the "Schrijf je in" CTA linking to /club/word-lid by default', () => {
    render(<JeugdCtaBand />);
    const link = screen.getByRole("link", { name: /schrijf je in/i });
    expect(link).toHaveAttribute("href", "/club/word-lid");
  });

  it("carries the club motto and no trial-training invitation (#3427)", () => {
    render(<JeugdCtaBand />);
    expect(
      screen.getByText(/Er is maar 1 plezante compagnie/),
    ).toBeInTheDocument();
    // Club feedback v2: no "kom meetrainen" invitation for now.
    expect(screen.queryByText(/langs op training/i)).not.toBeInTheDocument();
  });

  it("honours a custom href", () => {
    render(<JeugdCtaBand href="mailto:jeugd@kcvvelewijt.be" />);
    const link = screen.getByRole("link", { name: /schrijf je in/i });
    expect(link).toHaveAttribute("href", "mailto:jeugd@kcvvelewijt.be");
  });

  it("exposes a named landmark for the CTA", () => {
    render(<JeugdCtaBand />);
    expect(
      screen.getByRole("region", { name: "Schrijf je in" }),
    ).toBeInTheDocument();
  });
});
