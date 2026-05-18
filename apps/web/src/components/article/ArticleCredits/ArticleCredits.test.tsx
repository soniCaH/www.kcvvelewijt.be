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

const ISO_DATE = "2026-05-17T12:00:00Z";

describe("<ArticleCredits>", () => {
  it("returns null when no row would render", () => {
    const { container } = render(<ArticleCredits />);
    expect(container.firstChild).toBeNull();
  });

  it("renders all four rows when every field is populated", () => {
    const { container } = render(
      <ArticleCredits
        author="Tom De Smet"
        photographer="An Verheyden"
        subjects={SUBJECTS}
        publishedAt={ISO_DATE}
      />,
    );
    const rows = container.querySelectorAll("[data-article-credits-row]");
    expect(rows).toHaveLength(4);
    expect(rows[0]?.getAttribute("data-article-credits-row")).toBe("door");
    expect(rows[1]?.getAttribute("data-article-credits-row")).toBe("met");
    expect(rows[2]?.getAttribute("data-article-credits-row")).toBe("beeld");
    expect(rows[3]?.getAttribute("data-article-credits-row")).toBe(
      "gepubliceerd",
    );
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
      <ArticleCredits
        author="   "
        photographer=""
        subjects={[]}
        publishedAt={ISO_DATE}
      />,
    );
    const rows = container.querySelectorAll("[data-article-credits-row]");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.getAttribute("data-article-credits-row")).toBe(
      "gepubliceerd",
    );
  });

  it("drops the Met row when no subject resolves", () => {
    // playerRef with no firstName/lastName won't resolve via
    // resolveSubject — the entire entry is silently filtered out.
    const unresolvableSubjects: IndexedSubject[] = [
      { _key: "bad", kind: "player", playerRef: {} },
    ];
    const { container } = render(
      <ArticleCredits subjects={unresolvableSubjects} publishedAt={ISO_DATE} />,
    );
    expect(
      container.querySelector('[data-article-credits-row="met"]'),
    ).toBeNull();
  });

  it("formats the publishedAt date via formatArticleDate", () => {
    const { container } = render(<ArticleCredits publishedAt={ISO_DATE} />);
    const row = container.querySelector(
      '[data-article-credits-row="gepubliceerd"]',
    );
    // formatArticleDate emits `d MMMM yyyy` in Dutch for the
    // configured locale (e.g. "17 mei 2026"). Don't hard-pin the exact
    // string — just confirm the value isn't the raw ISO and contains
    // the year.
    expect(row?.textContent).toContain("2026");
    expect(row?.textContent).not.toContain("T");
  });

  it("pins the block at --container-prose width with top + bottom rules", () => {
    const { container } = render(
      <ArticleCredits author="X" publishedAt={ISO_DATE} />,
    );
    const aside = container.querySelector(
      '[data-article-credits="true"]',
    ) as HTMLElement;
    expect(aside.style.maxWidth).toBe("var(--container-prose)");
    expect(aside.className).toContain("border-t");
    expect(aside.className).toContain("border-b");
  });

  it("uses Door / Met / Beeld / Gepubliceerd in that fixed render order", () => {
    // Edge case: only `Met` + `Gepubliceerd` (interview minimum).
    const { container } = render(
      <ArticleCredits subjects={SUBJECTS} publishedAt={ISO_DATE} />,
    );
    const rows = container.querySelectorAll("[data-article-credits-row]");
    expect(rows).toHaveLength(2);
    expect(rows[0]?.getAttribute("data-article-credits-row")).toBe("met");
    expect(rows[1]?.getAttribute("data-article-credits-row")).toBe(
      "gepubliceerd",
    );
  });
});
