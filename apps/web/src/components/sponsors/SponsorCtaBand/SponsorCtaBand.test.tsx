import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
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

import { SponsorCtaBand } from "./SponsorCtaBand";

describe("SponsorCtaBand", () => {
  it("renders the invitation heading without a spurious period", () => {
    render(<SponsorCtaBand />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Jouw zaak ook langs de zijlijn?");
    expect(heading.textContent).not.toContain("?.");
  });

  it('renders the "Word sponsor" CTA linking to the contact page by default', () => {
    render(<SponsorCtaBand />);
    const link = screen.getByRole("link", { name: /Word sponsor/i });
    expect(link).toHaveAttribute("href", "/club/contact");
  });

  it("renders a mailto href as a plain anchor (no new-tab target)", () => {
    render(<SponsorCtaBand href="mailto:sponsoring@kcvvelewijt.be" />);
    const link = screen.getByRole("link", { name: /Word sponsor/i });
    expect(link).toHaveAttribute("href", "mailto:sponsoring@kcvvelewijt.be");
    expect(link).not.toHaveAttribute("target");
  });

  it("opens an external http(s) href in a new tab with a safe rel", () => {
    render(<SponsorCtaBand href="https://partner.example.com" />);
    const link = screen.getByRole("link", { name: /Word sponsor/i });
    expect(link).toHaveAttribute("href", "https://partner.example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("exposes a named landmark for the CTA", () => {
    render(<SponsorCtaBand />);
    expect(
      screen.getByRole("region", { name: "Word sponsor" }),
    ).toBeInTheDocument();
  });
});
