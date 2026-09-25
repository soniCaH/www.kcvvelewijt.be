import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const trackArticleCtaClick = vi.fn();

vi.mock("@/hooks/useArticleAnalytics", () => ({
  useArticleAnalytics: () => ({
    trackArticleCtaClick,
  }),
}));

import { ArticleCtaAnalytics } from "./ArticleCtaAnalytics";

describe("ArticleCtaAnalytics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("tracks a click on the data-article-cta marker", () => {
    render(
      <ArticleCtaAnalytics articleId="art-1" articleType="announcement">
        <a data-article-cta="true" href="#">
          Schrijf je in
        </a>
      </ArticleCtaAnalytics>,
    );
    fireEvent.click(screen.getByText("Schrijf je in"));
    expect(trackArticleCtaClick).toHaveBeenCalledWith({
      articleId: "art-1",
      articleType: "announcement",
    });
  });

  it("ignores clicks outside the marker", () => {
    render(
      <ArticleCtaAnalytics articleId="art-2" articleType="event">
        <div>plain</div>
      </ArticleCtaAnalytics>,
    );
    fireEvent.click(screen.getByText("plain"));
    expect(trackArticleCtaClick).not.toHaveBeenCalled();
  });
});
