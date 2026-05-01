/**
 * Input Component Tests — Phase 2.A.4 Direction C (paper-card emphasis).
 */

import { createRef } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";
import { Search } from "lucide-react";

describe("Input", () => {
  describe("Rendering", () => {
    it("should render as an input element", () => {
      render(<Input />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should render placeholder text", () => {
      render(<Input placeholder="Zoek hier..." />);
      expect(screen.getByPlaceholderText("Zoek hier...")).toBeInTheDocument();
    });

    it("should render with a default value", () => {
      render(<Input defaultValue="KCVV" />);
      expect(screen.getByDisplayValue("KCVV")).toBeInTheDocument();
    });

    it("should forward ref", () => {
      const ref = createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe("Sizes", () => {
    it("renders medium height (40px) by default", () => {
      render(<Input data-testid="input" />);
      expect(screen.getByTestId("input")).toHaveClass(
        "h-10",
        "px-4",
        "text-base",
      );
    });

    it("renders small height (32px)", () => {
      render(<Input size="sm" data-testid="input" />);
      expect(screen.getByTestId("input")).toHaveClass("h-8", "px-3", "text-sm");
    });

    it("renders large height (48px)", () => {
      render(<Input size="lg" data-testid="input" />);
      expect(screen.getByTestId("input")).toHaveClass(
        "h-12",
        "px-5",
        "text-lg",
      );
    });
  });

  describe("Field chrome — paper-card emphasis", () => {
    it("renders white surface, 2px ink/30 border, paper-soft shadow at rest", () => {
      render(<Input data-testid="input" />);
      const el = screen.getByTestId("input");
      expect(el).toHaveClass("bg-white", "border-2", "border-ink/30");
      expect(el.className).toContain("shadow-[var(--shadow-paper-sm-soft)]");
    });

    it("compresses shadow + nudges surface on hover", () => {
      render(<Input data-testid="input" />);
      const el = screen.getByTestId("input");
      expect(el.className).toContain(
        "hover:shadow-[var(--shadow-paper-sm-soft-hover)]",
      );
      expect(el.className).toContain("hover:translate-x-px");
    });

    it("snaps shadow off + presses surface 2px on focus", () => {
      render(<Input data-testid="input" />);
      const el = screen.getByTestId("input");
      expect(el.className).toContain("focus:shadow-none");
      expect(el.className).toContain("focus:translate-x-0.5");
      expect(el.className).toContain("focus:border-ink");
    });

    it("anchors filled state via :not(:placeholder-shown):not(:focus) → ink/60", () => {
      render(<Input data-testid="input" />);
      expect(screen.getByTestId("input").className).toContain(
        "[&:not(:placeholder-shown):not(:focus)]:border-ink/60",
      );
    });

    it("uses dim ink/40 placeholder", () => {
      render(<Input data-testid="input" />);
      expect(screen.getByTestId("input").className).toContain(
        "placeholder:text-ink/40",
      );
    });

    it("does not apply rounded corners (sharp)", () => {
      render(<Input data-testid="input" />);
      const cls = screen.getByTestId("input").className;
      expect(cls).not.toMatch(/\brounded-/);
    });

    it("does not reference legacy kcvv-/foundation- token classes", () => {
      render(<Input data-testid="input" />);
      const cls = screen.getByTestId("input").className;
      expect(cls).not.toContain("kcvv-alert");
      expect(cls).not.toContain("kcvv-green-bright");
      expect(cls).not.toContain("foundation-gray");
    });
  });

  describe("Error state", () => {
    it("renders an AlertBadge with the FOUT label and message", () => {
      render(<Input error="Dit veld is verplicht." />);
      expect(screen.getByText("FOUT")).toBeInTheDocument();
      expect(screen.getByText("Dit veld is verplicht.")).toBeInTheDocument();
    });

    it("flips border + shadow to alert variant", () => {
      render(<Input error="Fout" data-testid="input" />);
      const el = screen.getByTestId("input");
      expect(el).toHaveClass("border-alert");
      expect(el.className).toContain("shadow-[var(--shadow-paper-sm-alert)]");
    });

    it("sets aria-invalid + aria-describedby pointing at the AlertBadge", () => {
      render(<Input error="Fout" data-testid="input" />);
      const input = screen.getByTestId("input");
      expect(input).toHaveAttribute("aria-invalid", "true");
      const describedBy = input.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();
      expect(document.getElementById(describedBy!)).not.toBeNull();
    });

    it("does not show hint when error is present", () => {
      render(<Input error="Fout" hint="Hulptekst" />);
      expect(screen.queryByText("Hulptekst")).not.toBeInTheDocument();
    });
  });

  describe("Hint", () => {
    it("renders italic Freight Display hint at ink/60 when no error", () => {
      render(<Input hint="Minimaal 2 tekens." />);
      const el = screen.getByText("Minimaal 2 tekens.");
      expect(el).toHaveClass("italic", "text-ink/60");
    });
  });

  describe("Icons", () => {
    it("renders leading and trailing icons", () => {
      render(
        <Input
          leadingIcon={<Search data-testid="li" size={16} />}
          trailingIcon={<Search data-testid="ti" size={16} />}
        />,
      );
      expect(screen.getByTestId("li")).toBeInTheDocument();
      expect(screen.getByTestId("ti")).toBeInTheDocument();
    });

    it("adds leading padding when leadingIcon is set (per size)", () => {
      const { rerender } = render(
        <Input
          size="sm"
          leadingIcon={<Search size={14} />}
          data-testid="input"
        />,
      );
      expect(screen.getByTestId("input")).toHaveClass("pl-9");
      rerender(
        <Input leadingIcon={<Search size={16} />} data-testid="input" />,
      );
      expect(screen.getByTestId("input")).toHaveClass("pl-11");
      rerender(
        <Input
          size="lg"
          leadingIcon={<Search size={20} />}
          data-testid="input"
        />,
      );
      expect(screen.getByTestId("input")).toHaveClass("pl-13");
    });
  });

  describe("Disabled state", () => {
    it("freezes chrome (cream-soft surface, ink/15 border, opacity-50 softens the resting shadow)", () => {
      render(<Input disabled data-testid="input" />);
      const el = screen.getByTestId("input");
      expect(el).toBeDisabled();
      expect(el).toHaveClass(
        "disabled:bg-cream-soft",
        "disabled:border-ink/15",
        "disabled:opacity-50",
        "disabled:cursor-not-allowed",
        "disabled:translate-x-0",
      );
      // Resting paper-soft shadow stays — opacity-50 carries it through so
      // the disabled state remains inside the paper vocabulary.
      expect(el.className).not.toContain("disabled:shadow-none");
      expect(el.className).toContain("shadow-[var(--shadow-paper-sm-soft)]");
    });
  });

  describe("Custom props", () => {
    it("accepts custom className", () => {
      render(<Input className="custom-class" data-testid="input" />);
      expect(screen.getByTestId("input")).toHaveClass("custom-class");
    });

    it("passes through native input attributes", () => {
      render(<Input type="email" name="email" id="email-field" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "email");
      expect(input).toHaveAttribute("name", "email");
      expect(input).toHaveAttribute("id", "email-field");
    });
  });

  describe("Accessibility", () => {
    it("receives focus on click", async () => {
      const user = userEvent.setup();
      render(<Input data-testid="input" />);
      await user.click(screen.getByTestId("input"));
      expect(screen.getByTestId("input")).toHaveFocus();
    });
  });
});
