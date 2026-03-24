import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamFeaturedCard } from "./TeamFeaturedCard";
import type { TeamLandingItem } from "@/lib/utils/group-teams";

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: Record<string, unknown>) => (
    <img src={src as string} alt={alt as string} {...props} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const team: TeamLandingItem = {
  _id: "b-team",
  name: "KCVV Elewijt B",
  slug: "kcvv-elewijt-b",
  age: "B",
  division: "4C",
  divisionFull: "4de Provinciale C",
  tagline: null,
  teamImageUrl: "https://example.com/team-b.jpg",
  staff: null,
};

describe("TeamFeaturedCard", () => {
  it("renders the team name", () => {
    render(<TeamFeaturedCard team={team} label="Tweede ploeg" />);
    expect(screen.getByText("KCVV Elewijt B")).toBeInTheDocument();
  });

  it("renders the label", () => {
    render(<TeamFeaturedCard team={team} label="Tweede ploeg" />);
    expect(screen.getByText("Tweede ploeg")).toBeInTheDocument();
  });

  it("renders the division", () => {
    render(<TeamFeaturedCard team={team} label="Tweede ploeg" />);
    expect(screen.getByText("4de Provinciale C")).toBeInTheDocument();
  });

  it("renders CTA link to team page", () => {
    render(<TeamFeaturedCard team={team} label="Tweede ploeg" />);
    const link = screen.getByRole("link", { name: /bekijk de ploeg/i });
    expect(link).toHaveAttribute("href", "/team/kcvv-elewijt-b");
  });

  it("renders team photo when available", () => {
    render(<TeamFeaturedCard team={team} label="Tweede ploeg" />);
    const img = screen.getByAltText("Team foto KCVV Elewijt B");
    expect(img).toBeInTheDocument();
  });

  it("renders fallback icon when no photo", () => {
    const { container } = render(
      <TeamFeaturedCard
        team={{ ...team, teamImageUrl: null }}
        label="Tweede ploeg"
      />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
  });

  it("does not render division when divisionFull is null", () => {
    render(
      <TeamFeaturedCard
        team={{ ...team, divisionFull: null }}
        label="Tweede ploeg"
      />,
    );
    expect(screen.queryByText("4de Provinciale C")).not.toBeInTheDocument();
  });
});
