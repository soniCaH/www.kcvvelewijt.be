import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RelatedContentSlider } from "./RelatedContentSlider";
import type {
  RelatedArticleItem,
  RelatedPageItem,
  RelatedPlayerItem,
  RelatedTeamItem,
  RelatedStaffItem,
} from "../types";

const article: RelatedArticleItem = {
  type: "article",
  id: "art-1",
  title: "Wedstrijdverslag",
  slug: "wedstrijdverslag",
  imageUrl: null,
  date: "2026-03-20T10:00:00Z",
  excerpt: "Het verslag van de wedstrijd.",
};

const page: RelatedPageItem = {
  type: "page",
  id: "page-1",
  title: "Clubinfo",
  slug: "clubinfo",
  imageUrl: null,
  excerpt: "Info over de club.",
};

const player: RelatedPlayerItem = {
  type: "player",
  id: "player-1",
  firstName: "Jan",
  lastName: "Janssens",
  position: "Aanvaller",
  imageUrl: null,
  psdId: "12345",
};

const team: RelatedTeamItem = {
  type: "team",
  id: "team-1",
  name: "A-ploeg",
  slug: "a-ploeg",
  imageUrl: null,
  tagline: null,
};

const staff: RelatedStaffItem = {
  type: "staff",
  id: "staff-1",
  firstName: "Piet",
  lastName: "Pieters",
  role: "Trainer",
  imageUrl: null,
};

describe("RelatedContentSlider", () => {
  it("renders section heading 'Gerelateerd'", () => {
    render(<RelatedContentSlider items={[article]} />);

    expect(screen.getByText("Gerelateerd")).toBeInTheDocument();
  });

  it("returns null when items array is empty", () => {
    const { container } = render(<RelatedContentSlider items={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it("renders correct card variant per item type", () => {
    render(<RelatedContentSlider items={[article, player, team]} />);

    expect(screen.getByText("Wedstrijdverslag")).toBeInTheDocument();
    expect(screen.getByText("Jan Janssens")).toBeInTheDocument();
    expect(screen.getByText("A-ploeg")).toBeInTheDocument();
  });

  it("orders items: articles/pages → players → staff → teams", () => {
    // Pass in reverse order — component should reorder
    const items = [team, staff, player, page, article];
    const { container } = render(<RelatedContentSlider items={items} />);

    const cards = container.querySelectorAll("[data-related-card]");
    const types = Array.from(cards).map((c) =>
      c.getAttribute("data-related-card"),
    );

    expect(types).toEqual(["article", "page", "player", "staff", "team"]);
  });

  it("renders all 5 variant types in a mixed array", () => {
    render(
      <RelatedContentSlider items={[article, page, player, team, staff]} />,
    );

    expect(screen.getByText("Wedstrijdverslag")).toBeInTheDocument();
    expect(screen.getByText("Clubinfo")).toBeInTheDocument();
    expect(screen.getByText("Jan Janssens")).toBeInTheDocument();
    expect(screen.getByText("A-ploeg")).toBeInTheDocument();
    expect(screen.getByText("Piet Pieters")).toBeInTheDocument();
  });
});
