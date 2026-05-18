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
  describe("sparse states (R10 cards-drop rule)", () => {
    it("returns null when items is empty", () => {
      const { container } = render(<VerderLezenRow items={[]} />);
      expect(container.firstChild).toBeNull();
    });

    it("renders 1 card when 1 item is supplied", () => {
      render(<VerderLezenRow items={[item(1)]} />);
      const row = screen.getByRole("region", { name: "Verder lezen" });
      expect(row.getAttribute("data-card-count")).toBe("1");
      expect(within(row).getAllByRole("heading", { level: 3 })).toHaveLength(1);
    });

    it("renders 2 cards when 2 items are supplied", () => {
      render(<VerderLezenRow items={[item(1), item(2)]} />);
      const row = screen.getByRole("region", { name: "Verder lezen" });
      expect(row.getAttribute("data-card-count")).toBe("2");
      expect(within(row).getAllByRole("heading", { level: 3 })).toHaveLength(2);
    });

    it("renders 3 cards when 3 items are supplied", () => {
      render(<VerderLezenRow items={[item(1), item(2), item(3)]} />);
      const row = screen.getByRole("region", { name: "Verder lezen" });
      expect(row.getAttribute("data-card-count")).toBe("3");
      expect(within(row).getAllByRole("heading", { level: 3 })).toHaveLength(3);
    });

    it("caps at 3 cards when more than 3 items are supplied", () => {
      render(
        <VerderLezenRow
          items={[item(1), item(2), item(3), item(4), item(5)]}
        />,
      );
      const row = screen.getByRole("region", { name: "Verder lezen" });
      expect(row.getAttribute("data-card-count")).toBe("3");
      expect(within(row).getAllByRole("heading", { level: 3 })).toHaveLength(3);
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
