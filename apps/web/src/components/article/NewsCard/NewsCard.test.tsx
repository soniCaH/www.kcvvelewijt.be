// apps/web/src/components/article/NewsCard/NewsCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { NewsCard } from "./NewsCard";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: ImageProps) => {
    const imgProps = { alt, src: typeof src === "string" ? src : "", ...props };
    return <img {...imgProps} />;
  },
}));

describe("NewsCard", () => {
  const defaultProps = {
    title: "Test Article Title",
    href: "/nieuws/test-article",
  };

  describe("Rendering", () => {
    it("renders as article element", () => {
      const { container } = render(<NewsCard {...defaultProps} />);
      expect(container.querySelector("article")).toBeInTheDocument();
    });

    it("renders title in a heading", () => {
      render(<NewsCard {...defaultProps} />);
      // EditorialHeading appends a trailing period — anchor with optional `.`
      // so partial matches don't mask future regressions in the title chain.
      expect(
        screen.getByRole("heading", {
          level: 3,
          name: /^Test Article Title\.?$/,
        }),
      ).toBeInTheDocument();
    });

    it("renders as a link with correct href", () => {
      render(<NewsCard {...defaultProps} />);
      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        "/nieuws/test-article",
      );
    });
  });

  describe("Image", () => {
    it("renders image when imageUrl provided", () => {
      render(
        <NewsCard
          {...defaultProps}
          imageUrl="/test.jpg"
          imageAlt="Test image"
        />,
      );
      expect(screen.getByRole("img")).toHaveAttribute("alt", "Test image");
    });

    it("uses title as alt when imageAlt not provided", () => {
      render(<NewsCard {...defaultProps} imageUrl="/test.jpg" />);
      expect(screen.getByRole("img")).toHaveAttribute(
        "alt",
        "Test Article Title",
      );
    });

    it("renders fallback placeholder when imageUrl not provided", () => {
      const { container } = render(<NewsCard {...defaultProps} />);
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(
        container.querySelector("[data-testid='newscard-image-fallback']"),
      ).toBeInTheDocument();
    });
  });

  describe("Badge, date and dek", () => {
    it("renders badge", () => {
      render(<NewsCard {...defaultProps} badge="Clubnieuws" />);
      expect(screen.getByText("Clubnieuws")).toBeInTheDocument();
    });

    it("renders date when no event meta is present", () => {
      render(<NewsCard {...defaultProps} date="5 mei 2025" />);
      expect(screen.getByText("5 mei 2025")).toBeInTheDocument();
    });

    it("renders optional dek paragraph", () => {
      render(
        <NewsCard
          {...defaultProps}
          dek="Korte samenvatting van het artikel."
        />,
      );
      expect(
        screen.getByText("Korte samenvatting van het artikel."),
      ).toBeInTheDocument();
    });

    it("omits dek when not provided", () => {
      render(<NewsCard {...defaultProps} />);
      expect(
        screen.queryByText("Korte samenvatting van het artikel."),
      ).not.toBeInTheDocument();
    });
  });

  describe("Variant heading size", () => {
    it("standard variant uses display-sm heading size", () => {
      render(<NewsCard {...defaultProps} variant="standard" />);
      expect(screen.getByRole("heading", { level: 3 })).toHaveAttribute(
        "data-size",
        "display-sm",
      );
    });

    it("featured variant uses display-md heading size", () => {
      render(<NewsCard {...defaultProps} variant="featured" />);
      expect(screen.getByRole("heading", { level: 3 })).toHaveAttribute(
        "data-size",
        "display-md",
      );
    });
  });

  describe("Bg + tone", () => {
    it("defaults to cream surface with ink heading + label tone", () => {
      render(<NewsCard {...defaultProps} badge="Clubnieuws" />);
      expect(screen.getByRole("link")).toHaveAttribute("data-bg", "cream");
      expect(screen.getByRole("heading", { level: 3 })).toHaveAttribute(
        "data-tone",
        "ink",
      );
      expect(screen.getByText("Clubnieuws")).toHaveAttribute(
        "data-tone",
        "ink",
      );
    });

    it("ink surface flips heading + label tone to cream", () => {
      render(<NewsCard {...defaultProps} bg="ink" badge="Clubnieuws" />);
      expect(screen.getByRole("link")).toHaveAttribute("data-bg", "ink");
      expect(screen.getByRole("heading", { level: 3 })).toHaveAttribute(
        "data-tone",
        "cream",
      );
      expect(screen.getByText("Clubnieuws")).toHaveAttribute(
        "data-tone",
        "cream",
      );
    });

    it("jersey-deep surface flips heading + label tone to cream", () => {
      render(
        <NewsCard {...defaultProps} bg="jersey-deep" badge="Clubnieuws" />,
      );
      expect(screen.getByRole("heading", { level: 3 })).toHaveAttribute(
        "data-tone",
        "cream",
      );
      expect(screen.getByText("Clubnieuws")).toHaveAttribute(
        "data-tone",
        "cream",
      );
    });
  });

  describe("Hover and interaction", () => {
    it("has group class for hover coordination", () => {
      const { container } = render(<NewsCard {...defaultProps} />);
      expect(container.querySelector("article")).toHaveClass("group");
    });

    it("interactive cards wire press-mode hover via TapedCard primitive", () => {
      // The press-down idiom is now centralised in <TapedCard
      // interactive="press">, which sets `--card-press-{x,y}` on hover
      // and collapses the offset shadow. Motion-reduce safety is
      // inherited from the `motion-safe:` Tailwind prefix.
      const { container } = render(<NewsCard {...defaultProps} />);
      const article = container.querySelector("article");
      expect(article).toHaveAttribute("data-interactive", "press");
      expect(article?.className).toMatch(
        /motion-safe:hover:\[--card-press-x:1px\]/,
      );
      expect(article?.className).toMatch(
        /motion-safe:hover:\[--card-press-y:1px\]/,
      );
      expect(article?.className).toMatch(/motion-safe:hover:shadow-none/);
    });

    it("non-interactive cards (no href) opt out of press-mode hover", () => {
      const { container } = render(<NewsCard title="Static" />);
      const article = container.querySelector("article");
      expect(article).toHaveAttribute("data-interactive", "false");
      expect(article?.className).not.toMatch(/--card-press-x/);
    });
  });

  describe("Event card features", () => {
    it("renders eventDate and eventTime when provided", () => {
      render(
        <NewsCard
          title="Sponsorfeest"
          href="/event/1"
          variant="featured"
          eventDate="15 apr"
          eventTime="19:00"
        />,
      );
      expect(screen.getByText("15 apr")).toBeInTheDocument();
      expect(screen.getByText("19:00")).toBeInTheDocument();
    });

    it("renders countdown when provided", () => {
      render(
        <NewsCard
          title="Sponsorfeest"
          href="/event/1"
          variant="featured"
          countdown="over 33 dagen"
        />,
      );
      expect(screen.getByText("over 33 dagen")).toBeInTheDocument();
    });

    it("opens external links in a new tab", () => {
      render(
        <NewsCard
          title="Sponsorfeest"
          href="https://facebook.com/event"
          variant="featured"
          isExternal
        />,
      );
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders as non-interactive (no link) when no href", () => {
      render(<NewsCard title="Sponsorfeest" variant="featured" />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  describe("Aspect ratio + rotation", () => {
    it("forwards aspectRatio to data-aspect on the link", () => {
      render(<NewsCard {...defaultProps} aspectRatio="square" />);
      expect(screen.getByRole("link")).toHaveAttribute("data-aspect", "square");
    });

    it("forwards rotation to data-rotation on the link", () => {
      render(<NewsCard {...defaultProps} rotation="b" />);
      expect(screen.getByRole("link")).toHaveAttribute("data-rotation", "b");
    });
  });

  describe("Flush-edge structure (R10)", () => {
    it("outer card uses padding=none — image flush with card edges", () => {
      const { container } = render(<NewsCard {...defaultProps} />);
      expect(container.querySelector("article")).toHaveAttribute(
        "data-padding",
        "none",
      );
    });

    it("renders the image inside a flat region — no nested TapedFigure", () => {
      const { container } = render(
        <NewsCard {...defaultProps} imageUrl="/x.jpg" />,
      );
      // No second `<figure>` (the legacy nested TapedFigure rendered one).
      expect(container.querySelectorAll("figure")).toHaveLength(0);
      // The flush image region carries the documented test id so the
      // structural intent is observable for VR-adjacent assertions.
      expect(
        container.querySelector('[data-testid="newscard-image-region"]'),
      ).toBeInTheDocument();
    });

    it("outer card carries two corner tape strips (warm TL + jersey TR by default)", () => {
      // Query by data-position rather than index — the render order of the
      // tape array is incidental and could change for z-stacking reasons.
      const { container } = render(<NewsCard {...defaultProps} />);
      const all = container.querySelectorAll("[data-color][data-position]");
      expect(all).toHaveLength(2);
      const left = container.querySelector(
        '[data-position="left"][data-color="warm"]',
      );
      const right = container.querySelector(
        '[data-position="right"][data-color="jersey"]',
      );
      expect(left).not.toBeNull();
      expect(right).not.toBeNull();
    });

    it("tapeColors prop overrides the default corner pairing", () => {
      const { container } = render(
        <NewsCard {...defaultProps} tapeColors={["cream", "ink"]} />,
      );
      expect(
        container.querySelector('[data-position="left"][data-color="cream"]'),
      ).not.toBeNull();
      expect(
        container.querySelector('[data-position="right"][data-color="ink"]'),
      ).not.toBeNull();
    });

    it("aspect-ratio class is applied to the image region", () => {
      const { container } = render(
        <NewsCard {...defaultProps} aspectRatio="portrait-3-4" />,
      );
      const region = container.querySelector<HTMLElement>(
        '[data-testid="newscard-image-region"]',
      );
      expect(region?.className).toContain("aspect-[3/4]");
      expect(region).toHaveAttribute("data-aspect", "portrait-3-4");
    });

    it("tape strips pick opposite rotation pool entries — varies card-to-card by title hash", () => {
      const { container } = render(<NewsCard {...defaultProps} />);
      const left = container.querySelector('[data-position="left"]');
      const right = container.querySelector('[data-position="right"]');
      const lr = left?.getAttribute("data-rotation");
      const rr = right?.getAttribute("data-rotation");
      // Each strip pins to a named pool entry (not "inherit") so
      // standalone usage outside a TapedCardGrid still varies.
      expect(lr).toMatch(/^[abcd]$/);
      expect(rr).toMatch(/^[abcd]$/);
      // The two strips on one card should never share a rotation —
      // the derivation offsets by 2 in the 4-entry pool.
      expect(lr).not.toBe(rr);
    });

    it("derivation is deterministic — same title yields the same rotation pair", () => {
      const a = render(<NewsCard {...defaultProps} />);
      const b = render(<NewsCard {...defaultProps} />);
      const aLeft = a.container
        .querySelector('[data-position="left"]')
        ?.getAttribute("data-rotation");
      const bLeft = b.container
        .querySelector('[data-position="left"]')
        ?.getAttribute("data-rotation");
      expect(aLeft).toBe(bLeft);
    });

    it("different titles distribute across the rotation pool", () => {
      // A handful of sample titles should land in more than one pool
      // bucket. Asserting "at least 2 distinct rotations" rather than
      // any specific assignment keeps the test robust to djb2 hash
      // changes while still proving the title actually feeds variation.
      const titles = [
        "Alpha overwinning in Zemst",
        "Tweede provinciale promotie",
        "Jeugd weekendverslag",
        "Sponsor partner-up 2026",
        "Sluiten van de transferperiode",
      ];
      const picks = new Set(
        titles.map((title) => {
          const { container } = render(<NewsCard title={title} href="/x" />);
          return container
            .querySelector('[data-position="left"]')
            ?.getAttribute("data-rotation");
        }),
      );
      expect(picks.size).toBeGreaterThanOrEqual(2);
    });

    it("outer card is NOT overflow-hidden — protects tape strips + focus ring", () => {
      // Tape strips translateY(-50%) so they straddle the top edge of
      // the card. Clipping the card would crop them in half. Same for
      // the cover Link's focus-visible outline-offset-2 — clipping
      // would hide the outline inside the card. Overflow-hidden is
      // scoped to the image region only.
      const { container } = render(<NewsCard {...defaultProps} />);
      const article = container.querySelector("article");
      expect(article?.className).not.toMatch(/overflow-hidden/);
      const imageRegion = container.querySelector<HTMLElement>(
        '[data-testid="newscard-image-region"]',
      );
      expect(imageRegion?.className).toMatch(/overflow-hidden/);
    });
  });

  describe("Custom className", () => {
    it("accepts custom className on the article", () => {
      const { container } = render(
        <NewsCard {...defaultProps} className="my-custom-class" />,
      );
      expect(container.querySelector("article")).toHaveClass("my-custom-class");
    });
  });
});
