import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { VerderLezenRow, type VerderLezenItem } from "./VerderLezenRow";

function item(
  i: number,
  overrides: Partial<VerderLezenItem> = {},
): VerderLezenItem {
  return {
    title: `Artikel ${i}`,
    href: `/nieuws/artikel-${i}`,
    badge: "NIEUWS",
    date: "23 mei 2026",
    articleType: "announcement",
    ...overrides,
  };
}

describe("<VerderLezenRow>", () => {
  describe("slider behaviour (5.d4 slider variant)", () => {
    it("returns null when items is empty", () => {
      const { container } = render(<VerderLezenRow items={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders 1 card when 1 item is supplied", () => {
      render(<VerderLezenRow items={[item(1)]} />);
      const row = screen.getByRole("region", { name: "Verder lezen" });
      expect(within(row).getAllByRole("heading", { level: 3 })).toHaveLength(1);
    });

    it("renders all 5 cards when 5 items are supplied (no 3-cap)", () => {
      render(
        <VerderLezenRow
          items={[item(1), item(2), item(3), item(4), item(5)]}
        />,
      );
      const row = screen.getByRole("region", { name: "Verder lezen" });
      expect(within(row).getAllByRole("heading", { level: 3 })).toHaveLength(5);
    });

    it("renders each card inside a fixed-width scroll slot", () => {
      const { container } = render(
        <VerderLezenRow items={[item(1), item(2), item(3), item(4)]} />,
      );
      const slots = container.querySelectorAll(
        '[data-slot="verder-lezen-card"]',
      );
      expect(slots.length).toBe(4);
      // Each slot carries the shrink-0 lockdown so the slider's flex
      // track doesn't squeeze cards as more are added.
      expect(slots[0]?.className).toContain("shrink-0");
    });
  });

  describe("per-articleType backgrounds (R3 lookup)", () => {
    it("uses jersey-deep card background for transfer articles", () => {
      const { container } = render(
        <VerderLezenRow items={[item(1, { articleType: "transfer" })]} />,
      );
      // NewsCard exposes its bg via the TapedCard's data-bg attribute.
      const card = container.querySelector('[data-bg="jersey-deep"]');
      expect(card).not.toBeNull();
    });

    it("uses cream card background for interview / announcement / event / null", () => {
      const types: VerderLezenItem["articleType"][] = [
        "interview",
        "announcement",
        "event",
        null,
      ];
      types.forEach((type) => {
        const { container } = render(
          <VerderLezenRow items={[item(1, { articleType: type })]} />,
        );
        expect(container.querySelector('[data-bg="cream"]')).not.toBeNull();
      });
    });
  });

  describe("heading", () => {
    it("renders the 'Verder lezen.' heading with accent on 'Verder'", () => {
      render(<VerderLezenRow items={[item(1)]} />);
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading.textContent).toContain("Verder");
      expect(heading.textContent).toContain("lezen.");
    });
  });

  describe("container width", () => {
    it("renders at --container-page width", () => {
      const { container } = render(<VerderLezenRow items={[item(1)]} />);
      const row = container.firstElementChild as HTMLElement;
      const inner = row.firstElementChild as HTMLElement;
      expect(inner.style.maxWidth).toBe("var(--container-page)");
    });
  });
});
