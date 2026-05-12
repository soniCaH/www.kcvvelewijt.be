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

    it("listing variant uses display-sm heading size", () => {
      render(<NewsCard {...defaultProps} variant="listing" />);
      expect(screen.getByRole("heading", { level: 3 })).toHaveAttribute(
        "data-size",
        "display-sm",
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

    it("applies canonical press-down translate on hover when interactive", () => {
      const { container } = render(<NewsCard {...defaultProps} />);
      const article = container.querySelector("article");
      expect(article?.className).toMatch(/hover:translate-x-1/);
      expect(article?.className).toMatch(/hover:translate-y-1/);
      expect(article?.className).toMatch(/hover:shadow-none/);
    });

    it("includes motion-reduce reset for press-down", () => {
      const { container } = render(<NewsCard {...defaultProps} />);
      const article = container.querySelector("article");
      expect(article?.className).toMatch(/motion-reduce:hover:translate-x-0/);
      expect(article?.className).toMatch(/motion-reduce:hover:translate-y-0/);
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

  describe("Custom className", () => {
    it("accepts custom className on the article", () => {
      const { container } = render(
        <NewsCard {...defaultProps} className="my-custom-class" />,
      );
      expect(container.querySelector("article")).toHaveClass("my-custom-class");
    });
  });
});
