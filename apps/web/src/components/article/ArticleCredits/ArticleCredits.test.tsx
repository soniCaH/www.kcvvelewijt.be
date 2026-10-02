import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { IndexedSubject } from "@/components/article/SubjectAttribution";
import { ArticleCredits } from "./ArticleCredits";

const SUBJECTS: IndexedSubject[] = [
  {
    _key: "s-1",
    kind: "player",
    playerRef: {
      firstName: "Lars",
      lastName: "Janssens",
      jerseyNumber: 9,
    },
  },
  {
    _key: "s-2",
    kind: "staff",
    staffRef: {
      firstName: "Wim",
      lastName: "Govaerts",
      functionTitle: "TRAINER",
    },
  },
];

describe("<ArticleCredits>", () => {
  it("returns null when no row would render", () => {
    const { container } = render(<ArticleCredits />);
    expect(container.firstChild).toBeNull();
  });

  it("renders all three rows when every field is populated", () => {
    const { container } = render(
      <ArticleCredits
        author="Tom De Smet"
        photographer="An Verheyden"
        subjects={SUBJECTS}
      />,
    );
    const rows = container.querySelectorAll("[data-article-credits-row]");
    expect(rows).toHaveLength(3);
    expect(rows[0]?.getAttribute("data-article-credits-row")).toBe("door");
    expect(rows[1]?.getAttribute("data-article-credits-row")).toBe("met");
    expect(rows[2]?.getAttribute("data-article-credits-row")).toBe("beeld");
  });

  it("never renders a Gepubliceerd row — the publish date lives in <ArticleMetadata> only (#2531)", () => {
    const { container } = render(
      <ArticleCredits
        author="Tom De Smet"
        photographer="An Verheyden"
        subjects={SUBJECTS}
      />,
    );
    expect(
      container.querySelector('[data-article-credits-row="gepubliceerd"]'),
    ).toBeNull();
    expect(container.textContent).not.toContain("Gepubliceerd");
  });

  it("renders Door + author name when author is set", () => {
    const { container } = render(<ArticleCredits author="Tom De Smet" />);
    const row = container.querySelector('[data-article-credits-row="door"]');
    expect(row?.textContent).toContain("Door");
    expect(row?.textContent).toContain("Tom De Smet");
  });

  it("joins subject names with a comma + space", () => {
    const { container } = render(<ArticleCredits subjects={SUBJECTS} />);
    const row = container.querySelector('[data-article-credits-row="met"]');
    expect(row?.textContent).toContain("Lars Janssens, Wim Govaerts");
  });

  it("drops rows whose source field is blank or whitespace-only", () => {
    const { container } = render(
      <ArticleCredits author="   " photographer="" subjects={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("drops the Met row when no subject resolves", () => {
    // playerRef with no firstName/lastName won't resolve via
    // resolveSubject — the entire entry is silently filtered out.
    const unresolvableSubjects: IndexedSubject[] = [
      { _key: "bad", kind: "player", playerRef: {} },
    ];
    const { container } = render(
      <ArticleCredits subjects={unresolvableSubjects} author="Tom De Smet" />,
    );
    expect(
      container.querySelector('[data-article-credits-row="met"]'),
    ).toBeNull();
  });

  it("pins the block at --container-prose width with top + bottom rules", () => {
    const { container } = render(<ArticleCredits author="X" />);
    const aside = container.querySelector(
      '[data-article-credits="true"]',
    ) as HTMLElement;
    expect(aside.style.maxWidth).toBe("var(--container-prose)");
    expect(aside.className).toContain("border-t");
    expect(aside.className).toContain("border-b");
  });

  it("adds no top margin — the gap above it is one element's (#2531: <EndMark>'s mb-8); its bottom margin stays", () => {
    const { container } = render(<ArticleCredits author="X" />);
    const aside = container.querySelector(
      '[data-article-credits="true"]',
    ) as HTMLElement;
    expect(aside).toHaveClass("mb-6");
    expect(aside.className).not.toMatch(/(^|\s)(my|mt)-/);
  });

  it("uses Door / Met / Beeld in that fixed render order", () => {
    // Edge case: `Met` + `Beeld` only (no author).
    const { container } = render(
      <ArticleCredits subjects={SUBJECTS} photographer="An Verheyden" />,
    );
    const rows = container.querySelectorAll("[data-article-credits-row]");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.getAttribute("data-article-credits-row")).toBe("met");
    expect(rows[1]?.getAttribute("data-article-credits-row")).toBe("beeld");
  });
});
