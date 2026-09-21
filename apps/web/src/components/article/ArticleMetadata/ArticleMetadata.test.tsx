import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArticleMetadata } from "./ArticleMetadata";

const trackEventMock = vi.fn();
vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

const defaultProps = {
  author: "Redactie KCVV",
  date: "19.04.2026",
  readingTime: "4 min lezen",
  shareConfig: {
    url: "https://kcvvelewijt.be/nieuws/test",
  },
  articleId: "article-doc-1",
  articleType: "announcement",
};

describe("ArticleMetadata", () => {
  beforeEach(() => {
    trackEventMock.mockReset();
  });

  it("renders the facts row in design order (date, author, reading time)", () => {
    render(<ArticleMetadata {...defaultProps} />);
    const navText = (
      screen.getByRole("navigation", { name: "Artikelinfo" }).textContent ?? ""
    ).replace(/\s+/g, " ");
    expect(navText.indexOf("19.04.2026")).toBeGreaterThanOrEqual(0);
    expect(navText.indexOf("Redactie KCVV")).toBeGreaterThan(
      navText.indexOf("19.04.2026"),
    );
    expect(navText.indexOf("4 min lezen")).toBeGreaterThan(
      navText.indexOf("Redactie KCVV"),
    );
  });

  it("omits missing facts — shows only author when date and readingTime are empty", () => {
    render(<ArticleMetadata author="Redactie KCVV" />);
    const nav = screen.getByRole("navigation", { name: "Artikelinfo" });
    expect(nav).toHaveTextContent("Redactie KCVV");
    expect(nav.textContent ?? "").not.toContain("·");
  });

  it("renders one labelled Delen button when shareConfig is set — no separate Facebook control (#2529)", () => {
    render(<ArticleMetadata {...defaultProps} />);
    const button = screen.getByRole("button", { name: "Delen" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Delen");
    expect(
      screen.queryByRole("link", { name: /facebook/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /facebook/i }),
    ).not.toBeInTheDocument();
  });

  it("does not render the share button without shareConfig", () => {
    render(<ArticleMetadata author="Redactie KCVV" date="19.04.2026" />);
    expect(screen.queryByRole("button", { name: "Delen" })).toBeNull();
  });

  it("renders as a nav element with the metadata-bar label", () => {
    const { container } = render(<ArticleMetadata {...defaultProps} />);
    const nav = container.querySelector("nav");
    expect(nav).toHaveAttribute("aria-label", "Artikelinfo");
  });

  it("applies border-y border-paper-edge so rules appear above AND below", () => {
    const { container } = render(<ArticleMetadata {...defaultProps} />);
    const nav = container.querySelector("nav");
    expect(nav).toHaveClass("border-y");
    expect(nav).toHaveClass("border-paper-edge");
  });

  it("applies custom className", () => {
    const { container } = render(
      <ArticleMetadata {...defaultProps} className="custom-metadata" />,
    );
    expect(container.querySelector("nav")).toHaveClass("custom-metadata");
  });

  it("falls back to the club default author when none is supplied", () => {
    // The four article templates all render the same implicit club author
    // until an editor-authored byline field lands. Defaulting inside
    // ArticleMetadata removes per-template `const AUTHOR = "KCVV Elewijt"`
    // duplication. See #1361 cross-template polish.
    render(
      <ArticleMetadata
        date="19.04.2026"
        readingTime="6 min lezen"
        shareConfig={{ url: "https://kcvvelewijt.be/nieuws/test" }}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "Artikelinfo" });
    expect(nav).toHaveTextContent("KCVV Elewijt");
  });

  it("gives the Delen button a 44px tap target that spills only into space the bar itself owns (#2529 — Tap Target Rule, review finding on #3071)", () => {
    const { container } = render(<ArticleMetadata {...defaultProps} />);
    const button = screen.getByRole("button", { name: "Delen" });
    const nav = container.querySelector("nav");
    const row = nav?.firstElementChild;

    // 44px hit area (py-3.5), cancelled from the row's own flow height
    // with a matching negative margin (-my-3.5) — the SiteHeader nav-link
    // idiom (#2394) — so the bar's rendered height is unaffected by the
    // button's padding. Without the cancelling margin, the padded box
    // counted toward the row's flow height and grew the whole bar ~28px.
    expect(button.className).toMatch(/\bpy-3\.5\b/);
    expect(button.className).toMatch(/-my-3\.5\b/);

    // The overhang the negative margin creates has somewhere sanctioned to
    // go: the row's own gap (raised to 14px so it exactly contains the
    // overhang above the button's line when the bar wraps, never reaching
    // the facts line) and the nav's own padding (raised to match, so the
    // overhang reaches the nav's own border without crossing into a
    // neighbouring section) — never a bare negative margin with no
    // container-owned space to spend it in.
    expect(row?.className).toMatch(/\bgap-y-3\.5\b/);
    expect(nav).toHaveClass("py-3.5");
  });

  it("keeps the bar's original py-3/gap-y-2 when there is no Delen button to contain an overhang for (review finding on #3071)", () => {
    const { container } = render(
      <ArticleMetadata author="Redactie KCVV" date="19.04.2026" />,
    );
    const nav = container.querySelector("nav");
    const row = nav?.firstElementChild;
    expect(nav).toHaveClass("py-3");
    expect(nav).not.toHaveClass("py-3.5");
    expect(row?.className).toMatch(/\bgap-y-2\b/);
    expect(row?.className).not.toMatch(/\bgap-y-3\.5\b/);
  });

  describe("share tracking — every existing trackShare channel keeps firing (#2529)", () => {
    it("uses navigator.share and tracks the native channel when Web Share is available", async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      const originalShare = navigator.share;
      Object.defineProperty(navigator, "share", {
        value: mockShare,
        writable: true,
        configurable: true,
      });
      const openSpyForNativeTest = vi
        .spyOn(window, "open")
        .mockImplementation(() => null);

      try {
        const user = userEvent.setup();
        render(<ArticleMetadata {...defaultProps} />);
        await user.click(screen.getByRole("button", { name: "Delen" }));

        expect(mockShare).toHaveBeenCalledTimes(1);
        expect(mockShare).toHaveBeenCalledWith({
          title: defaultProps.author,
          url: defaultProps.shareConfig.url,
        });
        expect(trackEventMock).toHaveBeenCalledTimes(1);
        expect(trackEventMock).toHaveBeenCalledWith(
          "article_share",
          expect.objectContaining({ channel: "native" }),
        );
        // The native path must never also fall through to the Facebook
        // window — a double-fire would double-count the share.
        expect(openSpyForNativeTest).not.toHaveBeenCalled();
      } finally {
        Object.defineProperty(navigator, "share", {
          value: originalShare,
          writable: true,
          configurable: true,
        });
        openSpyForNativeTest.mockRestore();
      }
    });

    it("falls back to the Facebook sharer and tracks the facebook channel when Web Share is unavailable", async () => {
      // happy-dom does not implement navigator.share by default — this
      // simulates the browsers WITHOUT Web Share, i.e. the owner's
      // decision comment's Chrome/Firefox on macOS/Linux, not Safari/macOS
      // or Edge/Windows (both of which have Web Share and take the branch
      // above).
      expect(navigator.share).toBeUndefined();
      const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

      try {
        const user = userEvent.setup();
        render(<ArticleMetadata {...defaultProps} />);
        await user.click(screen.getByRole("button", { name: "Delen" }));

        expect(openSpy).toHaveBeenCalledTimes(1);
        expect(openSpy).toHaveBeenCalledWith(
          "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fkcvvelewijt.be%2Fnieuws%2Ftest",
          "_blank",
          "noopener,noreferrer",
        );
        expect(trackEventMock).toHaveBeenCalledTimes(1);
        expect(trackEventMock).toHaveBeenCalledWith(
          "article_share",
          expect.objectContaining({ channel: "facebook" }),
        );
      } finally {
        openSpy.mockRestore();
      }
    });

    it("does not track when articleId is absent", async () => {
      const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

      try {
        const user = userEvent.setup();
        render(
          <ArticleMetadata
            author="Redactie KCVV"
            shareConfig={{ url: "https://kcvvelewijt.be/nieuws/test" }}
          />,
        );
        await user.click(screen.getByRole("button", { name: "Delen" }));

        expect(openSpy).toHaveBeenCalled();
        expect(trackEventMock).not.toHaveBeenCalled();
      } finally {
        openSpy.mockRestore();
      }
    });
  });
});
