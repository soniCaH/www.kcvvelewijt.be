/**
 * TeamStaff unit tests.
 *
 * Covers:
 *  - resolveFunctionLabel: code map / passthrough / role-bucket fallback / "Staf"
 *  - Auto-hides (null) when staff empty
 *  - Photo state vs monogram fallback
 *  - Name rhythm (first semibold + last italic) + function caption
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TeamStaff, resolveFunctionLabel } from "./TeamStaff";
import type { TeamStaffMemberData } from "./TeamStaff";

describe("resolveFunctionLabel", () => {
  it("maps known PSD codes to readable labels", () => {
    expect(resolveFunctionLabel("T1", undefined)).toBe("Hoofdtrainer");
    expect(resolveFunctionLabel("T2", undefined)).toBe("Assistent-trainer");
    expect(resolveFunctionLabel("TK", undefined)).toBe("Keeperstrainer");
    expect(resolveFunctionLabel("TVJO", undefined)).toBe("Jeugdcoördinator");
  });

  it("is case-insensitive on the code", () => {
    expect(resolveFunctionLabel("t1", undefined)).toBe("Hoofdtrainer");
  });

  it("passes through already-readable free-text values", () => {
    expect(resolveFunctionLabel("Hoofd Jeugdopleiding", undefined)).toBe(
      "Hoofd Jeugdopleiding",
    );
  });

  it("falls back to the role bucket when functionTitle is null", () => {
    expect(resolveFunctionLabel(undefined, "trainer")).toBe("Trainer");
    expect(resolveFunctionLabel(undefined, "afgevaardigde")).toBe(
      "Afgevaardigde",
    );
  });

  it("falls back to 'Staf' when nothing usable is present", () => {
    expect(resolveFunctionLabel(undefined, undefined)).toBe("Staf");
    expect(resolveFunctionLabel("", "")).toBe("Staf");
  });

  it("prefers functionTitle over role bucket", () => {
    expect(resolveFunctionLabel("T1", "afgevaardigde")).toBe("Hoofdtrainer");
  });
});

const STAFF: TeamStaffMemberData[] = [
  {
    id: "1",
    firstName: "Karel",
    lastName: "Coach",
    functionTitle: "T1",
    imageUrl: "/player-fixtures/player-schulz.jpg",
  },
  {
    id: "2",
    firstName: "Bea",
    lastName: "Bijstand",
    role: "afgevaardigde",
  },
];

describe("TeamStaff", () => {
  it("renders null when staff is empty", () => {
    const { container } = render(<TeamStaff staff={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a card per staff member", () => {
    render(<TeamStaff staff={STAFF} />);
    expect(screen.getAllByTestId("team-staff-card")).toHaveLength(2);
  });

  it("renders the photo state when imageUrl is present", () => {
    render(<TeamStaff staff={STAFF} />);
    const cards = screen.getAllByTestId("team-staff-card");
    expect(cards[0]?.getAttribute("data-state")).toBe("photo");
  });

  it("renders the monogram fallback when imageUrl is absent", () => {
    render(<TeamStaff staff={STAFF} />);
    const cards = screen.getAllByTestId("team-staff-card");
    expect(cards[1]?.getAttribute("data-state")).toBe("monogram");
    // Initials of "Bea Bijstand" → "BB"
    expect(cards[1]?.textContent).toContain("BB");
  });

  it("renders the resolved function label", () => {
    render(<TeamStaff staff={STAFF} />);
    expect(screen.getByText("Hoofdtrainer")).toBeInTheDocument();
    expect(screen.getByText("Afgevaardigde")).toBeInTheDocument();
  });

  it("renders the name with first semibold + last italic", () => {
    render(<TeamStaff staff={STAFF} />);
    const last = screen.getByText("Coach");
    expect(last.tagName).toBe("EM");
    expect(last.className).toContain("italic");
  });
});
