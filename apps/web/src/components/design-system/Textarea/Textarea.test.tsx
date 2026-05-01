/**
 * Textarea Component Tests — Phase 2.A.4 Direction C (paper-card emphasis).
 */

import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  describe("Rendering", () => {
    it("renders as a textarea element", () => {
      render(<Textarea />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("renders placeholder text", () => {
      render(<Textarea placeholder="Schrijf hier..." />);
      expect(
        screen.getByPlaceholderText("Schrijf hier..."),
      ).toBeInTheDocument();
    });

    it("renders with a default value", () => {
      render(<Textarea defaultValue="Bericht inhoud" />);
      expect(screen.getByDisplayValue("Bericht inhoud")).toBeInTheDocument();
    });

    it("forwards ref", () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<Textarea ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });
  });

  describe("Resize", () => {
    it("uses vertical resize by default", () => {
      render(<Textarea data-testid="ta" />);
      expect(screen.getByTestId("ta")).toHaveClass("resize-y");
    });

    it("supports no resize", () => {
      render(<Textarea resize="none" data-testid="ta" />);
      expect(screen.getByTestId("ta")).toHaveClass("resize-none");
    });

    it("supports both resize", () => {
      render(<Textarea resize="both" data-testid="ta" />);
      expect(screen.getByTestId("ta")).toHaveClass("resize");
    });
  });

  describe("Field chrome — paper-card emphasis", () => {
    it("renders 2px border + paper-soft shadow at rest", () => {
      render(<Textarea data-testid="ta" />);
      const el = screen.getByTestId("ta");
      expect(el).toHaveClass("border-2", "bg-white");
      expect(el.className).toContain("shadow-[var(--shadow-paper-sm-soft)]");
    });

    it("does not apply rounded corners", () => {
      render(<Textarea data-testid="ta" />);
      expect(screen.getByTestId("ta").className).not.toMatch(/\brounded-/);
    });

    it("does not reference legacy kcvv-/foundation- tokens", () => {
      render(<Textarea data-testid="ta" />);
      const cls = screen.getByTestId("ta").className;
      expect(cls).not.toContain("kcvv-alert");
      expect(cls).not.toContain("kcvv-green-bright");
      expect(cls).not.toContain("foundation-gray");
    });
  });

  describe("Error state", () => {
    it("renders an AlertBadge with FOUT label and message", () => {
      render(<Textarea error="Dit veld is verplicht." />);
      expect(screen.getByText("FOUT")).toBeInTheDocument();
      expect(screen.getByText("Dit veld is verplicht.")).toBeInTheDocument();
    });

    it("flips border + shadow to alert variant + sets aria-invalid", () => {
      render(<Textarea error="Fout" data-testid="ta" />);
      const ta = screen.getByTestId("ta");
      expect(ta).toHaveClass("border-alert");
      expect(ta.className).toContain("shadow-[var(--shadow-paper-sm-alert)]");
      expect(ta).toHaveAttribute("aria-invalid", "true");
      expect(ta.getAttribute("aria-describedby")).toBeTruthy();
    });

    it("hides hint when error is present", () => {
      render(<Textarea error="Fout" hint="Hulptekst" />);
      expect(screen.queryByText("Hulptekst")).not.toBeInTheDocument();
    });
  });

  describe("Hint", () => {
    it("renders italic ink/60 hint when no error", () => {
      render(<Textarea hint="Maximaal 500 tekens." />);
      const el = screen.getByText("Maximaal 500 tekens.");
      expect(el).toHaveClass("italic", "text-ink/60");
    });
  });

  describe("Counter (controlled + maxLength)", () => {
    it("renders TextareaCounter when value + maxLength are set", () => {
      render(<Textarea value="abc" maxLength={10} onChange={() => {}} />);
      expect(screen.getByText("3/10")).toBeInTheDocument();
    });

    it("flips counter to text-alert when over the limit", () => {
      // maxLength on the element prevents typing past max, but the parent
      // can still drive a `value` longer than `maxLength` (e.g. seeded
      // from a draft) — we must surface the over-limit state visually.
      render(
        <Textarea value="abcdefghijk" maxLength={10} onChange={() => {}} />,
      );
      const counter = screen.getByText("11/10");
      expect(counter).toHaveClass("text-alert");
    });

    it("omits counter when uncontrolled", () => {
      render(<Textarea defaultValue="abc" maxLength={10} />);
      expect(screen.queryByText(/\/10$/)).not.toBeInTheDocument();
    });

    it("omits counter when no maxLength is provided", () => {
      render(<Textarea value="abc" onChange={() => {}} />);
      expect(screen.queryByText(/\/\d+$/)).not.toBeInTheDocument();
    });
  });

  describe("Disabled state", () => {
    it("flattens chrome", () => {
      render(<Textarea disabled data-testid="ta" />);
      const ta = screen.getByTestId("ta");
      expect(ta).toBeDisabled();
      expect(ta).toHaveClass(
        "disabled:bg-cream-soft",
        "disabled:opacity-50",
        "disabled:cursor-not-allowed",
      );
    });
  });

  describe("Rows", () => {
    it("passes rows attribute through", () => {
      render(<Textarea rows={6} />);
      expect(screen.getByRole("textbox")).toHaveAttribute("rows", "6");
    });
  });

  describe("Custom props", () => {
    it("accepts custom className", () => {
      render(<Textarea className="custom-class" data-testid="ta" />);
      expect(screen.getByTestId("ta")).toHaveClass("custom-class");
    });
  });

  describe("Interactions", () => {
    it("accepts typed input", async () => {
      const user = userEvent.setup();
      render(<Textarea />);
      await user.type(screen.getByRole("textbox"), "Hallo KCVV");
      expect(screen.getByRole("textbox")).toHaveValue("Hallo KCVV");
    });

    it("calls onChange when typing", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Textarea onChange={handleChange} />);
      await user.type(screen.getByRole("textbox"), "test");
      expect(handleChange).toHaveBeenCalled();
    });
  });
});
