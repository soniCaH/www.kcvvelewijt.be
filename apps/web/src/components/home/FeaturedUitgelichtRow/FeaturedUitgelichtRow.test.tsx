// apps/web/src/components/home/FeaturedUitgelichtRow/FeaturedUitgelichtRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ImageProps } from "next/image";
import {
  FeaturedUitgelichtRow,
  type UitgelichtArticle,
} from "./FeaturedUitgelichtRow";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...props }: ImageProps) => {
    const imgProps = { alt, src: typeof src === "string" ? src : "", ...props };
    return <img {...imgProps} />;
  },
}));

const sampleArticle = (
  over: Partial<UitgelichtArticle> = {},
): UitgelichtArticle => ({
  href: "/nieuws/test",
  title: "Test artikel",
  imageUrl: "/test.jpg",
  imageAlt: "Test image",
  date: "14 mei 2026",
  ...over,
});

describe("FeaturedUitgelichtRow", () => {
  describe("Drop-if-empty", () => {
    it("returns null when articles is empty", () => {
      const { container } = render(<FeaturedUitgelichtRow articles={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders the section header when at least 1 article is present", () => {
      render(
        <FeaturedUitgelichtRow articles={[sampleArticle({ href: "/a" })]} />,
      );
      // EditorialHeading renders the emphasis span as a separate child,
      // which the accessibility tree exposes with surrounding whitespace
      // ("Uit gelicht ."). Assert the level-2 heading exists and its
      // collapsed text matches the intended copy regardless of inter-span
      // spacing.
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading.textContent?.replace(/\s+/g, "")).toBe("Uitgelicht.");
    });
  });

  describe("Card rendering", () => {
    it("renders one NewsCard per article (up to 3)", () => {
      const articles = [
        sampleArticle({ href: "/a", title: "A" }),
        sampleArticle({ href: "/b", title: "B" }),
        sampleArticle({ href: "/c", title: "C" }),
      ];
      render(<FeaturedUitgelichtRow articles={articles} />);
      expect(screen.getAllByRole("article")).toHaveLength(3);
    });

    it("caps at 3 even when the caller passes more", () => {
      const articles = Array.from({ length: 5 }, (_, i) =>
        sampleArticle({ href: `/a-${i}`, title: `A-${i}` }),
      );
      render(<FeaturedUitgelichtRow articles={articles} />);
      expect(screen.getAllByRole("article")).toHaveLength(3);
    });

    it("renders the featured variant on all cards (display-md heading)", () => {
      render(
        <FeaturedUitgelichtRow articles={[sampleArticle({ href: "/a" })]} />,
      );
      // Title heading is level 3 inside the card (h2 is the section header).
      expect(screen.getByRole("heading", { level: 3 })).toHaveAttribute(
        "data-size",
        "display-md",
      );
    });

    it("renders the featured count gracefully at N=1 and N=2", () => {
      const one = render(
        <FeaturedUitgelichtRow articles={[sampleArticle({ href: "/a" })]} />,
      );
      expect(one.container.querySelectorAll("article")).toHaveLength(1);
      one.unmount();

      const two = render(
        <FeaturedUitgelichtRow
          articles={[
            sampleArticle({ href: "/a" }),
            sampleArticle({ href: "/b" }),
          ]}
        />,
      );
      expect(two.container.querySelectorAll("article")).toHaveLength(2);
    });
  });

  describe("Per-articleType backgrounds (R3.B BG_BY_TYPE)", () => {
    it("maps transfer → jersey-deep", () => {
      render(
        <FeaturedUitgelichtRow
          articles={[sampleArticle({ href: "/a", articleType: "transfer" })]}
        />,
      );
      expect(screen.getByRole("link")).toHaveAttribute(
        "data-bg",
        "jersey-deep",
      );
    });

    it("maps interview / announcement / event → cream", () => {
      const types = ["interview", "announcement", "event"] as const;
      for (const type of types) {
        const { unmount } = render(
          <FeaturedUitgelichtRow
            articles={[sampleArticle({ href: `/${type}`, articleType: type })]}
          />,
        );
        expect(screen.getByRole("link")).toHaveAttribute("data-bg", "cream");
        unmount();
      }
    });

    it("falls back to cream when articleType is missing (legacy articles)", () => {
      render(
        <FeaturedUitgelichtRow
          articles={[sampleArticle({ href: "/a", articleType: null })]}
        />,
      );
      expect(screen.getByRole("link")).toHaveAttribute("data-bg", "cream");
    });
  });

  describe("Optional dek (graceful-omit)", () => {
    it("renders the dek paragraph when provided", () => {
      render(
        <FeaturedUitgelichtRow
          articles={[
            sampleArticle({
              href: "/a",
              dek: "Korte samenvatting.",
            }),
          ]}
        />,
      );
      expect(screen.getByText("Korte samenvatting.")).toBeInTheDocument();
    });

    it("omits the dek paragraph when not provided", () => {
      render(
        <FeaturedUitgelichtRow articles={[sampleArticle({ href: "/a" })]} />,
      );
      expect(screen.queryByText("Korte samenvatting.")).not.toBeInTheDocument();
    });
  });
});
