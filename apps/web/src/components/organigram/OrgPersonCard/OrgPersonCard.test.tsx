/**
 * OrgPersonCard unit tests.
 *
 * Covers:
 *  - deriveCardState: 0 → vacant, 1 → single, 2+ → shared
 *  - splitDisplayName / monogramInitials helpers
 *  - single: person name (first-bold + last-italic) + position as mono label + monogram fallback / photo
 *  - shared: position in name slot + "N personen" + dual avatar + "+N" chip at 3+
 *  - vacant: warm state · "deze plek is vrij" · CTA link to the configured href
 *  - roleCode pill renders when present, absent when not
 *  - data markers (data-node-id / data-card-state) for the Phase 4 delegation wrapper
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  OrgPersonCard,
  deriveCardState,
  splitDisplayName,
  monogramInitials,
} from "./OrgPersonCard";
import type { OrgChartNode } from "@/types/organigram";

function node(overrides: Partial<OrgChartNode> = {}): OrgChartNode {
  return {
    id: "n1",
    title: "Voorzitter",
    members: [{ id: "p1", name: "Luc Boons" }],
    ...overrides,
  };
}

describe("deriveCardState", () => {
  it("maps holder count to occupancy state", () => {
    expect(deriveCardState(0)).toBe("vacant");
    expect(deriveCardState(1)).toBe("single");
    expect(deriveCardState(2)).toBe("shared");
    expect(deriveCardState(5)).toBe("shared");
  });

  it("treats negatives as vacant defensively", () => {
    expect(deriveCardState(-1)).toBe("vacant");
  });
});

describe("splitDisplayName", () => {
  it("splits first token (lead) from the remainder (rest)", () => {
    expect(splitDisplayName("Luc Boons")).toEqual({
      lead: "Luc",
      rest: "Boons",
    });
    expect(splitDisplayName("Jan De Smet")).toEqual({
      lead: "Jan",
      rest: "De Smet",
    });
  });

  it("returns an empty rest for a single token", () => {
    expect(splitDisplayName("Penningmeester")).toEqual({
      lead: "Penningmeester",
      rest: "",
    });
  });

  it("tolerates extra whitespace and empty input", () => {
    expect(splitDisplayName("  Els   Vos  ")).toEqual({
      lead: "Els",
      rest: "Vos",
    });
    expect(splitDisplayName("")).toEqual({ lead: "", rest: "" });
  });
});

describe("monogramInitials", () => {
  it("uses first + last token initials, upper-cased", () => {
    expect(monogramInitials("Luc Boons")).toBe("LB");
    expect(monogramInitials("Jan De Smet")).toBe("JS");
  });

  it("uses a single initial for a one-token value", () => {
    expect(monogramInitials("Penningmeester")).toBe("P");
  });

  it("falls back to the middot glyph when empty/undefined", () => {
    expect(monogramInitials(undefined)).toBe("·");
    expect(monogramInitials("   ")).toBe("·");
  });
});

describe("OrgPersonCard — single", () => {
  it("renders the person name in the name slot and the position as the mono label", () => {
    render(<OrgPersonCard node={node()} />);
    const card = screen.getByTestId("org-person-card");
    expect(card).toHaveAttribute("data-card-state", "single");
    expect(card).toHaveAttribute("data-node-id", "n1");
    // Name rhythm: first name bold, last name italic.
    expect(screen.getByText("Luc")).toBeInTheDocument();
    expect(screen.getByText("Boons")).toBeInTheDocument();
    // Position renders as the mono function sub-label.
    expect(screen.getByText("Voorzitter")).toBeInTheDocument();
  });

  it("shows a monogram fallback when the holder has no photo", () => {
    render(<OrgPersonCard node={node()} />);
    expect(screen.getByText("LB")).toBeInTheDocument();
  });

  it("renders a newsprint photo when imageUrl is present (no monogram)", () => {
    render(
      <OrgPersonCard
        node={node({
          members: [{ id: "p1", name: "Luc Boons", imageUrl: "/x/luc.jpg" }],
        })}
      />,
    );
    const img = screen.getByRole("img", { name: "Luc Boons" });
    expect(img).toBeInTheDocument();
    expect(screen.queryByText("LB")).not.toBeInTheDocument();
  });
});

describe("OrgPersonCard — roleCode pill", () => {
  it("renders the pill when roleCode is present", () => {
    render(<OrgPersonCard node={node({ roleCode: "VZ" })} />);
    expect(screen.getByTestId("org-person-card-rolepill")).toHaveTextContent(
      "VZ",
    );
  });

  it("auto-hides the pill when roleCode is absent", () => {
    render(<OrgPersonCard node={node()} />);
    expect(
      screen.queryByTestId("org-person-card-rolepill"),
    ).not.toBeInTheDocument();
  });
});

describe("OrgPersonCard — shared", () => {
  const shared = node({
    title: "Wedstrijdsecretariaat",
    members: [
      { id: "p1", name: "Jan De Smet" },
      { id: "p2", name: "Paula Vos", imageUrl: "/x/paula.jpg" },
    ],
  });

  it("renders the position in the name slot and an 'N personen' label", () => {
    render(<OrgPersonCard node={shared} />);
    const card = screen.getByTestId("org-person-card");
    expect(card).toHaveAttribute("data-card-state", "shared");
    expect(screen.getByText("Wedstrijdsecretariaat")).toBeInTheDocument();
    expect(screen.getByText("2 personen")).toBeInTheDocument();
    expect(
      screen.getByTestId("org-person-card-dual-avatar"),
    ).toBeInTheDocument();
  });

  it("renders a holder photo in the dual avatar and a monogram for the photo-less holder", () => {
    render(<OrgPersonCard node={shared} />);
    // The dual avatar is an aria-hidden decorative cue, so query the photo by
    // its alt text (not by role) and the photo-less holder by its monogram.
    expect(screen.getByAltText("Paula Vos")).toBeInTheDocument();
    // Jan De Smet → first + last token initial ("JS", not "JD").
    expect(screen.getByText("JS")).toBeInTheDocument();
  });

  it("adds a '+N' chip when there are 3 or more holders", () => {
    render(
      <OrgPersonCard
        node={node({
          title: "Feestcomité",
          members: [
            { id: "p1", name: "Els Claes" },
            { id: "p2", name: "Nina Bral" },
            { id: "p3", name: "Bert Aerts" },
          ],
        })}
      />,
    );
    expect(screen.getByText("3 personen")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });
});

describe("OrgPersonCard — vacant", () => {
  const vacant = node({ title: "Penningmeester", members: [] });

  it("renders the warm recruit state with the position and 'deze plek is vrij'", () => {
    render(<OrgPersonCard node={vacant} />);
    const card = screen.getByTestId("org-person-card");
    expect(card).toHaveAttribute("data-card-state", "vacant");
    expect(card.className).toContain("bg-warm");
    expect(screen.getByText("Penningmeester")).toBeInTheDocument();
    expect(screen.getByText("deze plek is vrij")).toBeInTheDocument();
  });

  it("links the CTA to the default club contact page", () => {
    render(<OrgPersonCard node={vacant} />);
    const cta = screen.getByTestId("org-person-card-vacant-cta");
    expect(cta).toHaveTextContent("Iets voor jou?");
    expect(cta).toHaveAttribute("href", "/club/contact");
  });

  it("honours a custom vacantCtaHref", () => {
    render(<OrgPersonCard node={vacant} vacantCtaHref="/hulp#hulp" />);
    expect(screen.getByTestId("org-person-card-vacant-cta")).toHaveAttribute(
      "href",
      "/hulp#hulp",
    );
  });
});
