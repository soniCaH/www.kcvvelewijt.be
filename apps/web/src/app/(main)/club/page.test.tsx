import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import ClubPage from "./page";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...rest }: ImageProps) => {
    const props = { alt, src: typeof src === "string" ? src : "", ...rest };

    return <img {...props} />;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("/club page", () => {
  it("renders the typographic PageHero with the 1909 lead (not the stale '75 jaar')", () => {
    render(<ClubPage />);

    expect(screen.getByText("Onze club")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /de plezantste compagnie/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/sinds 1909 de thuishaven voor voetballiefhebbers/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/75 jaar/i)).not.toBeInTheDocument();
  });

  it("renders the editorial hub linking to /club sub-pages", () => {
    render(<ClubPage />);

    const link = screen.getByRole("link", {
      name: /het team achter het team/i,
    });
    expect(link).toHaveAttribute("href", "/club/bestuur");
  });

  it("renders the mission pull quote", () => {
    render(<ClubPage />);

    expect(
      screen.getByText(/jong en oud wekelijks samenkomen voor hun passie/i),
    ).toBeInTheDocument();
  });

  it("renders the contact CTA linking to /club/contact", () => {
    render(<ClubPage />);

    expect(
      screen.getByRole("link", { name: /contacteer ons/i }),
    ).toHaveAttribute("href", "/club/contact");
  });

  it("separates sections with full-bleed StripedSeams (no diagonal SectionTransition)", () => {
    const { container } = render(<ClubPage />);

    // StripedSeam renders an inline SVG carrying data-direction; the legacy
    // diagonal SectionTransition is gone.
    expect(
      container.querySelectorAll("svg[data-direction]").length,
    ).toBeGreaterThanOrEqual(3);
    expect(
      container.querySelector('[data-testid="section-transition"]'),
    ).toBeNull();
  });
});
