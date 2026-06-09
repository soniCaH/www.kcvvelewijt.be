/**
 * YouthDirectory unit tests.
 *
 * Covers:
 *  - Auto-hide (null) when no divisions have teams
 *  - Empty groups omitted; only populated divisions render
 *  - Age-code card per team, linking to its detail
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { YouthDivisionGroup } from "@/lib/utils/group-teams";
import { YouthDirectory } from "./YouthDirectory";
import { youthTeam as team } from "./youth-directory.fixtures";

const divisions: YouthDivisionGroup[] = [
  { label: "Bovenbouw", range: "U17–U21", teams: [team("U17")] },
  { label: "Middenbouw", range: "U12–U16", teams: [] },
  { label: "Onderbouw", range: "U6–U11", teams: [team("U9"), team("U6")] },
];

describe("YouthDirectory", () => {
  it("returns null when no division has teams", () => {
    const { container } = render(
      <YouthDirectory
        divisions={[
          { label: "Bovenbouw", range: "U17–U21", teams: [] },
          { label: "Middenbouw", range: "U12–U16", teams: [] },
        ]}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("omits empty divisions and renders only populated ones", () => {
    render(<YouthDirectory divisions={divisions} />);
    const groups = screen.getAllByTestId("youth-division");
    expect(groups).toHaveLength(2); // Bovenbouw + Onderbouw (Middenbouw empty)
  });

  it("renders an age-code card per team linking to its detail", () => {
    render(<YouthDirectory divisions={divisions} />);
    const cards = screen.getAllByTestId("youth-team-card");
    expect(cards).toHaveLength(3);
    const u17 = cards.find((c) => c.textContent?.includes("U17"));
    expect(u17?.getAttribute("href")).toBe("/ploegen/kcvv-elewijt-u17");
  });

  it("renders the squad photo when a team has one", () => {
    render(
      <YouthDirectory
        divisions={[
          {
            label: "Bovenbouw",
            range: "U17–U21",
            teams: [team("U17", "/images/ploeg.jpg")],
          },
        ]}
      />,
    );
    const img = screen.getByAltText("KCVV Elewijt U17 ploegfoto");
    expect(img).toBeInTheDocument();
  });

  it("falls back to the JerseyShirt illustration when a team has no photo", () => {
    render(
      <YouthDirectory
        divisions={[
          { label: "Bovenbouw", range: "U17–U21", teams: [team("U17")] },
        ]}
      />,
    );
    // No squad <img>; the JerseyShirt fallback carries an accessible label.
    expect(
      screen.queryByAltText("KCVV Elewijt U17 ploegfoto"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByLabelText("KCVV Elewijt U17 (geen ploegfoto)"),
    ).toBeInTheDocument();
  });
});
