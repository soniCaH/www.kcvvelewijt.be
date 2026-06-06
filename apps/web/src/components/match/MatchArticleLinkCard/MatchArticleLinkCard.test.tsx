/**
 * <MatchArticleLinkCard> component tests (6.B.d4 lock).
 *
 *  - Renders the cover image, kicker, title, lead, and CTA for a given article.
 *  - Links the whole card to `/nieuws/{slug}` with the title as accessible name.
 *  - Falls back to the striped placeholder when the article has no cover.
 *  - Renders the inline "Lees ook …" secondary link when supplied.
 *  - Returns `null` (auto-hide) when no article is supplied.
 *
 * The per-state selection logic (which article + which kicker) is covered
 * exhaustively in `selectMatchArticle.test.ts`; this file covers rendering.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  MatchArticleLinkCard,
  type MatchArticleLinkCardArticle,
} from "./MatchArticleLinkCard";
import { RECAP_KICKER, PREVIEW_KICKER } from "./selectMatchArticle";

const ARTICLE: MatchArticleLinkCardArticle = {
  title: "KCVV wint de derby in extremis",
  slug: "kcvv-wint-de-derby",
  coverImageUrl: "https://cdn.sanity.io/images/x/y/cover.jpg",
  lead: "Een late kopbal bezorgt KCVV de volle buit tegen de buren.",
};

describe("MatchArticleLinkCard", () => {
  describe("auto-hide branch", () => {
    it("returns null when no article is supplied", () => {
      const { container } = render(<MatchArticleLinkCard />);
      expect(container.firstChild).toBeNull();
    });

    it("returns null when article is explicitly null", () => {
      const { container } = render(<MatchArticleLinkCard article={null} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe("recap rendering", () => {
    it("renders the kicker, title, lead, and CTA", () => {
      render(<MatchArticleLinkCard article={ARTICLE} kicker={RECAP_KICKER} />);
      expect(screen.getByText(RECAP_KICKER)).toBeInTheDocument();
      expect(
        // <EditorialHeading> appends a trailing period to string children
        // ("period suffix" per the 6.B.d4 lock), so match by substring.
        screen.getByRole("heading", { name: new RegExp(ARTICLE.title) }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Een late kopbal/)).toBeInTheDocument();
      expect(screen.getByText(/Lees het hele verhaal/)).toBeInTheDocument();
    });

    it("links the whole card to the article with the title as accessible name", () => {
      render(<MatchArticleLinkCard article={ARTICLE} kicker={RECAP_KICKER} />);
      const link = screen.getByRole("link", { name: ARTICLE.title });
      expect(link).toHaveAttribute("href", "/nieuws/kcvv-wint-de-derby");
    });

    it("renders the cover image with the title as alt text", () => {
      render(<MatchArticleLinkCard article={ARTICLE} kicker={RECAP_KICKER} />);
      expect(screen.getByAltText(ARTICLE.title)).toBeInTheDocument();
    });
  });

  describe("preview rendering", () => {
    it("renders the preview kicker copy", () => {
      render(
        <MatchArticleLinkCard
          article={{ ...ARTICLE, title: "Op naar de derby" }}
          kicker={PREVIEW_KICKER}
        />,
      );
      expect(screen.getByText(PREVIEW_KICKER)).toBeInTheDocument();
    });
  });

  describe("cover fallback", () => {
    it("renders the striped placeholder when the article has no cover image", () => {
      render(
        <MatchArticleLinkCard
          article={{ ...ARTICLE, coverImageUrl: null }}
          kicker={RECAP_KICKER}
        />,
      );
      expect(
        screen.getByTestId("match-article-link-card-image-fallback"),
      ).toBeInTheDocument();
      expect(screen.queryByAltText(ARTICLE.title)).not.toBeInTheDocument();
    });
  });

  describe("secondary inline link", () => {
    it("renders the 'Lees ook …' link to the non-dominant article when supplied", () => {
      render(
        <MatchArticleLinkCard
          article={ARTICLE}
          kicker={RECAP_KICKER}
          secondary={{
            slug: "op-naar-de-derby",
            label: "Lees ook de voorbeschouwing",
          }}
        />,
      );
      const link = screen.getByTestId("match-article-secondary-link");
      expect(link).toHaveAttribute("href", "/nieuws/op-naar-de-derby");
      expect(link).toHaveTextContent("Lees ook de voorbeschouwing");
    });

    it("omits the secondary link when not supplied", () => {
      render(<MatchArticleLinkCard article={ARTICLE} kicker={RECAP_KICKER} />);
      expect(
        screen.queryByTestId("match-article-secondary-link"),
      ).not.toBeInTheDocument();
    });
  });

  describe("optional fields", () => {
    it("renders without a lead when none is provided", () => {
      render(
        <MatchArticleLinkCard
          article={{ ...ARTICLE, lead: null }}
          kicker={RECAP_KICKER}
        />,
      );
      expect(
        // <EditorialHeading> appends a trailing period to string children
        // ("period suffix" per the 6.B.d4 lock), so match by substring.
        screen.getByRole("heading", { name: new RegExp(ARTICLE.title) }),
      ).toBeInTheDocument();
      expect(screen.queryByText(/Een late kopbal/)).not.toBeInTheDocument();
    });
  });
});
