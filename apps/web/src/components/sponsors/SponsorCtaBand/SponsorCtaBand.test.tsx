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
    expect(heading).toHaveTextContent("Ook jouw zaak langs de lijn?");
    expect(heading.textContent).not.toContain("?.");
  });

  it('renders the "Word sponsor" CTA linking to the contact page by default', () => {
    render(<SponsorCtaBand />);
    const link = screen.getByRole("link", { name: /Word sponsor/i });
    expect(link).toHaveAttribute("href", "/club/contact");
  });

  it("honours a custom href", () => {
    render(<SponsorCtaBand href="mailto:sponsoring@kcvvelewijt.be" />);
    expect(screen.getByRole("link", { name: /Word sponsor/i })).toHaveAttribute(
      "href",
      "mailto:sponsoring@kcvvelewijt.be",
    );
  });

  it("exposes a named landmark for the CTA", () => {
    render(<SponsorCtaBand />);
    expect(
      screen.getByRole("region", { name: "Word sponsor" }),
    ).toBeInTheDocument();
  });
});
