import { describe, it, expect } from "vitest";
import type { ArticleVM } from "@/lib/repositories/article.repository";
import { toEditorialHeroProps } from "./to-editorial-hero-props";

/** Only the fields the mapper reads; the rest of the VM is structural. */
const article = (p: Partial<ArticleVM> = {}): ArticleVM => {
  return {
    id: "article-1",
    title: "Kampioen! 58 punten en titel in eerste provinciale.",
    lead: "Met een laatste-speeldagzege wordt de A-ploeg kampioen van de reeks.",
    slug: "kampioen-58-punten",
    publishedAt: "2026-05-03T10:00:00Z",
    featured: true,
    tags: ["Clubnieuws"],
    coverImageUrl: "https://cdn.example/cover.jpg",
    articleType: "announcement",
    subjects: [],
    firstTransferFact: null,
    firstEventFact: null,
    ...p,
  } as unknown as ArticleVM;
};

describe("toEditorialHeroProps", () => {
  // #2393: the lead reached the VM but never the hero, so the largest element
  // on the homepage rendered as a headline plus a photograph and no dek.
  it("forwards the article lead as the hero dek", () => {
    expect(toEditorialHeroProps(article()).lead).toBe(
      "Met een laatste-speeldagzege wordt de A-ploeg kampioen van de reeks.",
    );
  });

  // ARTICLES_QUERY coalesces a missing lead to "" — that sentinel must not
  // reach the hero, or it renders an empty dek slot instead of omitting one.
  it.each([
    ["the GROQ empty-string sentinel", ""],
    ["a whitespace-only lead", "   "],
    ["an absent lead", undefined],
  ])("drops %s", (_label, lead) => {
    expect(toEditorialHeroProps(article({ lead })).lead).toBeUndefined();
  });

  it("keeps the hero pinned to the homepage placement and eager-loads the LCP cover", () => {
    const props = toEditorialHeroProps(article());
    expect(props.placement).toBe("homepage");
    expect(props.priority).toBe(true);
    // #2559: the cover carries a URL and nothing else. It used to carry the
    // article title as an alt, repeating the <h1> it renders under.
    expect(props.coverImage).toEqual({
      url: "https://cdn.example/cover.jpg",
    });
  });

  it("omits the cover when the article has no image", () => {
    expect(
      toEditorialHeroProps(article({ coverImageUrl: null })).coverImage,
    ).toBeUndefined();
  });

  it("defaults an untyped legacy article to the announcement variant", () => {
    const props = toEditorialHeroProps(article({ articleType: null }));
    expect(props.variant).toBe("announcement");
  });

  it("carries the first tag through as the announcement category", () => {
    const props = toEditorialHeroProps(article({ tags: ["Jeugd", "A-ploeg"] }));
    expect(props).toMatchObject({ variant: "announcement", category: "Jeugd" });
  });

  it("passes interview subjects through untouched", () => {
    const subjects = [{ _key: "s1", kind: "player" }] as ArticleVM["subjects"];
    const props = toEditorialHeroProps(
      article({ articleType: "interview", subjects }),
    );
    expect(props).toMatchObject({ variant: "interview", subjects });
  });

  // The variant renderers take `field?: string`, so GROQ's explicit nulls have
  // to be stripped rather than forwarded.
  it("strips GROQ nulls out of the event fact", () => {
    const props = toEditorialHeroProps(
      article({
        articleType: "event",
        firstEventFact: {
          title: "Mosselfestijn",
          location: null,
        } as ArticleVM["firstEventFact"],
      }),
    );
    expect(props).toMatchObject({ variant: "event" });
    expect(props).toHaveProperty("feature", { title: "Mosselfestijn" });
  });

  it("strips GROQ nulls out of the transfer fact", () => {
    const props = toEditorialHeroProps(
      article({
        articleType: "transfer",
        firstTransferFact: {
          playerName: "Jens Peeters",
          note: null,
        } as ArticleVM["firstTransferFact"],
      }),
    );
    expect(props).toHaveProperty("feature", { playerName: "Jens Peeters" });
  });

  // An article typed `event`/`transfer` whose body carries no matching fact
  // block projects the whole fact as null, not as an object of nulls — the
  // variant renderers must get `undefined` so they skip the feature slot.
  it.each([
    ["event", { firstEventFact: null }],
    ["transfer", { firstTransferFact: null }],
  ] as const)("drops a missing %s fact entirely", (articleType, fact) => {
    const props = toEditorialHeroProps(article({ articleType, ...fact }));
    expect(props).toHaveProperty("feature", undefined);
  });

  // Match articles stay kicker-only on the homepage — no `match` payload, so
  // the score-forward bar is detail-page-only.
  it.each(["matchPreview", "matchRecap"] as const)(
    "renders %s as a kicker-only hero with no match data",
    (articleType) => {
      const props = toEditorialHeroProps(article({ articleType }));
      expect(props.variant).toBe(articleType);
      expect(props).not.toHaveProperty("match");
    },
  );

  it("throws when Sanity widens articleType without a matching branch", () => {
    expect(() =>
      toEditorialHeroProps(
        article({ articleType: "podcast" as ArticleVM["articleType"] }),
      ),
    ).toThrow(/Unhandled articleType/);
  });
});
