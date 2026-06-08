/**
 * SponsorsPage Component Tests — Phase 7 tracer.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { SponsorsPage } from "./SponsorsPage";
import type { Sponsor } from "../Sponsors";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: ImageProps) => {
    const imgProps = { alt, src: typeof src === "string" ? src : "", ...props };
    return <img {...imgProps} />;
  },
}));

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

const sponsors: Sponsor[] = [
  {
    id: "1",
    name: "Hoofdsponsor A",
    logo: "/logo-a.png",
    url: "https://example.com/a",
    tier: "hoofdsponsor",
  },
  {
    id: "2",
    name: "Sponsor B",
    logo: "/logo-b.png",
    tier: "sponsor",
  },
  {
    id: "3",
    name: "Sympathisant C",
    logo: "",
    tier: "sympathisant",
  },
];

describe("SponsorsPage", () => {
  it("renders a level-1 heading", () => {
    render(<SponsorsPage sponsors={sponsors} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders the KCVV Elewijt kicker", () => {
    render(<SponsorsPage sponsors={sponsors} />);
    expect(screen.getByText("KCVV Elewijt")).toBeInTheDocument();
  });

  it("renders one tile per sponsor", () => {
    render(<SponsorsPage sponsors={sponsors} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(sponsors.length);
  });

  it("does not compose with SectionStack diagonal transitions", () => {
    render(<SponsorsPage sponsors={sponsors} />);
    expect(screen.queryByTestId("section-transition")).toBeNull();
  });

  it("does not render the legacy dark kcvv-black header background", () => {
    const { container } = render(<SponsorsPage sponsors={sponsors} />);
    expect(container.querySelector('[class*="kcvv-black"]')).toBeNull();
  });

  it("renders the header but no tiles when there are no sponsors", () => {
    render(<SponsorsPage sponsors={[]} />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
