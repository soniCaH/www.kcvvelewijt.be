import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MatchStripClient } from "./MatchStripClient";
import type { UpcomingMatch } from "@/components/match/types";
import {
  mockUpcomingMatch,
  mockFinishedMatchWin,
} from "@/components/home/MatchWidget/MatchWidget.mocks";
import { trackEvent } from "@/lib/analytics/track-event";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const STORAGE_KEY = "matchStripDismissed";

beforeEach(() => {
  sessionStorage.clear();
});

describe("MatchStripClient", () => {
  describe("rendering", () => {
    it("renders match strip content when not dismissed", () => {
      render(<MatchStripClient match={mockUpcomingMatch} />);
      expect(screen.getByText(/Volgende/)).toBeInTheDocument();
      expect(screen.getByText(/KVC Wilrijk/)).toBeInTheDocument();
    });

    it("renders nothing when match is null", () => {
      const { container } = render(<MatchStripClient match={null} />);
      expect(container.innerHTML).toBe("");
    });

    it("renders a link to the match detail page", () => {
      render(<MatchStripClient match={mockUpcomingMatch} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "href",
        `/wedstrijd/${mockUpcomingMatch.id}`,
      );
    });
  });

  describe("dismiss button", () => {
    it("renders a dismiss button", () => {
      render(<MatchStripClient match={mockUpcomingMatch} />);
      expect(
        screen.getByRole("button", { name: /verberg/i }),
      ).toBeInTheDocument();
    });

    it("hides the strip when dismiss is clicked", () => {
      render(<MatchStripClient match={mockUpcomingMatch} />);
      const dismissBtn = screen.getByRole("button", { name: /verberg/i });
      fireEvent.click(dismissBtn);
      expect(screen.queryByText(/Volgende/)).not.toBeInTheDocument();
    });

    it("writes to sessionStorage on dismiss", () => {
      render(<MatchStripClient match={mockUpcomingMatch} />);
      const dismissBtn = screen.getByRole("button", { name: /verberg/i });
      fireEvent.click(dismissBtn);
      expect(sessionStorage.getItem(STORAGE_KEY)).toBe("true");
    });
  });

  describe("sessionStorage persistence", () => {
    it("does not render strip when sessionStorage has dismissed flag", () => {
      sessionStorage.setItem(STORAGE_KEY, "true");
      const { container } = render(
        <MatchStripClient match={mockUpcomingMatch} />,
      );
      expect(container.innerHTML).toBe("");
    });

    it("renders strip when sessionStorage has no dismissed flag", () => {
      render(<MatchStripClient match={mockUpcomingMatch} />);
      expect(screen.getByText(/Volgende/)).toBeInTheDocument();
    });
  });

  describe("analytics", () => {
    beforeEach(() => {
      vi.mocked(trackEvent).mockClear();
    });

    it("fires firstteam_strip_clicked with correct payload on link click", () => {
      render(<MatchStripClient match={mockUpcomingMatch} />);
      fireEvent.click(screen.getByRole("link"));
      expect(trackEvent).toHaveBeenCalledWith("firstteam_strip_clicked", {
        source: "match_strip",
        match_id: mockUpcomingMatch.id,
        match_status: mockUpcomingMatch.status,
      });
    });

    it("fires firstteam_strip_clicked for finished match", () => {
      render(<MatchStripClient match={mockFinishedMatchWin} />);
      fireEvent.click(screen.getByRole("link"));
      expect(trackEvent).toHaveBeenCalledWith("firstteam_strip_clicked", {
        source: "match_strip",
        match_id: mockFinishedMatchWin.id,
        match_status: mockFinishedMatchWin.status,
      });
    });

    it("fires firstteam_strip_dismissed on dismiss", () => {
      render(<MatchStripClient match={mockUpcomingMatch} />);
      fireEvent.click(screen.getByRole("button", { name: /verberg/i }));
      expect(trackEvent).toHaveBeenCalledWith("firstteam_strip_dismissed");
    });
  });

  describe("accessibility", () => {
    it("has aria-label with last result for finished match", () => {
      render(<MatchStripClient match={mockFinishedMatchWin} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "aria-label",
        "Laatste uitslag: KCVV Elewijt 3-1 FC Wezel Sport",
      );
    });

    it("has aria-label with next match for scheduled match", () => {
      render(<MatchStripClient match={mockUpcomingMatch} />);
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute(
        "aria-label",
        expect.stringMatching(/^Volgende wedstrijd: vs KVC Wilrijk, .+ 15:00$/),
      );
    });

    it("has aria-label without time when time is missing", () => {
      const matchWithoutTime: UpcomingMatch = {
        ...mockUpcomingMatch,
        time: undefined,
      };
      render(<MatchStripClient match={matchWithoutTime} />);
      const link = screen.getByRole("link");
      const ariaLabel = link.getAttribute("aria-label") ?? "";
      expect(ariaLabel).toMatch(/^Volgende wedstrijd: vs KVC Wilrijk, /);
      expect(ariaLabel).not.toMatch(/\d{2}:\d{2}$/);
    });
  });

  describe("mobile styling", () => {
    it("truncates opponent name on mobile for scheduled match", () => {
      render(<MatchStripClient match={mockUpcomingMatch} />);
      const opponentEl = screen.getByText(/vs KVC Wilrijk/);
      expect(opponentEl.className).toContain("truncate");
    });

    it("link has full-width tap target", () => {
      render(<MatchStripClient match={mockUpcomingMatch} />);
      const link = screen.getByRole("link");
      expect(link.className).toContain("flex-1");
    });
  });
});
