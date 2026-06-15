/**
 * StaffRoles unit tests.
 *
 * Covers the locked merged "Rol & verantwoordelijkheden." section (10f2):
 *  - Auto-hides (null) when both positions and responsibilities are empty
 *  - Organigram-position rows: roleCode pill + title + department (optionals)
 *  - "Aanspreekpunt voor" sub-label + responsibility link cards → /hulp?pad=…
 *  - Positions-only / responsibilities-only states
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StaffRoles } from "./StaffRoles";

const POSITIONS = [
  { id: "a", title: "Hoofdtrainer", roleCode: "T1", department: "A-ploeg" },
  { id: "b", title: "Jeugdtrainer", roleCode: "T3", department: "U15" },
];

const RESPONSIBILITIES = [
  { title: "Inschrijven A-ploeg", slug: "inschrijven-a", category: "Spelers" },
  {
    title: "Trainingsschema opvragen",
    slug: "trainingsschema",
    category: "Trainingen",
  },
];

describe("StaffRoles", () => {
  it("returns null when both positions and responsibilities are empty", () => {
    const { container } = render(
      <StaffRoles positions={[]} responsibilities={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the merged section heading", () => {
    render(<StaffRoles positions={POSITIONS} responsibilities={[]} />);
    expect(
      screen.getByRole("heading", { name: /Rol & verantwoordelijkheden/i }),
    ).toBeInTheDocument();
  });

  it("renders a row per position with roleCode, title, and department", () => {
    render(<StaffRoles positions={POSITIONS} responsibilities={[]} />);
    const rows = screen.getAllByTestId("staff-position-row");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("T1");
    expect(rows[0]).toHaveTextContent("Hoofdtrainer");
    expect(rows[0]).toHaveTextContent("A-ploeg");
  });

  it("renders a position row without optional roleCode or department", () => {
    render(
      <StaffRoles
        positions={[{ id: "x", title: "Materiaalmeester" }]}
        responsibilities={[]}
      />,
    );
    const row = screen.getByTestId("staff-position-row");
    expect(row).toHaveTextContent("Materiaalmeester");
  });

  it("renders responsibility link cards to /hulp?pad=… under the sub-label", () => {
    render(<StaffRoles positions={[]} responsibilities={RESPONSIBILITIES} />);
    expect(screen.getByText(/Aanspreekpunt voor/i)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /Inschrijven A-ploeg/i });
    expect(link).toHaveAttribute("href", "/hulp?pad=inschrijven-a");
    expect(screen.getByText("Spelers")).toBeInTheDocument();
  });

  it("does not render the 'Aanspreekpunt voor' sub-label when there are no responsibilities", () => {
    render(<StaffRoles positions={POSITIONS} responsibilities={[]} />);
    expect(screen.queryByText(/Aanspreekpunt voor/i)).not.toBeInTheDocument();
  });

  it("renders responsibilities even when there are no positions", () => {
    render(<StaffRoles positions={[]} responsibilities={RESPONSIBILITIES} />);
    expect(screen.queryByTestId("staff-position-row")).not.toBeInTheDocument();
    expect(screen.getByText(/Aanspreekpunt voor/i)).toBeInTheDocument();
    expect(screen.getAllByTestId("staff-responsibility-card")).toHaveLength(2);
  });
});
