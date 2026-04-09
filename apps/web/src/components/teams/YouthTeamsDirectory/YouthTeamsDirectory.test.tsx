import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { YouthTeamsDirectory } from "./YouthTeamsDirectory";
import type { YouthDivisionGroup } from "@/lib/utils/group-teams";

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

const divisions: YouthDivisionGroup[] = [
  {
    label: "Bovenbouw",
    range: "U17–U21",
    teams: [
      {
        _id: "u21",
        name: "U21",
        slug: "u21",
        age: "U21",
        division: null,
        divisionFull: null,
        tagline: null,
        teamImageUrl: null,
        staff: null,
      },
    ],
  },
  {
    label: "Middenbouw",
    range: "U12–U16",
    teams: [
      {
        _id: "u15",
        name: "U15",
        slug: "u15",
        age: "U15",
        division: null,
        divisionFull: null,
        tagline: null,
        teamImageUrl: null,
        staff: null,
      },
      {
        _id: "u13",
        name: "U13",
        slug: "u13",
        age: "U13",
        division: null,
        divisionFull: null,
        tagline: null,
        teamImageUrl: null,
        staff: null,
      },
    ],
  },
  {
    label: "Onderbouw",
    range: "U6–U11",
    teams: [],
  },
];

describe("YouthTeamsDirectory", () => {
  it("renders section header", () => {
    render(<YouthTeamsDirectory divisions={divisions} />);
    expect(screen.getByText("Jeugdploegen")).toBeInTheDocument();
  });

  it("renders all division group labels", () => {
    render(<YouthTeamsDirectory divisions={divisions} />);
    expect(screen.getByText(/Bovenbouw/)).toBeInTheDocument();
    expect(screen.getByText(/Middenbouw/)).toBeInTheDocument();
    expect(screen.getByText(/Onderbouw/)).toBeInTheDocument();
  });

  it("renders team cards with links", () => {
    render(<YouthTeamsDirectory divisions={divisions} />);
    const u21Link = screen.getByRole("link", { name: /U21/i });
    expect(u21Link).toHaveAttribute("href", "/ploegen/u21");

    const u15Link = screen.getByRole("link", { name: /U15/i });
    expect(u15Link).toHaveAttribute("href", "/ploegen/u15");
  });

  it("renders age badges in team cards", () => {
    render(<YouthTeamsDirectory divisions={divisions} />);
    // Badge text for each team
    const badges = screen.getAllByText("U21");
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it("renders empty state for divisions with no teams", () => {
    render(<YouthTeamsDirectory divisions={divisions} />);
    expect(screen.getByText("Geen ploegen")).toBeInTheDocument();
  });

  it("renders link to jeugd page", () => {
    render(<YouthTeamsDirectory divisions={divisions} />);
    const link = screen.getByRole("link", { name: /jeugdwerking/i });
    expect(link).toHaveAttribute("href", "/jeugd");
  });
});
