/**
 * Label Component Tests — Phase 2.A.4 Direction C.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Label } from "./Label";

describe("Label", () => {
  describe("Rendering", () => {
    it("renders as a label element", () => {
      const { container } = render(<Label>Naam</Label>);
      expect(container.querySelector("label")).toBeInTheDocument();
    });

    it("renders children text", () => {
      render(<Label>E-mailadres</Label>);
      expect(screen.getByText("E-mailadres")).toBeInTheDocument();
    });

    it("forwards ref", () => {
      const ref = { current: null };
      render(<Label ref={ref}>Test</Label>);
      expect(ref.current).toBeInstanceOf(HTMLLabelElement);
    });
  });

  describe("Styles", () => {
    it("applies bold ink semibold + bottom margin", () => {
      const { container } = render(<Label>Label</Label>);
      const label = container.querySelector("label") as HTMLElement;
      expect(label).toHaveClass("text-ink", "font-semibold", "text-sm", "mb-2");
    });

    it("does not reference legacy kcvv- tokens", () => {
      const { container } = render(
        <Label required optional>
          Label
        </Label>,
      );
      const html = container.innerHTML;
      expect(html).not.toContain("text-kcvv-alert");
      expect(html).not.toContain("text-kcvv-gray-blue");
    });
  });

  describe("Required", () => {
    it("does not show asterisk by default", () => {
      render(<Label>Naam</Label>);
      expect(screen.queryByText("*")).not.toBeInTheDocument();
    });

    it("shows asterisk when required is true", () => {
      render(<Label required>Naam</Label>);
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("marks asterisk as aria-hidden + applies text-alert", () => {
      const { container } = render(<Label required>Naam</Label>);
      const asterisk = container.querySelector(
        "[aria-hidden='true']",
      ) as HTMLElement;
      expect(asterisk).toHaveTextContent("*");
      expect(asterisk).toHaveClass("text-alert");
    });
  });

  describe("Optional pill", () => {
    it("does not render pill by default", () => {
      render(<Label>Naam</Label>);
      expect(screen.queryByText("Optioneel")).not.toBeInTheDocument();
    });

    it("renders mono caps OPTIONEEL pill when optional is true", () => {
      const { container } = render(<Label optional>Naam</Label>);
      const pill = screen.getByText("Optioneel");
      expect(pill).toBeInTheDocument();
      expect(pill).toHaveClass(
        "font-mono",
        "uppercase",
        "border",
        "border-ink/30",
      );
      // Sharp corners — never rounded.
      expect(pill.className).not.toMatch(/\brounded-/);
      // Aria-hidden so screen readers don't read "Optioneel" as content.
      expect(container.querySelector("[aria-hidden='true']")).toBe(pill);
    });

    it("required wins over optional when both are passed", () => {
      render(
        <Label required optional>
          Naam
        </Label>,
      );
      expect(screen.getByText("*")).toBeInTheDocument();
      expect(screen.queryByText("Optioneel")).not.toBeInTheDocument();
    });
  });

  describe("Custom props", () => {
    it("accepts custom className", () => {
      const { container } = render(<Label className="custom">Label</Label>);
      expect(container.querySelector("label")).toHaveClass("custom");
    });

    it("accepts htmlFor + associates with input via id", () => {
      render(
        <>
          <Label htmlFor="email">E-mailadres</Label>
          <input id="email" type="email" />
        </>,
      );
      expect(screen.getByLabelText("E-mailadres")).toBeInTheDocument();
    });
  });
});
