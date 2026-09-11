/**
 * CalendarSubscribePanel Component Tests (Phase 6.D — #1994, 6d5 "Seizoenskaart").
 *
 * The panel is a ticket-stub: an always-visible QR stub + team chips + a
 * thuis/uit segmented control + a single copy button. The raw webcal URL is not
 * surfaced, so URL generation is asserted through the clipboard.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarSubscribePanel } from "./CalendarSubscribePanel";
import { trackEvent } from "@/lib/analytics/track-event";
import type { CalendarTeamInfo } from "@/app/(main)/kalender/utils";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));
vi.mock("qrcode.react", () => ({
  QRCodeSVG: ({ value }: { value: string }) => (
    <svg data-testid="qr-value" data-value={value} />
  ),
}));

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
    it("copies the all-teams webcal URL with club activities included by default", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: /Kopieer link/ }));
      expect(mockWriteText).toHaveBeenCalledWith(
        "webcal://localhost:3000/api/calendar.ics?teamIds=101,102,103&side=all&events=1",
      );
    });

    it("reflects the side filter in the copied URL", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: "Thuis" }));
      await user.click(screen.getByRole("button", { name: /Kopieer link/ }));
      expect(mockWriteText).toHaveBeenCalledWith(
        "webcal://localhost:3000/api/calendar.ics?teamIds=101,102,103&side=home&events=1",
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
        "webcal://localhost:3000/api/calendar.ics?teamIds=102,103&side=all&events=1",
      );
    });

    it("drops the events flag entirely when the club-activities switch is turned off", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);
      await user.click(
        screen.getByRole("switch", { name: /clubactiviteiten/i }),
      );
      await user.click(screen.getByRole("button", { name: /Kopieer link/ }));
      expect(mockWriteText).toHaveBeenCalledWith(
        "webcal://localhost:3000/api/calendar.ics?teamIds=101,102,103&side=all",
      );
    });

    it("encodes the same URL in the QR code as the copied link", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: /Kopieer link/ }));
      const qrValue = screen.getByTestId("qr-value").dataset.value;
      expect(qrValue).toBe(mockWriteText.mock.calls[0]![0]);
    });
  });

  describe("club-activities switch", () => {
    it("is on by default, named 'Clubactiviteiten'", () => {
      render(<CalendarSubscribePanel {...defaultProps} />);
      expect(
        screen.getByRole("switch", { name: /clubactiviteiten/i }),
      ).toHaveAttribute("aria-checked", "true");
    });

    it("toggles off on click", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);
      const toggle = screen.getByRole("switch", { name: /clubactiviteiten/i });
      await user.click(toggle);
      expect(toggle).toHaveAttribute("aria-checked", "false");
    });
  });

  describe("copy failure (#2580)", () => {
    it("shows a failure notice, logs to the console, and never surfaces the raw error", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const clipboardError = new Error("denied");
      mockWriteText.mockRejectedValueOnce(clipboardError);

      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: /Kopieer link/ }));

      // The accented substring splits the sentence across DOM nodes, so
      // assert on the notice's own alert region's full text content.
      // `role="alert"` (not "status"): the visitor just clicked "Kopieer
      // link", so the failure is announced immediately (#2580 review
      // finding 3).
      const notice = await screen.findByRole("alert");
      expect(notice).toHaveTextContent(
        "Kopiëren mislukt. Scan de QR-code om te abonneren.",
      );
      // The visitor never sees the caught error's own text.
      expect(screen.queryByText("denied")).not.toBeInTheDocument();
      expect(consoleError).toHaveBeenCalledWith(
        "Failed to copy to clipboard:",
        clipboardError,
      );

      consoleError.mockRestore();
    });

    it("clears the failure notice after a subsequent successful copy", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockWriteText.mockRejectedValueOnce(new Error("denied"));

      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);
      const copyButton = screen.getByRole("button", { name: /Kopieer link/ });
      await user.click(copyButton);
      await screen.findByRole("alert");

      mockWriteText.mockResolvedValueOnce(undefined);
      await user.click(copyButton);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("clears the failure notice when the team selection changes", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockWriteText.mockRejectedValueOnce(new Error("denied"));

      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: /Kopieer link/ }));
      await screen.findByRole("alert");

      // Removing a team changes `webcalUrl` — the notice described a click
      // against the URL as it stood before this change, so it must not
      // survive describing a URL that no longer matches the selection.
      await user.click(
        screen.getAllByRole("button", { name: /Verwijder/ })[0]!,
      );

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("keeps a later failure's notice when an earlier, now-stale attempt resolves successfully afterwards", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);
      const copyButton = screen.getByRole("button", { name: /Kopieer link/ });

      // Attempt A: all three teams selected, held pending — resolves later.
      let resolveA!: () => void;
      const pendingA = new Promise<void>((resolve) => {
        resolveA = resolve;
      });
      mockWriteText.mockReturnValueOnce(pendingA);
      await user.click(copyButton);

      // Change the selection while A is still in flight — webcalUrl now
      // differs from what A captured.
      await user.click(
        screen.getAllByRole("button", { name: /Verwijder/ })[0]!,
      );

      // Attempt B: the new (smaller) selection, fails immediately.
      mockWriteText.mockRejectedValueOnce(new Error("denied"));
      await user.click(copyButton);
      await screen.findByRole("alert");

      // A now resolves successfully, for a URL that is no longer current —
      // it must not clear B's still-accurate failure notice (#2580: this
      // used to be an unconditional `setFailedUrl(null)` on any success).
      resolveA();
      await waitFor(() => expect(mockWriteText).toHaveBeenCalledTimes(2));
      expect(screen.getByRole("alert")).toBeInTheDocument();

      // The reverse order — B (the later click) succeeding while A (the
      // earlier one) is still pending — is already correct by construction:
      // `prev === webcalUrl` only ever compares against the CURRENT
      // `webcalUrl` a settling attempt itself captured, so it needs no
      // separate case here.
    });
  });

  describe("copy feedback", () => {
    it("shows a confirmation after copying", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: /Kopieer link/ }));
      expect(screen.getByText("Gekopieerd")).toBeInTheDocument();
    });

    it("reverts to 'Kopieer link' when the selection changes within the confirmation window (#2819)", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: /Kopieer link/ }));
      expect(screen.getByText("Gekopieerd")).toBeInTheDocument();

      // Changing the selection rebuilds `webcalUrl` — the confirmation
      // described the URL as it stood before this change, so it must not
      // survive describing a URL that was never actually copied.
      await user.click(
        screen.getAllByRole("button", { name: /Verwijder/ })[0]!,
      );

      expect(screen.queryByText("Gekopieerd")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Kopieer link" }),
      ).toBeInTheDocument();
    });

    it("still reverts to 'Kopieer link' after the existing timeout when nothing changes", async () => {
      vi.useFakeTimers();
      try {
        render(<CalendarSubscribePanel {...defaultProps} />);
        fireEvent.click(screen.getByRole("button", { name: /Kopieer link/ }));
        // Flush the clipboard promise's microtask (fireEvent is synchronous,
        // but handleCopy awaits navigator.clipboard.writeText first).
        await vi.waitFor(() =>
          expect(screen.getByText("Gekopieerd")).toBeInTheDocument(),
        );

        await act(async () => {
          await vi.advanceTimersByTimeAsync(2000);
        });

        expect(screen.queryByText("Gekopieerd")).not.toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it("fires kalender_subscribe_copy with teams_count + side + events", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);
      await user.click(screen.getByRole("button", { name: "Thuis" }));
      await user.click(screen.getByRole("button", { name: /Kopieer link/ }));
      expect(trackEvent).toHaveBeenCalledWith("kalender_subscribe_copy", {
        teams_count: 3,
        side: "home",
        events: true,
      });
    });

    it("reports events: false in analytics when the switch is off", async () => {
      const user = userEvent.setup();
      render(<CalendarSubscribePanel {...defaultProps} />);
      await user.click(
        screen.getByRole("switch", { name: /clubactiviteiten/i }),
      );
      await user.click(screen.getByRole("button", { name: /Kopieer link/ }));
      expect(trackEvent).toHaveBeenCalledWith("kalender_subscribe_copy", {
        teams_count: 3,
        side: "all",
        events: false,
      });
    });
  });
});
