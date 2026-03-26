/**
 * CalendarSubscribePanel Component Tests
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
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

// ── Tests ──────────────────────────────────────────────────────────────────

describe("CalendarSubscribePanel", () => {
  const mockWriteText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteText.mockResolvedValue(undefined);
    // Mock clipboard API — happy-dom may not have it
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

    it("renders panel when isOpen is true", () => {
      render(<CalendarSubscribePanel {...defaultProps} />);
      expect(screen.getByTestId("subscribe-panel")).toBeInTheDocument();
    });
  });

  describe("team selection", () => {
    it("shows all teams as selectable chips", () => {
      render(<CalendarSubscribePanel {...defaultProps} />);
      for (const team of teams) {
        expect(screen.getByText(team.label)).toBeInTheDocument();
      }
    });

    it("all teams are selected by default", () => {
      render(<CalendarSubscribePanel {...defaultProps} />);
      const chips = screen.getAllByRole("button", { name: /×/ });
      // All teams show remove buttons → all selected
      expect(chips).toHaveLength(3);
    });

    it("pre-selects only matching team when preselectedTeamLabel is set", () => {
      render(
        <CalendarSubscribePanel
          {...defaultProps}
          preselectedTeamLabel="A-ploeg"
        />,
      );
      // Only A-ploeg should have a remove button
      const chips = screen.getAllByRole("button", { name: /×/ });
      expect(chips).toHaveLength(1);
    });

    it("can toggle a team off by clicking its remove button", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);

      // Remove A-ploeg
      const removeButtons = screen.getAllByRole("button", { name: /×/ });
      await user.click(removeButtons[0]);

      // Should now show 2 selected teams
      const updatedChips = screen.getAllByRole("button", { name: /×/ });
      expect(updatedChips).toHaveLength(2);
    });
  });

  describe("side filter", () => {
    it("shows side filter dropdown with three options", () => {
      render(<CalendarSubscribePanel {...defaultProps} />);
      const select = screen.getByLabelText("Filter");
      expect(select).toBeInTheDocument();
      const options = within(select as HTMLElement).getAllByRole("option");
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent("Alle wedstrijden");
      expect(options[1]).toHaveTextContent("Alleen thuiswedstrijden");
      expect(options[2]).toHaveTextContent("Alleen uitwedstrijden");
    });
  });

  describe("webcal URL", () => {
    it("generates correct webcal URL with all teams", () => {
      render(<CalendarSubscribePanel {...defaultProps} />);
      const urlInput = screen.getByTestId("webcal-url");
      expect(urlInput).toHaveValue(
        "webcal://localhost:3000/api/calendar.ics?teamIds=101,102,103&side=all",
      );
    });

    it("updates URL when side filter changes", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);
      const select = screen.getByLabelText("Filter");
      await user.selectOptions(select, "home");

      const urlInput = screen.getByTestId("webcal-url");
      expect(urlInput).toHaveValue(
        "webcal://localhost:3000/api/calendar.ics?teamIds=101,102,103&side=home",
      );
    });

    it("updates URL when team selection changes", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);

      // Remove first team
      const removeButtons = screen.getAllByRole("button", { name: /×/ });
      await user.click(removeButtons[0]);

      const urlInput = screen.getByTestId("webcal-url");
      expect(urlInput).toHaveValue(
        "webcal://localhost:3000/api/calendar.ics?teamIds=102,103&side=all",
      );
    });
  });

  describe("copy to clipboard", () => {
    it("copies URL to clipboard when clicking copy button", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);

      await user.click(screen.getByText("Kopieer link"));
      expect(mockWriteText).toHaveBeenCalledWith(
        "webcal://localhost:3000/api/calendar.ics?teamIds=101,102,103&side=all",
      );
    });

    it("shows confirmation feedback after copy", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);

      await user.click(screen.getByText("Kopieer link"));
      expect(screen.getByText("Gekopieerd")).toBeInTheDocument();
    });
  });

  describe("QR code", () => {
    it("toggles QR code display when clicking QR button", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);

      expect(screen.queryByTestId("qr-code")).not.toBeInTheDocument();
      await user.click(screen.getByText("Toon QR-code"));
      expect(screen.getByTestId("qr-code")).toBeInTheDocument();
    });
  });
});
