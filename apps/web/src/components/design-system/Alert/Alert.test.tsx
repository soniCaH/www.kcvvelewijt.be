/**
 * Alert Component Tests
 *
 * Direction B ("Ticket Stub — torn from a programme") locked at the
 * Phase 2.A.5 design checkpoint (2026-04-30). PRD §6.4.B.
 */

import { createRef } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Alert } from "./Alert";

/**
 * Per WAI-ARIA, success/warning use `role="status"` (polite) and error
 * uses `role="alert"` (assertive). Tests that don't care about role —
 * they just want the alert root to assert visual classes — use this
 * helper to dodge the role split.
 */
const getAlertRoot = (container: HTMLElement) =>
  container.querySelector('[role="alert"], [role="status"]') as HTMLElement;

describe("Alert", () => {
  describe("Rendering", () => {
    it("should render children content", () => {
      render(<Alert>Inschrijvingen zijn open.</Alert>);
      expect(screen.getByText("Inschrijvingen zijn open.")).toBeInTheDocument();
    });

    it("should have role='status' with aria-live=polite for success (default)", () => {
      render(<Alert>Melding</Alert>);
      const alert = screen.getByRole("status");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute("aria-live", "polite");
    });

    it("should have role='status' with aria-live=polite for warning", () => {
      render(<Alert variant="warning">Melding</Alert>);
      const alert = screen.getByRole("status");
      expect(alert).toHaveAttribute("aria-live", "polite");
    });

    it("should have role='alert' with aria-live=assertive for error", () => {
      render(<Alert variant="error">Melding</Alert>);
      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "assertive");
    });

    it("should render title when provided", () => {
      render(<Alert title="Verzonden!">Inhoud</Alert>);
      expect(
        screen.getByRole("heading", { name: "Verzonden!" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Inhoud")).toBeInTheDocument();
    });

    it("should not render title element when not provided", () => {
      render(<Alert>Geen titel</Alert>);
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    });

    it("should forward ref to root div", () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(<Alert ref={ref}>Melding</Alert>);
      expect(ref.current).toBe(getAlertRoot(container));
    });
  });

  describe("Visual contract — Direction B ticket-stub", () => {
    it("renders the outer paper card (border-2 ink + shadow-paper-sm + rounded-none)", () => {
      const { container } = render(<Alert>x</Alert>);
      const alert = getAlertRoot(container);
      expect(alert).toHaveClass("border-2");
      expect(alert).toHaveClass("border-ink");
      expect(alert).toHaveClass("rounded-none");
      expect(alert.className).toContain("shadow-[var(--shadow-paper-sm)]");
    });

    it("renders the perforated notch column via kcvv-stub-notch utility", () => {
      const { container } = render(<Alert>x</Alert>);
      const notch = container.querySelector(".kcvv-stub-notch");
      expect(notch).toBeInTheDocument();
    });

    it("default variant is success — jersey-deep icon block on success-soft body", () => {
      const { container } = render(<Alert>x</Alert>);
      const alert = getAlertRoot(container);
      expect(alert).toHaveClass("bg-success-soft");
      const iconBlock = container.querySelector(
        ".kcvv-stub-notch > span",
      ) as HTMLElement;
      expect(iconBlock).toHaveClass("bg-jersey-deep");
      expect(iconBlock).toHaveClass("text-cream");
    });

    it("warning variant uses warning-soft body and warning icon block", () => {
      const { container } = render(<Alert variant="warning">x</Alert>);
      const alert = getAlertRoot(container);
      expect(alert).toHaveClass("bg-warning-soft");
      const iconBlock = container.querySelector(
        ".kcvv-stub-notch > span",
      ) as HTMLElement;
      expect(iconBlock).toHaveClass("bg-warning");
    });

    it("error variant uses alert-soft body and alert icon block", () => {
      const { container } = render(<Alert variant="error">x</Alert>);
      const alert = getAlertRoot(container);
      expect(alert).toHaveClass("bg-alert-soft");
      const iconBlock = container.querySelector(
        ".kcvv-stub-notch > span",
      ) as HTMLElement;
      expect(iconBlock).toHaveClass("bg-alert");
    });

    it("renders mono caps kicker label per variant", () => {
      const { rerender } = render(<Alert variant="success">x</Alert>);
      expect(screen.getByText(/MELDING/)).toBeInTheDocument();

      rerender(<Alert variant="warning">x</Alert>);
      expect(screen.getByText(/WAARSCHUWING/)).toBeInTheDocument();

      rerender(<Alert variant="error">x</Alert>);
      expect(screen.getByText(/FOUT/)).toBeInTheDocument();
    });

    it("renders title in italic Freight Display when provided", () => {
      render(<Alert title="Verzonden!">x</Alert>);
      const heading = screen.getByRole("heading", { name: "Verzonden!" });
      expect(heading).toHaveClass("font-display");
      expect(heading).toHaveClass("italic");
      expect(heading).toHaveClass("text-ink");
    });
  });

  describe("Dismissible", () => {
    it("should not show close button by default", () => {
      render(<Alert>Melding</Alert>);
      expect(
        screen.queryByRole("button", { name: /sluit melding/i }),
      ).not.toBeInTheDocument();
    });

    it("should show close button when dismissible is true", () => {
      render(<Alert dismissible>Melding</Alert>);
      expect(
        screen.getByRole("button", { name: /sluit melding/i }),
      ).toBeInTheDocument();
    });

    it("dismiss button uses ink-on-ink-hover for the Phosphor X glyph", () => {
      render(<Alert dismissible>Melding</Alert>);
      const button = screen.getByRole("button", { name: /sluit melding/i });
      expect(button.className).toContain("text-ink/60");
      expect(button.className).toContain("hover:text-ink");
    });

    it("dismiss button focus-visible ring uses jersey-deep", () => {
      render(<Alert dismissible>Melding</Alert>);
      const button = screen.getByRole("button", { name: /sluit melding/i });
      expect(button.className).toContain("focus-visible:ring-jersey-deep");
    });

    it("should call onDismiss when close button is clicked", async () => {
      const user = userEvent.setup();
      const handleDismiss = vi.fn();
      render(
        <Alert dismissible onDismiss={handleDismiss}>
          Melding
        </Alert>,
      );

      await user.click(screen.getByRole("button", { name: /sluit melding/i }));
      expect(handleDismiss).toHaveBeenCalledTimes(1);
    });

    it("should not throw when close button clicked without onDismiss", async () => {
      const user = userEvent.setup();
      render(<Alert dismissible>Melding</Alert>);
      await expect(
        user.click(screen.getByRole("button", { name: /sluit melding/i })),
      ).resolves.not.toThrow();
    });
  });

  describe("Accessibility", () => {
    it("notch column is hidden from accessibility tree", () => {
      const { container } = render(<Alert>x</Alert>);
      const notch = container.querySelector(".kcvv-stub-notch");
      expect(notch).toHaveAttribute("aria-hidden", "true");
    });

    it("renders the icon with aria-hidden", () => {
      const { container } = render(<Alert>x</Alert>);
      const icon = container.querySelector(".kcvv-stub-notch svg");
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Custom props", () => {
    it("should accept custom className", () => {
      const { container } = render(
        <Alert className="custom-alert">Melding</Alert>,
      );
      expect(getAlertRoot(container)).toHaveClass("custom-alert");
    });
  });
});
