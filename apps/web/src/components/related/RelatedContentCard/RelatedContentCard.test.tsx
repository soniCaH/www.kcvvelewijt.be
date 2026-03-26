import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RelatedContentCard } from "./RelatedContentCard";
import type {
  RelatedArticleItem,
  RelatedPageItem,
  RelatedPlayerItem,
  RelatedTeamItem,
  RelatedStaffItem,
} from "../types";

const articleItem: RelatedArticleItem = {
  type: "article",
  id: "art-1",
  title: "Interview met de kapitein",
  slug: "interview-kapitein",
  imageUrl: "https://cdn.sanity.io/images/article.jpg",
  date: "2026-03-20T10:00:00Z",
  excerpt: "Een exclusief interview met onze kapitein.",
};

const pageItem: RelatedPageItem = {
  type: "page",
  id: "page-1",
  title: "Over de club",
  slug: "over-de-club",
  imageUrl: null,
  excerpt: "Alles over KCVV Elewijt.",
};

const playerItem: RelatedPlayerItem = {
  type: "player",
  id: "player-1",
  firstName: "Jan",
  lastName: "Janssens",
  position: "Aanvaller",
  imageUrl: "https://cdn.sanity.io/images/player.jpg",
  psdId: "12345",
};

const teamItem: RelatedTeamItem = {
  type: "team",
  id: "team-1",
  name: "A-ploeg",
  slug: "a-ploeg",
  imageUrl: "https://cdn.sanity.io/images/team.jpg",
  tagline: "Eerste ploeg van KCVV Elewijt",
};

const staffItem: RelatedStaffItem = {
  type: "staff",
  id: "staff-1",
  firstName: "Piet",
  lastName: "Pieters",
  role: "Hoofdtrainer",
  imageUrl: "https://cdn.sanity.io/images/staff.jpg",
};

describe("RelatedContentCard", () => {
  describe("article variant", () => {
    it("renders title, date, and excerpt", () => {
      render(<RelatedContentCard item={articleItem} />);

      expect(screen.getByText("Interview met de kapitein")).toBeInTheDocument();
      expect(
        screen.getByText("Een exclusief interview met onze kapitein."),
      ).toBeInTheDocument();
      expect(screen.getByText("20 maart 2026")).toBeInTheDocument();
    });

    it("links to /nieuws/[slug]", () => {
      render(<RelatedContentCard item={articleItem} />);

      const link = screen.getByText("Interview met de kapitein").closest("a");
      expect(link).toHaveAttribute("href", "/nieuws/interview-kapitein");
    });

    it("renders cover image when available", () => {
      render(<RelatedContentCard item={articleItem} />);

      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("alt", "Interview met de kapitein");
    });
  });

  describe("page variant", () => {
    it("renders title and excerpt", () => {
      render(<RelatedContentCard item={pageItem} />);

      expect(screen.getByText("Over de club")).toBeInTheDocument();
      expect(screen.getByText("Alles over KCVV Elewijt.")).toBeInTheDocument();
    });

    it("links to /[slug]", () => {
      render(<RelatedContentCard item={pageItem} />);

      const link = screen.getByText("Over de club").closest("a");
      expect(link).toHaveAttribute("href", "/over-de-club");
    });
  });

  describe("player variant", () => {
    it("renders name and position", () => {
      render(<RelatedContentCard item={playerItem} />);

      expect(screen.getByText("Jan Janssens")).toBeInTheDocument();
      expect(screen.getByText("Aanvaller")).toBeInTheDocument();
    });

    it("links to /spelers/[psdId]", () => {
      render(<RelatedContentCard item={playerItem} />);

      const link = screen.getByText("Jan Janssens").closest("a");
      expect(link).toHaveAttribute("href", "/spelers/12345");
    });

    it("renders player photo when available", () => {
      render(<RelatedContentCard item={playerItem} />);

      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("alt", "Jan Janssens");
    });
  });

  describe("team variant", () => {
    it("renders name and tagline", () => {
      render(<RelatedContentCard item={teamItem} />);

      expect(screen.getByText("A-ploeg")).toBeInTheDocument();
      expect(
        screen.getByText("Eerste ploeg van KCVV Elewijt"),
      ).toBeInTheDocument();
    });

    it("links to /team/[slug]", () => {
      render(<RelatedContentCard item={teamItem} />);

      const link = screen.getByText("A-ploeg").closest("a");
      expect(link).toHaveAttribute("href", "/team/a-ploeg");
    });
  });

  describe("staff variant", () => {
    it("renders name and role", () => {
      render(<RelatedContentCard item={staffItem} />);

      expect(screen.getByText("Piet Pieters")).toBeInTheDocument();
      expect(screen.getByText("Hoofdtrainer")).toBeInTheDocument();
    });

    it("does not render a link (staff has no detail page)", () => {
      const { container } = render(<RelatedContentCard item={staffItem} />);

      expect(container.querySelector("a")).toBeNull();
    });

    it("renders staff photo when available", () => {
      render(<RelatedContentCard item={staffItem} />);

      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("alt", "Piet Pieters");
    });
  });

  describe("consistent dimensions", () => {
    it("all variants have the same fixed width class", () => {
      const { container: c1 } = render(
        <RelatedContentCard item={articleItem} />,
      );
      const { container: c2 } = render(
        <RelatedContentCard item={playerItem} />,
      );
      const { container: c3 } = render(<RelatedContentCard item={teamItem} />);

      const card1 = c1.firstChild as HTMLElement;
      const card2 = c2.firstChild as HTMLElement;
      const card3 = c3.firstChild as HTMLElement;

      expect(card1.className).toContain("w-64");
      expect(card2.className).toContain("w-64");
      expect(card3.className).toContain("w-64");
    });
  });
});
