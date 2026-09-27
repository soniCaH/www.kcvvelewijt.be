/**
 * Select Component Tests — Phase 2.A.4 Direction C (paper-card emphasis).
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Select } from "./Select";

describe("Select", () => {
  describe("Rendering", () => {
    it("renders as a select element", () => {
      render(
        <Select aria-label="Test">
          <option value="1">Optie 1</option>
        </Select>,
      );
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("renders options", () => {
      render(
        <Select aria-label="Test">
          <option value="gold">Goud</option>
          <option value="silver">Zilver</option>
        </Select>,
      );
      expect(screen.getByRole("option", { name: "Goud" })).toBeInTheDocument();
      expect(
        screen.getByRole("option", { name: "Zilver" }),
      ).toBeInTheDocument();
    });

    it("renders placeholder as disabled first option", () => {
      render(
        <Select aria-label="Test" placeholder="Kies een optie">
          <option value="a">Optie A</option>
        </Select>,
      );
      const option = screen.getByRole("option", { name: "Kies een optie" });
      expect(option).toBeInTheDocument();
      expect(option).toBeDisabled();
      expect(screen.getAllByRole("option")[0]).toBe(option);
    });

    it("forwards ref", () => {
      const ref = { current: null };
      render(<Select aria-label="Test" ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    });
  });

  describe("Sizes", () => {
    it("renders medium height (40px) by default", () => {
      render(<Select aria-label="Test" data-testid="select" />);
      expect(screen.getByTestId("select")).toHaveClass(
        "h-10",
        "pl-4",
        "text-base",
      );
    });

    it("renders small height (32px)", () => {
      render(<Select aria-label="Test" size="sm" data-testid="select" />);
      expect(screen.getByTestId("select")).toHaveClass(
        "h-8",
        "pl-3",
        "text-sm",
      );
    });

    it("renders large height (48px)", () => {
      render(<Select aria-label="Test" size="lg" data-testid="select" />);
      expect(screen.getByTestId("select")).toHaveClass(
        "h-12",
        "pl-5",
        "text-lg",
      );
    });
  });

  describe("Custom chevron — Phosphor CaretDown", () => {
    it("renders a chevron icon (svg)", () => {
      const { container } = render(<Select aria-label="Test" />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("hides native select arrow via appearance-none", () => {
      render(<Select aria-label="Test" data-testid="select" />);
      expect(screen.getByTestId("select")).toHaveClass("appearance-none");
    });

    it("does not import Lucide ChevronDown (Phosphor only)", async () => {
      const src = await import("./Select");
      // Surface check: render and verify the SVG comes from Phosphor.
      // Phosphor SVG roots carry data-icon-weight; Lucide does not.
      const { container } = render(<src.Select aria-label="Test" />);
      const svg = container.querySelector("svg");
      // Phosphor fill weight ships viewBox 0 0 256 256.
      expect(svg?.getAttribute("viewBox")).toBe("0 0 256 256");
    });
  });

  describe("Field chrome — paper-card emphasis", () => {
    it("renders white surface, 2px ink/30 border, paper-soft shadow at rest", () => {
      render(<Select aria-label="Test" data-testid="select" />);
      const el = screen.getByTestId("select");
      expect(el).toHaveClass("bg-white", "border-2");
      expect(el.className).toContain("shadow-[var(--shadow-paper-sm-soft)]");
    });

    it("does not apply rounded corners (sharp)", () => {
      render(<Select aria-label="Test" data-testid="select" />);
      expect(screen.getByTestId("select").className).not.toMatch(/\brounded-/);
    });

    it("does not reference legacy kcvv-/foundation- tokens", () => {
      render(<Select aria-label="Test" data-testid="select" />);
      const cls = screen.getByTestId("select").className;
      expect(cls).not.toContain("kcvv-alert");
      expect(cls).not.toContain("kcvv-green-bright");
      expect(cls).not.toContain("foundation-gray");
    });
  });

  describe("Error state", () => {
    it("renders an AlertBadge with FOUT label + message", () => {
      render(<Select aria-label="Test" error="Kies een geldige optie." />);
      expect(screen.getByText("FOUT")).toBeInTheDocument();
      expect(screen.getByText("Kies een geldige optie.")).toBeInTheDocument();
    });

    it("flips border + shadow to alert variant", () => {
      render(<Select aria-label="Test" error="Fout" data-testid="select" />);
      const el = screen.getByTestId("select");
      expect(el).toHaveClass("border-alert");
      expect(el.className).toContain("shadow-[var(--shadow-paper-sm-alert)]");
    });

    it("sets aria-invalid + aria-describedby", () => {
      render(<Select aria-label="Test" error="Fout" data-testid="select" />);
      const el = screen.getByTestId("select");
      expect(el).toHaveAttribute("aria-invalid", "true");
      expect(el.getAttribute("aria-describedby")).toBeTruthy();
    });

    it("hides hint when error is present", () => {
      render(<Select aria-label="Test" error="Fout" hint="Hulptekst" />);
      expect(screen.queryByText("Hulptekst")).not.toBeInTheDocument();
    });
  });

  describe("Hint", () => {
    it("renders hint at ink/60 italic when no error", () => {
      render(<Select aria-label="Test" hint="Kies je ploeg." />);
      const el = screen.getByText("Kies je ploeg.");
      expect(el).toHaveClass("italic", "text-ink/60");
    });

    // Decision D4 (#2620) — see Input.test.tsx for the full contract.
    it("opens with the mono [?] bracket", () => {
      render(<Select aria-label="Test" hint="Kies je ploeg." />);
      const hint = screen.getByText("Kies je ploeg.");
      expect(hint.querySelector('[data-glyph="help"]')).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });

    it("describes the field with the hint sentence alone", () => {
      render(
        <Select aria-label="Test" hint="Kies je ploeg." data-testid="select" />,
      );
      expect(screen.getByTestId("select")).toHaveAccessibleDescription(
        "Kies je ploeg.",
      );
    });
  });

  describe("Disabled state", () => {
    it("flattens chrome", () => {
      render(<Select aria-label="Test" disabled data-testid="select" />);
      const el = screen.getByTestId("select");
      expect(el).toBeDisabled();
      expect(el).toHaveClass(
        "disabled:bg-cream-soft",
        "disabled:opacity-50",
        "disabled:cursor-not-allowed",
      );
    });
  });

  describe("Custom props", () => {
    it("accepts custom className", () => {
      render(
        <Select
          aria-label="Test"
          className="custom-class"
          data-testid="select"
        />,
      );
      expect(screen.getByTestId("select")).toHaveClass("custom-class");
    });

    it("passes native select attributes", () => {
      render(
        <Select
          aria-label="Test"
          name="tier"
          id="tier-select"
          data-testid="select"
        />,
      );
      const el = screen.getByTestId("select");
      expect(el).toHaveAttribute("name", "tier");
      expect(el).toHaveAttribute("id", "tier-select");
    });
  });
});
