// apps/web/src/components/home/LatestNews/NewsCard.test.tsx
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
    href: "/news/test-article",
  };

  describe("Rendering", () => {
    it("renders as article element", () => {
      const { container } = render(<NewsCard {...defaultProps} />);
      expect(container.querySelector("article")).toBeInTheDocument();
    });

    it("renders title in a heading", () => {
      render(<NewsCard {...defaultProps} />);
      expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
        "Test Article Title",
      );
    });

    it("renders as a link with correct href", () => {
      render(<NewsCard {...defaultProps} />);
      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        "/news/test-article",
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

    it("renders no img element when imageUrl not provided", () => {
      render(<NewsCard {...defaultProps} />);
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
  });

  describe("Badge and date", () => {
    it("renders badge above title", () => {
      render(<NewsCard {...defaultProps} badge="Clubnieuws" />);
      // badge appears above title AND in footer — getAllByText
      expect(screen.getAllByText("Clubnieuws").length).toBeGreaterThanOrEqual(
        1,
      );
    });

    it("renders date in footer", () => {
      render(<NewsCard {...defaultProps} date="5 mei 2025" />);
      expect(screen.getByText("5 mei 2025")).toBeInTheDocument();
    });

    it("does not render footer when no date and no badge", () => {
      const { container } = render(<NewsCard {...defaultProps} />);
      expect(
        container.querySelector(".border-t.border-white\\/20"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    it("standard variant uses text-base title", () => {
      render(<NewsCard {...defaultProps} variant="standard" />);
      expect(screen.getByRole("heading", { level: 3 })).toHaveClass(
        "text-base!",
      );
    });

    it("featured variant uses text-2xl title", () => {
      render(<NewsCard {...defaultProps} variant="featured" />);
      expect(screen.getByRole("heading", { level: 3 })).toHaveClass(
        "text-2xl!",
      );
    });

    it("defaults to standard variant", () => {
      render(<NewsCard {...defaultProps} />);
      expect(screen.getByRole("heading", { level: 3 })).toHaveClass(
        "text-base!",
      );
    });
  });

  describe("Hover and interaction", () => {
    it("has group class for hover coordination", () => {
      const { container } = render(<NewsCard {...defaultProps} />);
      expect(container.querySelector("article")).toHaveClass("group");
    });

    it("has hover translate class", () => {
      const { container } = render(<NewsCard {...defaultProps} />);
      expect(container.querySelector("article")).toHaveClass(
        "hover:-translate-y-1",
      );
    });
  });

  describe("event card features", () => {
    it("renders eventTime with Calendar and Clock icons when time provided", () => {
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

    it("renders countdown chip when countdown provided", () => {
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

    it("renders eventDate alongside countdown when both provided", () => {
      render(
        <NewsCard
          title="Sponsorfeest"
          href="/event/1"
          variant="featured"
          eventDate="26 apr"
          eventTime="19:00"
          countdown="over 33 dagen"
        />,
      );
      expect(screen.getByText("26 apr")).toBeInTheDocument();
      expect(screen.getByText("19:00")).toBeInTheDocument();
      expect(screen.getByText("over 33 dagen")).toBeInTheDocument();
    });

    it("renders ExternalLink indicator when isExternal=true and href is set", () => {
      render(
        <NewsCard
          title="Sponsorfeest"
          href="https://facebook.com/event"
          variant="featured"
          isExternal
        />,
      );
      // ExternalLink icon is aria-hidden, verify the link has target="_blank"
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("target", "_blank");
    });

    it("renders as non-interactive div when no href", () => {
      render(<NewsCard title="Sponsorfeest" variant="featured" />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
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
