import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamsHero } from "./TeamsHero";
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
  _id: "a-team",
  name: "KCVV Elewijt A",
  slug: "kcvv-elewijt-a",
  age: "A",
  division: "3B",
  divisionFull: "3de Provinciale B",
  tagline: null,
  teamImageUrl: "https://example.com/team.jpg",
  staff: null,
};

describe("TeamsHero", () => {
  it("renders the team name with green accent", () => {
    render(<TeamsHero team={team} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/KCVV/);
    expect(heading).toHaveTextContent(/Elewijt/);
  });

  it("renders the label 'Eerste ploeg'", () => {
    render(<TeamsHero team={team} />);
    expect(screen.getByText("Eerste ploeg")).toBeInTheDocument();
  });

  it("renders the division", () => {
    render(<TeamsHero team={team} />);
    expect(screen.getByText("3de Provinciale B")).toBeInTheDocument();
  });

  it("renders CTA link to team page", () => {
    render(<TeamsHero team={team} />);
    const link = screen.getByRole("link", { name: /bekijk de a-ploeg/i });
    expect(link).toHaveAttribute("href", "/team/kcvv-elewijt-a");
  });

  it("renders team photo when available", () => {
    render(<TeamsHero team={team} />);
    const img = screen.getByAltText("Team foto KCVV Elewijt A");
    expect(img).toHaveAttribute("src", "https://example.com/team.jpg");
  });

  it("does not render image when teamImageUrl is null", () => {
    render(<TeamsHero team={{ ...team, teamImageUrl: null }} />);
    expect(
      screen.queryByAltText("Team foto KCVV Elewijt A"),
    ).not.toBeInTheDocument();
  });

  it("does not render division when divisionFull is null", () => {
    render(<TeamsHero team={{ ...team, divisionFull: null }} />);
    expect(screen.queryByText("3de Provinciale B")).not.toBeInTheDocument();
  });
});
