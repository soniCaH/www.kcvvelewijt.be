/**
 * CalendarSubscribePanel Component Tests (Phase 6.D — #1994, 6d5 "Seizoenskaart").
 *
 * The panel is a ticket-stub: an always-visible QR stub + team chips + a
 * thuis/uit segmented control + a single copy button. The raw webcal URL is not
 * surfaced, so URL generation is asserted through the clipboard.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarSubscribePanel } from "./CalendarSubscribePanel";
import type { CalendarTeamInfo } from "@/app/(main)/kalender/utils";

// ── Fixtures ───────────────────────────────────────────────────────────────

const teams: CalendarTeamInfo[] = [
  { id: "t1", name: "A-ploeg", psdId: 101, label: "A-ploeg" },
  { id: "t2", name: "B-ploeg", psdId: 102, label: "B-ploeg" },
  { id: "t3", name: "U15 A", psdId: 103, label: "U15 A" },
];

const defaultProps = {
  teams,
  isOpen: true,
  preselectedTeamLabel: undefined as string | undefined,
};

describe("CalendarSubscribePanel", () => {
  const mockWriteText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockResolvedValue(undefined);
    if (!navigator.clipboard) {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: mockWriteText },
        writable: true,
        configurable: true,
      });
    } else {
      vi.spyOn(navigator.clipboard, "writeText").mockImplementation(
        mockWriteText,
      );
    }
  });

  describe("visibility", () => {
    it("renders nothing when isOpen is false", () => {
      const { container } = render(
        <CalendarSubscribePanel {...defaultProps} isOpen={false} />,
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders the panel when isOpen is true", () => {
      render(<CalendarSubscribePanel {...defaultProps} />);
      expect(screen.getByTestId("subscribe-panel")).toBeInTheDocument();
    });

    it("always shows the QR stub", () => {
      render(<CalendarSubscribePanel {...defaultProps} />);
      expect(screen.getByTestId("qr-code")).toBeInTheDocument();
    });
  });

  describe("team selection", () => {
    it("shows all teams as chips, selected by default", () => {
      render(<CalendarSubscribePanel {...defaultProps} />);
      const chips = screen.getAllByRole("button", { name: /Verwijder/ });
      expect(chips).toHaveLength(3);
    });

    it("pre-selects only the matching team when preselectedTeamLabel is set", () => {
      render(
        <CalendarSubscribePanel
          {...defaultProps}
          preselectedTeamLabel="A-ploeg"
        />,
      );
      expect(screen.getAllByRole("button", { name: /Verwijder/ })).toHaveLength(
        1,
      );
    });

    it("toggles a team off via its remove button", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);
      await user.click(
        screen.getAllByRole("button", { name: /Verwijder/ })[0]!,
      );
      expect(screen.getAllByRole("button", { name: /Verwijder/ })).toHaveLength(
        2,
      );
    });
  });

  describe("side filter (segmented)", () => {
    it("renders three side options with Alle pressed by default", () => {
      render(<CalendarSubscribePanel {...defaultProps} />);
      expect(screen.getByRole("button", { name: "Alle" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByRole("button", { name: "Thuis" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Uit" })).toBeInTheDocument();
    });
  });

  describe("webcal URL (via clipboard)", () => {
    it("copies the all-teams webcal URL", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: /Kopieer link/ }));
      expect(mockWriteText).toHaveBeenCalledWith(
        "webcal://localhost:3000/api/calendar.ics?teamIds=101,102,103&side=all",
      );
    });

    it("reflects the side filter in the copied URL", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: "Thuis" }));
      await user.click(screen.getByRole("button", { name: /Kopieer link/ }));
      expect(mockWriteText).toHaveBeenCalledWith(
        "webcal://localhost:3000/api/calendar.ics?teamIds=101,102,103&side=home",
      );
    });

    it("reflects the team selection in the copied URL", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);
      await user.click(
        screen.getAllByRole("button", { name: /Verwijder/ })[0]!,
      );
      await user.click(screen.getByRole("button", { name: /Kopieer link/ }));
      expect(mockWriteText).toHaveBeenCalledWith(
        "webcal://localhost:3000/api/calendar.ics?teamIds=102,103&side=all",
      );
    });
  });

  describe("copy feedback", () => {
    it("shows a confirmation after copying", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: /Kopieer link/ }));
      expect(screen.getByText("Gekopieerd")).toBeInTheDocument();
    });
  });
});
