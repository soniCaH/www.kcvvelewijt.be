import { describe, it, expect } from "vitest";
import { evaluate, parse } from "groq-js";
import {
  ARTICLE_INDEX_PROJECTION,
  ARTICLE_PUBLISHED_FILTER,
  PAGE_INDEX_PROJECTION,
  RESPONSIBILITY_INDEX_PROJECTION,
  buildArticleExcerpt,
  buildArticleIndexText,
  buildPageIndexText,
  buildResponsibilityIndexText,
} from "./index-queries";
import { ARTICLE_QUERY } from "./sanity-index-sync";

/**
 * The projection's own tests assert on the query text. That is what let two
 * null-propagation defects through review in #2806: GROQ answers a misspelled
 * field with an empty result and a null operand with a null value, and no
 * string assertion can see either. These cases run the real query through
 * groq-js against fixture documents shaped like `packages/sanity-schemas`,
 * then compose the result exactly as the indexers do.
 */

const block = (text: string) => ({
  _type: "block",
  children: [{ _type: "span", text }],
});

const qaBlock = (question: string, answer: string) => ({
  _type: "qaBlock",
  pairs: [{ question, respondents: [{ answer: [block(answer)] }] }],
});

const pullQuoteBlock = (text: string) => ({
  _type: "pullQuote",
  body: [block(text)],
});

const PAST = "2020-01-01T00:00:00Z";
const FUTURE = "2999-01-01T00:00:00Z";

interface Article {
  readonly _id: string;
  readonly _type: string;
  readonly publishedAt?: string;
  readonly unpublishAt?: string;
  readonly slug?: { current: string };
  readonly title?: unknown;
  readonly lead?: string;
  readonly tags?: string[];
  readonly body?: unknown[];
}

const article = (over: Partial<Article> & { _id: string }): Article => ({
  _type: "article",
  publishedAt: PAST,
  slug: { current: over._id },
  title: [block("Een titel")],
  body: [block("Inleidend proza.")],
  ...over,
});

async function runQuery(query: string, dataset: readonly unknown[]) {
  const result = await evaluate(parse(query), { dataset });
  return (await result.get()) as Record<string, unknown>[];
}

const projectOne = async (doc: Article) => {
  const [row] = await runQuery(
    `*[_type == "article"]{ ${ARTICLE_INDEX_PROJECTION} }`,
    [doc],
  );
  return row!;
};

const fileAttachment = (label: string) => ({ _type: "fileAttachment", label });

interface Page {
  readonly _id: string;
  readonly _type: string;
  readonly slug?: { current: string };
  readonly title?: string;
  readonly body?: unknown[];
}

const page = (over: Partial<Page> & { _id: string }): Page => ({
  _type: "page",
  slug: { current: over._id },
  title: "Een pagina",
  body: [block("Wat proza.")],
  ...over,
});

const projectPage = async (doc: Page) => {
  const [row] = await runQuery(
    `*[_type == "page"]{ ${PAGE_INDEX_PROJECTION} }`,
    [doc],
  );
  return row!;
};

// Mirrors what both indexers do with a projected row.
const indexTextFor = (row: Record<string, unknown>) =>
  buildArticleIndexText(
    row as unknown as Parameters<typeof buildArticleIndexText>[0],
  );

describe("ARTICLE_INDEX_PROJECTION evaluated against fixture documents", () => {
  it("never returns null for any composed field", async () => {
    const bodies: [string, unknown[] | undefined][] = [
      ["prose and Q&A", [block("Inleidend proza."), qaBlock("Hoe?", "Goed.")]],
      ["Q&A only", [qaBlock("Hoe ging het?", "Uitstekend, echt waar.")]],
      ["table only", [{ _type: "htmlTable", html: "<td>Sarr</td>" }]],
      ["image only", [{ _type: "articleImage", alt: "een foto" }]],
      ["table without html", [block("Proza."), { _type: "htmlTable" }]],
      ["pair without a question", [{ _type: "qaBlock", pairs: [{}] }]],
      ["qaBlock without pairs", [{ _type: "qaBlock" }]],
      ["pullQuote only", [pullQuoteBlock("Een citaat.")]],
      ["pullQuote without a body", [{ _type: "pullQuote" }]],
      ["empty body", []],
      ["no body at all", undefined],
    ];

    for (const [name, body] of bodies) {
      const row = await projectOne(article({ _id: "a", body }));

      for (const field of [
        "title",
        "lead",
        "prose",
        "qaAnswers",
        "pullQuoteText",
      ]) {
        expect(row[field], `${name} → ${field}`).toBeTypeOf("string");
      }
      for (const field of ["tags", "qaQuestions", "tableHtml"]) {
        expect(row[field], `${name} → ${field}`).toBeInstanceOf(Array);
      }
      expect(() => indexTextFor(row), `${name} → compose`).not.toThrow();
    }
  });

  it("keeps the whole interview for an article whose body is only Q&A", async () => {
    // pt::text(body) is null here, not "". A GROQ-side join would blank the
    // entire document — the exact articles this projection exists to rescue.
    const row = await projectOne(
      article({
        _id: "interview",
        body: [qaBlock("Hoe ging het?", "Uitstekend, echt waar.")],
      }),
    );

    expect(row["prose"]).toBe("");
    expect(indexTextFor(row)).toContain("Hoe ging het?");
    expect(indexTextFor(row)).toContain("Uitstekend, echt waar.");
  });

  it("keeps a quote that lives only inside a pullQuote block", async () => {
    // Same defect class as the Q&A case above: `pt::text(body)` never
    // descends into a pullQuote's own `body` field, so an announcement built
    // entirely from a quote would otherwise index as an empty document.
    const row = await projectOne(
      article({
        _id: "reactie",
        body: [pullQuoteBlock("We hebben de kleedkamer wakker gekregen.")],
      }),
    );

    expect(row["prose"]).toBe("");
    expect(row["pullQuoteText"]).toBe(
      "We hebben de kleedkamer wakker gekregen.",
    );
    expect(indexTextFor(row)).toContain(
      "We hebben de kleedkamer wakker gekregen.",
    );
  });

  it("keeps the good table when a sibling htmlTable has no html", async () => {
    const row = await projectOne(
      article({
        _id: "overzicht",
        body: [
          { _type: "htmlTable" },
          { _type: "htmlTable", html: "<tr><td>Bocar&nbsp;Sarr</td></tr>" },
        ],
      }),
    );

    const text = indexTextFor(row);
    expect(text).toContain("Bocar Sarr");
    expect(text).not.toContain("<");
    expect(text).not.toContain("null");
  });

  it("flattens a Portable Text title and passes a legacy string one through", async () => {
    const rich = await projectOne(
      article({ _id: "rich", title: [block('Vincent: "Geen afscheid"')] }),
    );
    const legacy = await projectOne(
      article({ _id: "legacy", title: "Een oude titel" }),
    );

    expect(rich["title"]).toBe('Vincent: "Geen afscheid"');
    expect(legacy["title"]).toBe("Een oude titel");
  });

  it("draws the excerpt from the prose, never from the Q&A", async () => {
    const row = await projectOne(
      article({
        _id: "interview",
        lead: "",
        body: [block("Inleidend proza."), qaBlock("Hoe?", "Uitstekend.")],
      }),
    );

    expect(
      buildArticleExcerpt(
        row as unknown as Parameters<typeof buildArticleExcerpt>[0],
      ),
    ).toBe("Inleidend proza.");
  });
});

describe("PAGE_INDEX_PROJECTION evaluated against fixture documents", () => {
  const indexTextForPage = (row: Record<string, unknown>) =>
    buildPageIndexText(
      row as unknown as Parameters<typeof buildPageIndexText>[0],
    );

  it("never returns null for any composed field", async () => {
    const bodies: [string, unknown[] | undefined][] = [
      ["prose only", [block("Wat proza.")]],
      ["fileAttachment only", [fileAttachment("Reglement van Inwendige Orde")]],
      [
        "prose and fileAttachment",
        [block("Wat proza."), fileAttachment("Ongevalsaangifte")],
      ],
      ["fileAttachment without a label", [{ _type: "fileAttachment" }]],
      ["empty body", []],
      ["no body at all", undefined],
    ];

    for (const [name, body] of bodies) {
      const row = await projectPage(page({ _id: "p", body }));

      expect(row["title"], `${name} → title`).toBeTypeOf("string");
      expect(
        row["fileAttachmentLabels"],
        `${name} → fileAttachmentLabels`,
      ).toBeInstanceOf(Array);
      expect(() => indexTextForPage(row), `${name} → compose`).not.toThrow();
    }
  });

  it("keeps a page whose body has no top-level block", async () => {
    // pt::text(body) is null here, not "" — a body built only from
    // fileAttachment items carries no top-level `block`. This is the
    // `downloads` page's real shape: three fileAttachments, and — in this
    // fixture — no surrounding prose at all.
    const row = await projectPage(
      page({
        _id: "downloads",
        title: "Downloads",
        body: [fileAttachment("Ongevalsaangifte")],
      }),
    );

    expect(row["bodyText"]).toBeNull();
    const text = indexTextForPage(row);
    expect(text).not.toBe("");
    expect(text).toContain("Downloads");
    expect(text).toContain("Ongevalsaangifte");
  });

  it("indexes a fileAttachment label alongside its section prose", async () => {
    const row = await projectPage(
      page({
        _id: "downloads",
        title: "Downloads",
        body: [block("Aangiftes"), fileAttachment("Ongevalsaangifte")],
      }),
    );

    const text = indexTextForPage(row);
    expect(text).toContain("Aangiftes");
    expect(text).toContain("Ongevalsaangifte");
  });
});

describe("RESPONSIBILITY_INDEX_PROJECTION evaluated against fixture documents", () => {
  interface Responsibility {
    readonly _id: string;
    readonly _type: string;
    readonly slug?: { current: string };
    readonly title?: string;
    readonly question?: string;
    readonly keywords?: string[];
    readonly summary?: string;
  }

  const responsibility = (
    over: Partial<Responsibility> & { _id: string },
  ): Responsibility => ({
    _type: "responsibility",
    slug: { current: over._id },
    title: "Kantine",
    question: "Wie regelt de kantine?",
    keywords: ["kantine"],
    summary: "De kantine wordt beheerd door de evenementencommissie.",
    ...over,
  });

  const projectResponsibility = async (doc: Responsibility) => {
    const [row] = await runQuery(
      `*[_type == "responsibility"]{ ${RESPONSIBILITY_INDEX_PROJECTION} }`,
      [doc],
    );
    return row!;
  };

  it("coalesces title and question to a string when the source document omits them", async () => {
    // ResponsibilityDoc (webhooks/index-handler.ts) declares both required,
    // non-nullable S.String. A responsibility written without one — a
    // script `createOrReplace` bypasses Studio's own Rule.required() —
    // would otherwise project `title`/`question` as `undefined`, and
    // S.decodeUnknownSync would throw: invalid_document -> 500 -> Sanity
    // retries the webhook indefinitely.
    const row = await projectResponsibility(
      responsibility({
        _id: "incomplete",
        title: undefined,
        question: undefined,
      }),
    );

    expect(row["title"]).toBeTypeOf("string");
    expect(row["question"]).toBeTypeOf("string");
    expect(() =>
      buildResponsibilityIndexText(
        row as unknown as Parameters<typeof buildResponsibilityIndexText>[0],
      ),
    ).not.toThrow();
  });
});

describe("ARTICLE_QUERY evaluated against fixture documents", () => {
  const dataset = [
    article({ _id: "published" }),
    article({ _id: "scheduled", publishedAt: FUTURE }),
    article({ _id: "expired", unpublishAt: PAST }),
    article({ _id: "still-running", unpublishAt: FUTURE }),
    { _id: "not-an-article", _type: "page" } as unknown as Article,
  ];

  it("matches the published articles and only those", async () => {
    const rows = await runQuery(ARTICLE_QUERY, dataset);

    expect(rows.map((r) => r["slug"]).sort()).toEqual([
      "published",
      "still-running",
    ]);
  });

  it("matches nothing at all if the field name regresses", async () => {
    // The whole defect: `publishAt` is not a schema field, and GROQ reports
    // that as an empty result rather than an error, so the nightly sweep read
    // as a clean run while indexing zero of 125 articles.
    const misspelled = ARTICLE_QUERY.replace(
      ARTICLE_PUBLISHED_FILTER,
      ARTICLE_PUBLISHED_FILTER.replace("publishedAt", "publishAt"),
    );

    expect(await runQuery(misspelled, dataset)).toHaveLength(0);
  });
});
