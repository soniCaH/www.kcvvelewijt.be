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

import { CtaBand } from "./CtaBand";

const base = {
  ariaLabel: "Schrijf je in",
  heading: "Interesse in onze jeugd?",
  lead: "Nieuwe spelers zijn altijd welkom.",
  buttonLabel: "Schrijf je in +",
};

describe("CtaBand", () => {
  it("renders the heading (no spurious period on a question), lead and landmark", () => {
    render(<CtaBand {...base} href="/hulp" />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Interesse in onze jeugd?");
    expect(heading.textContent).not.toContain("?.");
    expect(
      screen.getByText("Nieuwe spelers zijn altijd welkom."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Schrijf je in" }),
    ).toBeInTheDocument();
  });

  it("renders an internal href as a link button", () => {
    render(<CtaBand {...base} href="/hulp" />);
    const link = screen.getByRole("link", { name: /schrijf je in/i });
    expect(link).toHaveAttribute("href", "/hulp");
    expect(link).not.toHaveAttribute("target");
  });

  it("renders a mailto href as a plain anchor (no new-tab target)", () => {
    render(<CtaBand {...base} href="mailto:jeugd@kcvvelewijt.be" />);
    const link = screen.getByRole("link", { name: /schrijf je in/i });
    expect(link).toHaveAttribute("href", "mailto:jeugd@kcvvelewijt.be");
    expect(link).not.toHaveAttribute("target");
  });

  it("opens an external http(s) href in a new tab with a safe rel", () => {
    render(<CtaBand {...base} href="https://example.com/inschrijven" />);
    const link = screen.getByRole("link", { name: /schrijf je in/i });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("forwards buttonData (analytics markers) onto the button", () => {
    render(
      <CtaBand
        {...base}
        href="/hulp"
        buttonData={{ "data-jeugd-cta": "true" }}
      />,
    );
    const link = screen.getByRole("link", { name: /schrijf je in/i });
    expect(link).toHaveAttribute("data-jeugd-cta", "true");
  });
});
