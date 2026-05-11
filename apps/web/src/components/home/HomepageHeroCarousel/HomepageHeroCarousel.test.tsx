import { describe, it, expect, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import type { ImageProps } from "next/image";
import { HomepageHeroCarousel } from "./HomepageHeroCarousel";
import {
  mockArticles,
  mockSingleArticle,
  mockTwoArticles,
} from "./HomepageHeroCarousel.mocks";

vi.mock("next/image", () => ({
  default: ({ alt, src, ...rest }: ImageProps) => {
    const props = { alt, src: typeof src === "string" ? src : "", ...rest };
    return <img {...props} />;
  },
}));

describe("HomepageHeroCarousel", () => {
  it("returns null when articles list is empty", () => {
    const { container } = render(<HomepageHeroCarousel articles={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the hero only — no carousel chrome — for a single article", () => {
    render(<HomepageHeroCarousel articles={mockSingleArticle} />);
    expect(screen.queryByRole("button", { name: /auto-rotatie/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^slide /i })).toBeNull();
  });

  it("renders 3 thumb buttons with aria-label and aria-pressed", () => {
    render(<HomepageHeroCarousel articles={mockArticles} initialPaused />);
    const thumbs = screen.getAllByRole("button", {
      name: /^slide \d+ van 3/i,
    });
    expect(thumbs).toHaveLength(3);
    expect(thumbs[0]).toHaveAttribute("aria-pressed", "true");
    expect(thumbs[1]).toHaveAttribute("aria-pressed", "false");
    expect(thumbs[2]).toHaveAttribute("aria-pressed", "false");
  });

  it("clicking a thumb jumps the carousel to that slide", () => {
    render(<HomepageHeroCarousel articles={mockArticles} initialPaused />);
    fireEvent.click(screen.getByRole("button", { name: /^slide 3 van 3/i }));
    const thumbs = screen.getAllByRole("button", {
      name: /^slide \d+ van 3/i,
    });
    expect(thumbs[2]).toHaveAttribute("aria-pressed", "true");
    expect(thumbs[0]).toHaveAttribute("aria-pressed", "false");
  });

  it("auto-advances every interval when not paused", () => {
    vi.useFakeTimers();
    try {
      render(
        <HomepageHeroCarousel
          articles={mockArticles}
          autoRotateInterval={2000}
        />,
      );
      const thumbsBefore = screen.getAllByRole("button", {
        name: /^slide \d+ van 3/i,
      });
      expect(thumbsBefore[0]).toHaveAttribute("aria-pressed", "true");

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      const thumbsAfter1 = screen.getAllByRole("button", {
        name: /^slide \d+ van 3/i,
      });
      expect(thumbsAfter1[1]).toHaveAttribute("aria-pressed", "true");

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      const thumbsAfter2 = screen.getAllByRole("button", {
        name: /^slide \d+ van 3/i,
      });
      expect(thumbsAfter2[2]).toHaveAttribute("aria-pressed", "true");
    } finally {
      vi.useRealTimers();
    }
  });

  it("pause button toggles auto-rotation and updates aria-pressed", () => {
    vi.useFakeTimers();
    try {
      render(
        <HomepageHeroCarousel
          articles={mockArticles}
          autoRotateInterval={1000}
        />,
      );
      const pause = screen.getByRole("button", { name: /pauzeren/i });
      expect(pause).toHaveAttribute("aria-pressed", "false");
      fireEvent.click(pause);

      act(() => {
        vi.advanceTimersByTime(5000);
      });
      const thumbs = screen.getAllByRole("button", {
        name: /^slide \d+ van 3/i,
      });
      expect(thumbs[0]).toHaveAttribute("aria-pressed", "true");
      expect(
        screen.getByRole("button", { name: /hervatten/i }),
      ).toHaveAttribute("aria-pressed", "true");
    } finally {
      vi.useRealTimers();
    }
  });

  it("arrow keys advance and rewind the carousel", () => {
    render(<HomepageHeroCarousel articles={mockArticles} initialPaused />);
    const region = screen.getByRole("region", {
      name: /uitgelichte artikels/i,
    });
    fireEvent.keyDown(region, { key: "ArrowRight" });
    let thumbs = screen.getAllByRole("button", {
      name: /^slide \d+ van 3/i,
    });
    expect(thumbs[1]).toHaveAttribute("aria-pressed", "true");
    fireEvent.keyDown(region, { key: "ArrowLeft" });
    thumbs = screen.getAllByRole("button", { name: /^slide \d+ van 3/i });
    expect(thumbs[0]).toHaveAttribute("aria-pressed", "true");
    // Wrap-around: left at slide 0 goes to last.
    fireEvent.keyDown(region, { key: "ArrowLeft" });
    thumbs = screen.getAllByRole("button", { name: /^slide \d+ van 3/i });
    expect(thumbs[2]).toHaveAttribute("aria-pressed", "true");
  });

  it("renders 2 thumb buttons for a 2-article carousel", () => {
    render(<HomepageHeroCarousel articles={mockTwoArticles} initialPaused />);
    const thumbs = screen.getAllByRole("button", {
      name: /^slide \d+ van 2/i,
    });
    expect(thumbs).toHaveLength(2);
  });
});
