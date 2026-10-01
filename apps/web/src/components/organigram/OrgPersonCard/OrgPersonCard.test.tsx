/**
 * OrgPersonCard unit tests.
 *
 * Covers:
 *  - deriveCardState: 0 → vacant, 1 → single, 2+ → shared
 *  - splitDisplayName helper
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
    // #2559 rule 1: the card renders the person's name, so the portrait is
    // decorative. Identify it by src — the alt no longer can.
    const img = document.querySelector("img");
    expect(img).toHaveAttribute("src", "/x/luc.jpg");
    expect(img).toHaveAttribute("alt", "");
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
    // The dual avatar is an aria-hidden decorative cue and the photo itself is
    // silent too (#2559), so Paula's photo is identified by src.
    const img = document.querySelector("img");
    expect(img).toHaveAttribute("src", "/x/paula.jpg");
    expect(img).toHaveAttribute("alt", "");
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

  it("sets the group on the 40px step, the '+N' circle included", () => {
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
    const circles = screen
      .getByTestId("org-person-card-dual-avatar")
      .querySelectorAll("[data-round-avatar]");
    expect(circles).toHaveLength(3);
    for (const circle of circles) {
      expect(circle.getAttribute("data-size")).toBe("40");
    }
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

  it("wears the one chip (#3328)", () => {
    render(<OrgPersonCard node={vacant} />);
    expect(screen.getByTestId("org-person-card-vacant-cta")).toHaveClass(
      "border-2",
      "text-label",
    );
  });

  it("honours a custom vacantCtaHref", () => {
    render(<OrgPersonCard node={vacant} vacantCtaHref="/hulp#hulp" />);
    expect(screen.getByTestId("org-person-card-vacant-cta")).toHaveAttribute(
      "href",
      "/hulp#hulp",
    );
  });
});

describe("OrgPersonCard — interactive (Phase 4 panel trigger)", () => {
  it("is a presentational article (no button) by default", () => {
    render(<OrgPersonCard node={node()} />);
    expect(screen.getByTestId("org-person-card").tagName).toBe("ARTICLE");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders a focusable button with a person-first label + data-member-card", () => {
    render(<OrgPersonCard node={node()} interactive />);
    const card = screen.getByRole("button", {
      name: "Contactgegevens van Luc Boons",
    });
    expect(card).toHaveAttribute("data-member-card", "true");
    expect(card).toHaveAttribute("data-node-id", "n1");
    expect(card).toHaveAttribute("data-card-state", "single");
  });

  it("labels a shared card with the position + holder count", () => {
    render(
      <OrgPersonCard
        node={node({
          title: "Feestcomité",
          members: [
            { id: "p1", name: "Els Claes" },
            { id: "p2", name: "Nina Bral" },
          ],
        })}
        interactive
      />,
    );
    expect(
      screen.getByRole("button", {
        name: "Contactgegevens — Feestcomité, 2 personen",
      }),
    ).toBeInTheDocument();
  });

  it("drops the inline recruit link on a vacant card (the panel carries the CTA)", () => {
    render(
      <OrgPersonCard
        node={node({ title: "Penningmeester", members: [] })}
        interactive
      />,
    );
    expect(
      screen.getByRole("button", {
        name: "Penningmeester — deze plek is vrij",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("org-person-card-vacant-cta"),
    ).not.toBeInTheDocument();
    // The recruit copy stays visible (now inert) inside the card.
    // The chip is inert inside the card: the card presses, the chip must not.
    const chip = screen.getByText("Iets voor jou? →");
    expect(chip).toHaveClass("border-2", "text-label");
    expect(chip.className).not.toContain("hover:");
  });
});
