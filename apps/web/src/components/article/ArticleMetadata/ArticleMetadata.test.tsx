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

  it("gives the Delen button a ≥44px tap target via padding, not a negative-margin trick (#2529 — Tap Target Rule)", () => {
    render(<ArticleMetadata {...defaultProps} />);
    const button = screen.getByRole("button", { name: "Delen" });
    // Padding-based hit area: py-3.5 (14px) around a 16px icon/line-height
    // row totals the 44px minimum. A negative margin would risk the hit
    // area bleeding into the facts line above when the bar wraps.
    expect(button.className).toMatch(/\bpy-3\.5\b/);
    expect(button.className).not.toMatch(/-my-|-mt-|-mb-/);
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

      try {
        const user = userEvent.setup();
        render(<ArticleMetadata {...defaultProps} />);
        await user.click(screen.getByRole("button", { name: "Delen" }));

        expect(mockShare).toHaveBeenCalledWith({
          title: defaultProps.author,
          url: defaultProps.shareConfig.url,
        });
        expect(trackEventMock).toHaveBeenCalledWith(
          "article_share",
          expect.objectContaining({ channel: "native" }),
        );
      } finally {
        Object.defineProperty(navigator, "share", {
          value: originalShare,
          writable: true,
          configurable: true,
        });
      }
    });

    it("falls back to the Facebook sharer and tracks the facebook channel when Web Share is unavailable", async () => {
      // happy-dom does not implement navigator.share by default — this is
      // the desktop-browser (Safari/macOS, Edge/Windows) code path.
      expect(navigator.share).toBeUndefined();
      const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

      try {
        const user = userEvent.setup();
        render(<ArticleMetadata {...defaultProps} />);
        await user.click(screen.getByRole("button", { name: "Delen" }));

        expect(openSpy).toHaveBeenCalledWith(
          "https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fkcvvelewijt.be%2Fnieuws%2Ftest",
          "_blank",
          "noopener,noreferrer",
        );
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
