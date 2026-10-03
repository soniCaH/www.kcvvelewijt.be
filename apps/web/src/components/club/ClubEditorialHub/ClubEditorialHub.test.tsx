import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { ClubEditorialHub, CLUB_HUB_CARDS } from "./ClubEditorialHub";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...rest }: ImageProps) => {
    const props = { alt, src: typeof src === "string" ? src : "", ...rest };

    return <img {...props} />;
  },
}));

vi.mock("next/link", () => ({
  useLinkStatus: () => ({ pending: false }),
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

describe("ClubEditorialHub", () => {
  it("renders the 'Dit is KCVV.' section header", () => {
    render(<ClubEditorialHub />);
    const heading = screen.getByRole("heading", {
      level: 2,
      name: /dit is kcvv/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it("renders all twelve club nav-hub cards as links in the shared grid", () => {
    const { container } = render(<ClubEditorialHub />);
    expect(screen.getAllByRole("link")).toHaveLength(12);
    // `data-columns`/`data-gap` are `<TapedCardGrid>`'s published hooks; the
    // breakpoint strings behind them are the primitive's own business.
    const grid = container.querySelector("[data-columns]")!;
    expect(grid.getAttribute("data-columns")).toBe("3");
    expect(grid.getAttribute("data-gap")).toBe("sm");
    expect(grid.children).toHaveLength(12);
  });

  it("links each card to its mapped /club destination", () => {
    render(<ClubEditorialHub />);

    expect(
      screen.getByRole("link", { name: /meer dan een eeuw voetbalpassie/i }),
    ).toHaveAttribute("href", "/club/geschiedenis");
    expect(
      screen.getByRole("link", { name: /het team achter het team/i }),
    ).toHaveAttribute("href", "/club/bestuur");
    expect(
      screen.getByRole("link", { name: /onze structuur/i }),
    ).toHaveAttribute("href", "/hulp#structuur");
    expect(screen.getByRole("link", { name: /de 12de man/i })).toHaveAttribute(
      "href",
      "/club/ultras",
    );
    expect(screen.getByRole("link", { name: /onze engelen/i })).toHaveAttribute(
      "href",
      "/club/angels",
    );
    expect(screen.getByRole("link", { name: /word lid/i })).toHaveAttribute(
      "href",
      "/club/word-lid",
    );
    expect(
      screen.getByRole("link", { name: /de digitale clubkaart/i }),
    ).toHaveAttribute("href", "/club/cashless");
    expect(
      screen.getByRole("link", { name: /documenten & formulieren/i }),
    ).toHaveAttribute("href", "/club/downloads");
    expect(
      screen.getByRole("link", { name: /alles wat je moet weten/i }),
    ).toHaveAttribute("href", "/club/praktische-informatie");
    expect(
      screen.getByRole("link", { name: /wie de jeugd draaiende houdt/i }),
    ).toHaveAttribute("href", "/club/jeugdbestuur");
    expect(
      screen.getByRole("link", { name: /steek een handje toe/i }),
    ).toHaveAttribute("href", "/club/vrijwilliger");
    expect(
      screen.getByRole("link", { name: /vind ons terug/i }),
    ).toHaveAttribute("href", "/club/contact");
  });

  it("renders the three news covers as images", () => {
    const { container } = render(<ClubEditorialHub />);
    // News covers are decorative (alt=""), so they are presentational rather
    // than role=img — count them straight off the DOM instead.
    expect(container.querySelectorAll("img")).toHaveLength(3);
  });

  it("exposes a 12-card config of three news + nine nav cards", () => {
    expect(CLUB_HUB_CARDS).toHaveLength(12);
    expect(CLUB_HUB_CARDS.filter((c) => c.variant === "news")).toHaveLength(3);
    expect(CLUB_HUB_CARDS.filter((c) => c.variant === "nav")).toHaveLength(9);
  });
});
