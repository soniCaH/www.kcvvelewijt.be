import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RelatedRow } from "./RelatedRow";
import type { RelatedRowItem } from "@/components/related/types";

function item(
  i: number,
  overrides: Partial<RelatedRowItem> = {},
): RelatedRowItem {
  return {
    title: `Artikel ${i}`,
    href: `/nieuws/artikel-${i}`,
    badge: "NIEUWS",
    date: "23 mei 2026",
    articleType: "announcement",
    ...overrides,
  };
}

describe("<RelatedRow>", () => {
  describe("slider behaviour (5.d4 slider variant, carried over)", () => {
    it("returns null when items is empty (auto-hide, #2443 rule 7)", () => {
      const { container } = render(<RelatedRow items={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders 1 card when 1 item is supplied", () => {
      render(<RelatedRow items={[item(1)]} />);
      const row = screen.getByRole("region", { name: "Blijf nog even hangen" });
      expect(within(row).getAllByRole("heading", { level: 3 })).toHaveLength(1);
    });

    it("renders all 5 cards when 5 items are supplied (no 3-cap at this layer — capping is the merge's job)", () => {
      render(
        <RelatedRow items={[item(1), item(2), item(3), item(4), item(5)]} />,
      );
      const row = screen.getByRole("region", { name: "Blijf nog even hangen" });
      expect(within(row).getAllByRole("heading", { level: 3 })).toHaveLength(5);
    });

    it("renders a single one-card row identically to a multi-card row (cardinality is not a treatment, #2443 rule 3)", () => {
      const { container } = render(<RelatedRow items={[item(1)]} />);
      const slots = container.querySelectorAll(
        '[data-slot="related-row-card"]',
      );
      expect(slots).toHaveLength(1);
      expect(slots[0]?.querySelector("article")).not.toBeNull();
    });

    it("renders each card inside a fixed-width scroll slot", () => {
      const { container } = render(
        <RelatedRow items={[item(1), item(2), item(3), item(4)]} />,
      );
      const slots = container.querySelectorAll(
        '[data-slot="related-row-card"]',
      );
      expect(slots.length).toBe(4);
      expect(slots[0]?.className).toContain("shrink-0");
    });
  });

  describe("the tilt scale (#3330)", () => {
    it("cycles the slight tier in alternating signs and then flat, wrapping after five cards", () => {
      const { container } = render(
        <RelatedRow items={[1, 2, 3, 4, 5, 6].map((i) => item(i))} />,
      );
      const leans = [
        ...container.querySelectorAll('[data-slot="related-row-card"] article'),
      ].map((card) => card.getAttribute("data-rotation"));
      expect(leans).toEqual(["a", "c", "b", "d", "none", "a"]);
    });
  });

  describe("per-articleType backgrounds (R3 lookup, carried over)", () => {
    it("uses jersey-deep card background for transfer articles", () => {
      const { container } = render(
        <RelatedRow items={[item(1, { articleType: "transfer" })]} />,
      );
      expect(container.querySelector('[data-bg="jersey-deep"]')).not.toBeNull();
    });

    it("uses cream card background for non-transfer / non-article types", () => {
      const { container } = render(
        <RelatedRow
          items={[item(1, { articleType: undefined, badge: "SPELER" })]}
        />,
      );
      expect(container.querySelector('[data-bg="cream"]')).not.toBeNull();
    });
  });

  describe("heading", () => {
    it("defaults to 'Blijf nog even hangen.' (#2443 rule 5)", () => {
      render(<RelatedRow items={[item(1)]} />);
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading.textContent).toContain("Blijf nog even");
      expect(heading.textContent).toContain("hangen.");
    });
  });

  describe("container width", () => {
    it("renders at --container-wide width", () => {
      const { container } = render(<RelatedRow items={[item(1)]} />);
      const row = container.firstElementChild as HTMLElement;
      const inner = row.firstElementChild as HTMLElement;
      expect(inner.style.maxWidth).toBe("var(--container-wide)");
    });
  });

  describe("imageless card artefact (#2574)", () => {
    it("passes the resolved artefact to NewsCard when imageUrl is absent", () => {
      const { container } = render(
        <RelatedRow
          items={[
            item(1, {
              imageUrl: undefined,
              artefact: { kind: "team", ageLabel: "U15" },
            }),
          ]}
        />,
      );
      // getCardSubjectArtefact's team branch renders a <JerseyShirt>, which
      // NewsCard mounts in place of the hatch fallback when `artefact` is set.
      const fallbackHatch = container.querySelector(
        '[data-testid="newscard-image-fallback"]',
      );
      expect(fallbackHatch).toBeNull();
    });

    it("falls back to the default hatch when neither imageUrl nor artefact is set", () => {
      const { container } = render(
        <RelatedRow
          items={[item(1, { imageUrl: undefined, artefact: undefined })]}
        />,
      );
      expect(
        container.querySelector('[data-testid="newscard-image-fallback"]'),
      ).not.toBeNull();
    });
  });
});
