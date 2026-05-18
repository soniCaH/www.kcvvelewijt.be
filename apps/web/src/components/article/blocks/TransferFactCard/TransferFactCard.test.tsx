import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TransferFactValue } from "../TransferFact/types";
import { TransferFactCard } from "./TransferFactCard";

function fact(overrides: Partial<TransferFactValue> = {}): TransferFactValue {
  return {
    _key: "f1",
    _type: "transferFact",
    direction: "incoming",
    playerName: "Joren De Smet",
    position: "Middenvelder",
    age: 19,
    otherClubName: "Diest",
    kcvvContext: "#14",
    ...overrides,
  };
}

describe("<TransferFactCard>", () => {
  it("renders the player name in italic Freight Display", () => {
    const { container } = render(<TransferFactCard fact={fact()} />);
    const name = container.querySelector('[data-transfer-fact-name="true"]');
    expect(name?.textContent).toBe("Joren De Smet");
    expect(name?.className).toContain("font-display");
    expect(name?.className).toContain("italic");
    expect(name?.className).toContain("font-black");
  });

  it("renders the context line as mono caps with position + age", () => {
    const { container } = render(<TransferFactCard fact={fact()} />);
    const ctx = container.querySelector('[data-transfer-fact-context="true"]');
    expect(ctx?.textContent).toBe("Middenvelder · 19 jaar");
    expect(ctx?.className).toContain("font-mono");
    expect(ctx?.className).toContain("uppercase");
  });

  it("omits the context line when neither position nor age is present", () => {
    const { container } = render(
      <TransferFactCard fact={fact({ position: undefined, age: undefined })} />,
    );
    expect(
      container.querySelector('[data-transfer-fact-context="true"]'),
    ).toBeNull();
  });

  it("renders the position-only context when age is missing", () => {
    const { container } = render(
      <TransferFactCard fact={fact({ age: undefined })} />,
    );
    const ctx = container.querySelector('[data-transfer-fact-context="true"]');
    expect(ctx?.textContent).toBe("Middenvelder");
  });

  describe("direction-specific behaviour", () => {
    it("incoming: chip reads 'IN ↓', route reads other → KCVV · context", () => {
      const { container } = render(
        <TransferFactCard
          fact={fact({ direction: "incoming", kcvvContext: "#14" })}
        />,
      );
      const card = container.firstElementChild;
      expect(
        card?.querySelector("article")?.getAttribute("data-direction"),
      ).toBe("incoming");
      const chip = container.querySelector('[data-transfer-fact-chip="true"]');
      expect(chip?.textContent).toBe("IN↓");
      const route = container.querySelector(
        '[data-transfer-fact-route="true"]',
      );
      expect(route?.textContent).toBe("Diest → KCVV · #14");
    });

    it("outgoing: chip reads 'OUT ↑', route reads KCVV · context → other", () => {
      const { container } = render(
        <TransferFactCard
          fact={fact({
            direction: "outgoing",
            kcvvContext: "#9",
            otherClubName: "Tienen",
          })}
        />,
      );
      const chip = container.querySelector('[data-transfer-fact-chip="true"]');
      expect(chip?.textContent).toBe("OUT↑");
      const route = container.querySelector(
        '[data-transfer-fact-route="true"]',
      );
      expect(route?.textContent).toBe("KCVV · #9 → Tienen");
    });

    it("extension: chip reads 'VERLENGING ↻', route reads A-kern · context · tot {until}", () => {
      const { container } = render(
        <TransferFactCard
          fact={fact({
            direction: "extension",
            otherClubName: undefined,
            kcvvContext: "#14",
            until: "juni 2028",
          })}
        />,
      );
      const chip = container.querySelector('[data-transfer-fact-chip="true"]');
      expect(chip?.textContent).toBe("VERLENGING↻");
      const route = container.querySelector(
        '[data-transfer-fact-route="true"]',
      );
      expect(route?.textContent).toBe("A-kern · #14 · tot juni 2028");
    });
  });

  describe("inline crest", () => {
    it("renders an inline logo before the otherClubName on incoming", () => {
      const { container } = render(
        <TransferFactCard
          fact={fact({
            direction: "incoming",
            otherClubLogoUrl: "/images/logos/clubs/dummy-rouge.svg",
          })}
        />,
      );
      const logo = container.querySelector(
        '[data-transfer-fact-inline-logo="true"]',
      );
      expect(logo).not.toBeNull();
      expect(logo?.getAttribute("src")).toBe(
        "/images/logos/clubs/dummy-rouge.svg",
      );
      // Logo is decorative — must be aria-hidden + alt="".
      expect(logo?.getAttribute("aria-hidden")).toBe("true");
      expect(logo?.getAttribute("alt")).toBe("");
    });

    it("renders an inline logo before the otherClubName on outgoing", () => {
      const { container } = render(
        <TransferFactCard
          fact={fact({
            direction: "outgoing",
            otherClubName: "Tienen",
            otherClubLogoUrl: "/images/logos/clubs/dummy-bleu.svg",
          })}
        />,
      );
      const logo = container.querySelector(
        '[data-transfer-fact-inline-logo="true"]',
      );
      expect(logo).not.toBeNull();
      // The route line still reads as KCVV → Tienen even with the inline logo.
      const route = container.querySelector(
        '[data-transfer-fact-route="true"]',
      );
      expect(route?.textContent).toContain("KCVV");
      expect(route?.textContent).toContain("Tienen");
    });

    it("falls back to text-only when otherClubLogoUrl is empty", () => {
      const { container } = render(
        <TransferFactCard fact={fact({ otherClubLogoUrl: undefined })} />,
      );
      expect(
        container.querySelector('[data-transfer-fact-inline-logo="true"]'),
      ).toBeNull();
    });

    it("does not render an inline logo on extension (no other club)", () => {
      const { container } = render(
        <TransferFactCard
          fact={fact({
            direction: "extension",
            otherClubName: undefined,
            otherClubLogoUrl: "/images/logos/clubs/dummy-rouge.svg",
            until: "juni 2028",
          })}
        />,
      );
      expect(
        container.querySelector('[data-transfer-fact-inline-logo="true"]'),
      ).toBeNull();
    });
  });

  describe("rotation derivation", () => {
    it("produces the same rotation for the same playerName (deterministic)", () => {
      const { container: a } = render(
        <TransferFactCard fact={fact({ playerName: "Bram Janssens" })} />,
      );
      const { container: b } = render(
        <TransferFactCard fact={fact({ playerName: "Bram Janssens" })} />,
      );
      const dataRotA = a.firstElementChild?.getAttribute("data-rotation");
      const dataRotB = b.firstElementChild?.getAttribute("data-rotation");
      expect(dataRotA).not.toBeNull();
      expect(["a", "b", "c", "d"]).toContain(dataRotA);
      expect(dataRotA).toBe(dataRotB);
    });
  });
});
