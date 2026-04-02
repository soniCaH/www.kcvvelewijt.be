import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { FeaturedArticles, type FeaturedArticle } from "./FeaturedArticles";

describe("FeaturedArticles", () => {
  const mockArticles: FeaturedArticle[] = [
    {
      href: "/nieuws/article-1",
      title: "First Featured Article",
      description: "This is the first featured article description",
      imageUrl: "/images/article-1.jpg",
      imageAlt: "Article 1 image",
      date: "20 januari 2025",
      tags: [{ name: "Ploeg" }, { name: "Nieuws" }],
    },
    {
      href: "/nieuws/article-2",
      title: "Second Featured Article",
      description: "This is the second featured article description",
      imageUrl: "/images/article-2.jpg",
      imageAlt: "Article 2 image",
      date: "19 januari 2025",
      tags: [{ name: "Jeugd" }],
    },
    {
      href: "/nieuws/article-3",
      title: "Third Featured Article",
      imageUrl: "/images/article-3.jpg",
      imageAlt: "Article 3 image",
      date: "18 januari 2025",
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders the first article by default", () => {
    render(<FeaturedArticles articles={mockArticles} />);

    // Use role-based query for the main heading
    const heading = screen.getByRole("heading", {
      name: "First Featured Article",
      level: 2,
    });
    expect(heading).toBeInTheDocument();
    expect(
      screen.getByText("This is the first featured article description"),
    ).toBeInTheDocument();
    // Date appears once in main content and once in the sidebar panel
    expect(screen.getAllByText("20 januari 2025")).toHaveLength(2);
  });

  it("displays first tag as category badge above the title", () => {
    render(<FeaturedArticles articles={mockArticles} />);

    // Only the first tag renders as a badge; remaining tags are not shown
    expect(screen.getByText("Ploeg")).toBeInTheDocument();
    expect(screen.queryByText("Nieuws")).not.toBeInTheDocument();
  });

  it("renders navigation dots when multiple articles exist", () => {
    render(<FeaturedArticles articles={mockArticles} />);

    // 3 dots ("Artikel N: ...") + 3 thumbnails ("Ga naar artikel: ...") = 6 nav buttons
    const dots = screen.getAllByRole("button", {
      name: /Artikel \d|Ga naar artikel/i,
    });
    expect(dots).toHaveLength(6);
  });

  it("does not render navigation dots when only one article exists", () => {
    render(<FeaturedArticles articles={[mockArticles[0]]} />);

    const dots = screen.queryAllByRole("button", {
      name: /Artikel \d|Ga naar artikel/i,
    });
    expect(dots).toHaveLength(0);
  });

  it("switches articles when navigation dot is clicked", async () => {
    render(<FeaturedArticles articles={mockArticles} autoRotate={false} />);

    // Click second dot
    const secondDot = screen.getByRole("button", {
      name: "Artikel 2: Second Featured Article",
    });
    await act(async () => {
      secondDot.click();
    });

    // Use role-based query for the heading
    const heading = screen.getByRole("heading", {
      name: "Second Featured Article",
      level: 2,
    });
    expect(heading).toBeInTheDocument();
    expect(
      screen.getByText("This is the second featured article description"),
    ).toBeInTheDocument();
  });

  it("switches articles when side thumbnail is clicked", async () => {
    render(<FeaturedArticles articles={mockArticles} autoRotate={false} />);

    // Click second thumbnail (by updated aria-label)
    const secondThumbnail = screen.getByRole("button", {
      name: "Ga naar artikel: Second Featured Article",
    });
    await act(async () => {
      secondThumbnail.click();
    });

    // Use role-based query for the heading
    const heading = screen.getByRole("heading", {
      name: "Second Featured Article",
      level: 2,
    });
    expect(heading).toBeInTheDocument();
    expect(
      screen.getByText("This is the second featured article description"),
    ).toBeInTheDocument();
  });

  it("auto-rotates through articles", () => {
    render(
      <FeaturedArticles
        articles={mockArticles}
        autoRotate={true}
        autoRotateInterval={1000}
      />,
    );

    // Initially shows first article description
    expect(
      screen.getByText("This is the first featured article description"),
    ).toBeInTheDocument();

    // Advance timer by 1 second - should show second article
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(
      screen.getByText("This is the second featured article description"),
    ).toBeInTheDocument();

    // Advance timer by another second - should show third article (no description)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(
      screen.queryByText("This is the second featured article description"),
    ).not.toBeInTheDocument();

    // Advance timer by another second - should loop back to first article
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(
      screen.getByText("This is the first featured article description"),
    ).toBeInTheDocument();
  });

  it("does not auto-rotate when autoRotate is false", async () => {
    render(
      <FeaturedArticles
        articles={mockArticles}
        autoRotate={false}
        autoRotateInterval={1000}
      />,
    );

    expect(
      screen.getByText("This is the first featured article description"),
    ).toBeInTheDocument();

    // Advance timer
    vi.advanceTimersByTime(5000);

    // Should still show first article (description should still be present)
    expect(
      screen.getByText("This is the first featured article description"),
    ).toBeInTheDocument();
  });

  it("does not auto-rotate with only one article", async () => {
    render(
      <FeaturedArticles
        articles={[mockArticles[0]]}
        autoRotate={true}
        autoRotateInterval={1000}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "First Featured Article", level: 2 }),
    ).toBeInTheDocument();

    // Advance timer
    vi.advanceTimersByTime(5000);

    // Should still show first article (no rotation)
    expect(
      screen.getByRole("heading", { name: "First Featured Article", level: 2 }),
    ).toBeInTheDocument();
  });

  it("renders empty when no articles provided", () => {
    const { container } = render(<FeaturedArticles articles={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it("handles articles without images gracefully", () => {
    const articlesWithoutImages = [
      {
        ...mockArticles[0],
        imageUrl: null,
      },
    ];

    render(<FeaturedArticles articles={articlesWithoutImages} />);

    expect(
      screen.getByRole("heading", { name: "First Featured Article", level: 2 }),
    ).toBeInTheDocument();
  });

  it("handles articles without descriptions gracefully", () => {
    const articlesWithoutDescriptions = [
      {
        ...mockArticles[0],
        description: undefined,
      },
    ];

    render(<FeaturedArticles articles={articlesWithoutDescriptions} />);

    expect(
      screen.getByRole("heading", { name: "First Featured Article", level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("This is the first featured article description"),
    ).not.toBeInTheDocument();
  });

  it("handles articles without tags gracefully", () => {
    const articlesWithoutTags = [
      {
        ...mockArticles[0],
        tags: undefined,
      },
    ];

    render(<FeaturedArticles articles={articlesWithoutTags} />);

    expect(
      screen.getByRole("heading", { name: "First Featured Article", level: 2 }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Ploeg")).not.toBeInTheDocument();
  });

  it("shows only the first tag as category badge, ignores the rest", () => {
    const articleWithManyTags = [
      {
        ...mockArticles[0],
        tags: [
          { name: "Tag 1" },
          { name: "Tag 2" },
          { name: "Tag 3" },
          { name: "Tag 4" },
          { name: "Tag 5" },
        ],
      },
    ];

    render(<FeaturedArticles articles={articleWithManyTags} />);

    expect(screen.getByText("Tag 1")).toBeInTheDocument();
    expect(screen.queryByText("Tag 2")).not.toBeInTheDocument();
    expect(screen.queryByText("Tag 3")).not.toBeInTheDocument();
    expect(screen.queryByText("Tag 4")).not.toBeInTheDocument();
    expect(screen.queryByText("Tag 5")).not.toBeInTheDocument();
  });

  it("renders links with correct hrefs", () => {
    render(<FeaturedArticles articles={mockArticles} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/nieuws/article-1");
  });

  it("marks the current article dot as active via aria-current", () => {
    render(<FeaturedArticles articles={mockArticles} autoRotate={false} />);

    const firstDot = screen.getByRole("button", {
      name: "Artikel 1: First Featured Article",
    });
    expect(firstDot).toHaveAttribute("aria-current", "true");

    const secondDot = screen.getByRole("button", {
      name: "Artikel 2: Second Featured Article",
    });
    expect(secondDot).not.toHaveAttribute("aria-current");
  });

  it("supports keyboard navigation with arrow keys", async () => {
    render(<FeaturedArticles articles={mockArticles} autoRotate={false} />);

    const carousel = screen.getByRole("region", {
      name: "Uitgelichte artikelen",
    });

    // Navigate right with ArrowRight
    await act(async () => {
      carousel.focus();
      carousel.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
      );
    });

    // Use role-based query for heading to be specific
    expect(
      screen.getByRole("heading", {
        name: "Second Featured Article",
        level: 2,
      }),
    ).toBeInTheDocument();

    // Navigate left with ArrowLeft
    await act(async () => {
      carousel.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
      );
    });

    expect(
      screen.getByRole("heading", { name: "First Featured Article", level: 2 }),
    ).toBeInTheDocument();
  });

  it("pause button stops auto-rotation and play resumes it", () => {
    render(
      <FeaturedArticles
        articles={mockArticles}
        autoRotate={true}
        autoRotateInterval={1000}
      />,
    );

    const pauseBtn = screen.getByRole("button", {
      name: "Artikelen pauzeren",
    });
    act(() => {
      pauseBtn.click();
    });

    // Should now show play button
    expect(
      screen.getByRole("button", { name: "Artikelen hervatten" }),
    ).toBeInTheDocument();

    // Advance timer — rotation should be stopped
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(
      screen.getByText("This is the first featured article description"),
    ).toBeInTheDocument();

    // Resume
    const playBtn = screen.getByRole("button", { name: "Artikelen hervatten" });
    act(() => {
      playBtn.click();
    });
    expect(
      screen.getByRole("button", { name: "Artikelen pauzeren" }),
    ).toBeInTheDocument();

    // Advance timer after resume — rotation should actually restart
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(
      screen.getByText("This is the second featured article description"),
    ).toBeInTheDocument();
  });

  it("clamps autoRotateInterval to minimum 1000ms", () => {
    render(
      <FeaturedArticles
        articles={mockArticles}
        autoRotate={true}
        autoRotateInterval={100} // Too fast - should be clamped to 1000
      />,
    );

    expect(
      screen.getByText("This is the first featured article description"),
    ).toBeInTheDocument();

    // Advance by 100ms - should NOT rotate (clamped to 1000ms)
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(
      screen.getByText("This is the first featured article description"),
    ).toBeInTheDocument();

    // Advance by 1000ms - should rotate
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(
      screen.getByText("This is the second featured article description"),
    ).toBeInTheDocument();
  });

  it("clamps activeIndex when it exceeds article length", () => {
    const { rerender } = render(
      <FeaturedArticles articles={mockArticles} autoRotate={false} />,
    );

    // Navigate to third article (index 2)
    const thirdDot = screen.getByRole("button", {
      name: "Artikel 3: Third Featured Article",
    });
    act(() => {
      thirdDot.click();
    });

    expect(
      screen.getByRole("heading", { name: "Third Featured Article", level: 2 }),
    ).toBeInTheDocument();

    // Remove articles - activeIndex (2) is now >= articles.length (1)
    rerender(
      <FeaturedArticles articles={[mockArticles[0]]} autoRotate={false} />,
    );

    // Should clamp to first article (index 0)
    expect(
      screen.getByRole("heading", { name: "First Featured Article", level: 2 }),
    ).toBeInTheDocument();
  });

  it("pauses auto-rotation on mouse hover and resumes on mouse leave", () => {
    render(
      <FeaturedArticles
        articles={mockArticles}
        autoRotate={true}
        autoRotateInterval={1000}
      />,
    );

    const carousel = screen.getByRole("region", {
      name: "Uitgelichte artikelen",
    });

    // Hover pauses rotation
    act(() => {
      fireEvent.mouseEnter(carousel);
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(
      screen.getByText("This is the first featured article description"),
    ).toBeInTheDocument();

    // Mouse leave resumes rotation
    act(() => {
      fireEvent.mouseLeave(carousel);
    });
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(
      screen.getByText("This is the second featured article description"),
    ).toBeInTheDocument();
  });

  it("resumes auto-rotation when focus moves outside the carousel", () => {
    render(
      <FeaturedArticles
        articles={mockArticles}
        autoRotate={true}
        autoRotateInterval={1000}
      />,
    );

    const carousel = screen.getByRole("region", {
      name: "Uitgelichte artikelen",
    });

    // Focus from outside pauses rotation
    act(() => {
      fireEvent.focus(carousel, { relatedTarget: null });
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(
      screen.getByText("This is the first featured article description"),
    ).toBeInTheDocument();

    // Blur to outside resumes rotation
    act(() => {
      fireEvent.blur(carousel, { relatedTarget: document.body });
    });
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(
      screen.getByText("This is the second featured article description"),
    ).toBeInTheDocument();
  });
});
