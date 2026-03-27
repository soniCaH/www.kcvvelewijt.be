import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RelatedContentCard } from "./RelatedContentCard";
import type {
  RelatedArticleItem,
  RelatedPageItem,
  RelatedPlayerItem,
  RelatedTeamItem,
  RelatedStaffItem,
} from "../types";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";

const trackEventMock = vi.mocked(trackEvent);

const articleItem: RelatedArticleItem = {
  type: "article",
  source: "editorial",
  id: "art-1",
  title: "Interview met de kapitein",
  slug: "interview-kapitein",
  imageUrl: "https://cdn.sanity.io/images/article.jpg",
  date: "2026-03-20T10:00:00Z",
  excerpt: "Een exclusief interview met onze kapitein.",
};

const pageItem: RelatedPageItem = {
  type: "page",
  source: "ai",
  id: "page-1",
  title: "Over de club",
  slug: "over-de-club",
  imageUrl: null,
  excerpt: "Alles over KCVV Elewijt.",
};

const playerItem: RelatedPlayerItem = {
  type: "player",
  source: "reference",
  id: "player-1",
  firstName: "Jan",
  lastName: "Janssens",
  position: "Aanvaller",
  imageUrl: "https://cdn.sanity.io/images/player.jpg",
  psdId: "12345",
};

const teamItem: RelatedTeamItem = {
  type: "team",
  source: "reference",
  id: "team-1",
  name: "A-ploeg",
  slug: "a-ploeg",
  imageUrl: "https://cdn.sanity.io/images/team.jpg",
  tagline: "Eerste ploeg van KCVV Elewijt",
};

const staffItem: RelatedStaffItem = {
  type: "staff",
  source: "reference",
  id: "staff-1",
  firstName: "Piet",
  lastName: "Pieters",
  role: "Hoofdtrainer",
  imageUrl: "https://cdn.sanity.io/images/staff.jpg",
};

describe("RelatedContentCard", () => {
  beforeEach(() => {
    trackEventMock.mockClear();
  });

  describe("article variant", () => {
    it("renders title, date, and excerpt", () => {
      render(
        <RelatedContentCard
          item={articleItem}
          position={1}
          pageType="article"
          pageSlug="current-article"
        />,
      );

      expect(screen.getByText("Interview met de kapitein")).toBeInTheDocument();
      expect(
        screen.getByText("Een exclusief interview met onze kapitein."),
      ).toBeInTheDocument();
      expect(screen.getByText("20 maart 2026")).toBeInTheDocument();
    });

    it("links to /nieuws/[slug]", () => {
      render(
        <RelatedContentCard
          item={articleItem}
          position={1}
          pageType="article"
          pageSlug="current-article"
        />,
      );

      const link = screen.getByText("Interview met de kapitein").closest("a");
      expect(link).toHaveAttribute("href", "/nieuws/interview-kapitein");
    });

    it("renders cover image when available", () => {
      render(
        <RelatedContentCard
          item={articleItem}
          position={1}
          pageType="article"
          pageSlug="current-article"
        />,
      );

      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("alt", "Interview met de kapitein");
    });

    it("fires related_content_click with correct parameters on click", async () => {
      render(
        <RelatedContentCard
          item={articleItem}
          position={2}
          pageType="article"
          pageSlug="current-article"
        />,
      );

      await userEvent.click(screen.getByText("Interview met de kapitein"));

      expect(trackEventMock).toHaveBeenCalledWith("related_content_click", {
        source: "editorial",
        target_type: "article",
        target_slug: "interview-kapitein",
        position: 2,
        page_type: "article",
        page_slug: "current-article",
      });
    });
  });

  describe("page variant", () => {
    it("renders title and excerpt", () => {
      render(
        <RelatedContentCard
          item={pageItem}
          position={1}
          pageType="article"
          pageSlug="current-article"
        />,
      );

      expect(screen.getByText("Over de club")).toBeInTheDocument();
      expect(screen.getByText("Alles over KCVV Elewijt.")).toBeInTheDocument();
    });

    it("links to /[slug]", () => {
      render(
        <RelatedContentCard
          item={pageItem}
          position={1}
          pageType="article"
          pageSlug="current-article"
        />,
      );

      const link = screen.getByText("Over de club").closest("a");
      expect(link).toHaveAttribute("href", "/over-de-club");
    });

    it("fires related_content_click with source from item on click", async () => {
      render(
        <RelatedContentCard
          item={pageItem}
          position={1}
          pageType="article"
          pageSlug="current-article"
        />,
      );

      await userEvent.click(screen.getByText("Over de club"));

      expect(trackEventMock).toHaveBeenCalledWith("related_content_click", {
        source: "ai",
        target_type: "page",
        target_slug: "over-de-club",
        position: 1,
        page_type: "article",
        page_slug: "current-article",
      });
    });
  });

  describe("player variant", () => {
    it("renders name and position", () => {
      render(
        <RelatedContentCard
          item={playerItem}
          position={1}
          pageType="article"
          pageSlug="current-article"
        />,
      );

      expect(screen.getByText("Jan Janssens")).toBeInTheDocument();
      expect(screen.getByText("Aanvaller")).toBeInTheDocument();
    });

    it("links to /spelers/[psdId]", () => {
      render(
        <RelatedContentCard
          item={playerItem}
          position={1}
          pageType="article"
          pageSlug="current-article"
        />,
      );

      const link = screen.getByText("Jan Janssens").closest("a");
      expect(link).toHaveAttribute("href", "/spelers/12345");
    });

    it("renders player photo when available", () => {
      render(
        <RelatedContentCard
          item={playerItem}
          position={1}
          pageType="article"
          pageSlug="current-article"
        />,
      );

      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("alt", "Jan Janssens");
    });

    it("fires related_content_click on click", async () => {
      render(
        <RelatedContentCard
          item={playerItem}
          position={3}
          pageType="article"
          pageSlug="current-article"
        />,
      );

      await userEvent.click(screen.getByText("Jan Janssens"));

      expect(trackEventMock).toHaveBeenCalledWith("related_content_click", {
        source: "reference",
        target_type: "player",
        target_slug: "12345",
        position: 3,
        page_type: "article",
        page_slug: "current-article",
      });
    });
  });

  describe("team variant", () => {
    it("renders name and tagline", () => {
      render(
        <RelatedContentCard
          item={teamItem}
          position={1}
          pageType="article"
          pageSlug="current-article"
        />,
      );

      expect(screen.getByText("A-ploeg")).toBeInTheDocument();
      expect(
        screen.getByText("Eerste ploeg van KCVV Elewijt"),
      ).toBeInTheDocument();
    });

    it("links to /ploegen/[slug]", () => {
      render(
        <RelatedContentCard
          item={teamItem}
          position={1}
          pageType="article"
          pageSlug="current-article"
        />,
      );

      const link = screen.getByText("A-ploeg").closest("a");
      expect(link).toHaveAttribute("href", "/ploegen/a-ploeg");
    });
  });

  describe("staff variant", () => {
    it("renders name and role", () => {
      render(
        <RelatedContentCard
          item={staffItem}
          position={1}
          pageType="article"
          pageSlug="current-article"
        />,
      );

      expect(screen.getByText("Piet Pieters")).toBeInTheDocument();
      expect(screen.getByText("Hoofdtrainer")).toBeInTheDocument();
    });

    it("does not render a link (staff has no detail page)", () => {
      const { container } = render(
        <RelatedContentCard
          item={staffItem}
          position={1}
          pageType="article"
          pageSlug="current-article"
        />,
      );

      expect(container.querySelector("a")).toBeNull();
    });

    it("renders staff photo when available", () => {
      render(
        <RelatedContentCard
          item={staffItem}
          position={1}
          pageType="article"
          pageSlug="current-article"
        />,
      );

      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("alt", "Piet Pieters");
    });
  });

  describe("consistent dimensions", () => {
    it("all variants have the same fixed width class", () => {
      const { container: c1 } = render(
        <RelatedContentCard
          item={articleItem}
          position={1}
          pageType="article"
          pageSlug="test"
        />,
      );
      const { container: c2 } = render(
        <RelatedContentCard
          item={playerItem}
          position={2}
          pageType="article"
          pageSlug="test"
        />,
      );
      const { container: c3 } = render(
        <RelatedContentCard
          item={teamItem}
          position={3}
          pageType="article"
          pageSlug="test"
        />,
      );

      const card1 = c1.firstChild as HTMLElement;
      const card2 = c2.firstChild as HTMLElement;
      const card3 = c3.firstChild as HTMLElement;

      expect(card1.className).toContain("w-64");
      expect(card2.className).toContain("w-64");
      expect(card3.className).toContain("w-64");
    });
  });
});
