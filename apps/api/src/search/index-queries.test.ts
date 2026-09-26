import { describe, it, expect } from "vitest";
import {
  buildArticleExcerpt,
  buildArticleMetadata,
  buildArticleIndexText,
  buildPageIndexText,
  buildPageMetadata,
  buildResponsibilityIndexText,
  buildResponsibilityMetadata,
  stripTableHtml,
} from "./index-queries";

describe("buildResponsibilityIndexText", () => {
  it("combines title, question, keywords, and summary", () => {
    const result = buildResponsibilityIndexText({
      title: "Kantine & evenementen",
      question: "wie regelt de kantine",
      keywords: ["kantine", "bar", "evenementen"],
      summary: "De kantine wordt beheerd door de evenementencommissie.",
    });

    expect(result).toContain("Kantine & evenementen");
    expect(result).toContain("wie regelt de kantine");
    expect(result).toContain("kantine bar evenementen");
    expect(result).toContain("De kantine wordt beheerd");
  });
});

describe("stripTableHtml", () => {
  it("keeps the cell text and drops every tag", () => {
    const result = stripTableHtml(
      "<table><thead><tr><th>Club</th></tr></thead>" +
        "<tbody><tr><td>KCVV Elewijt</td><td>Zondag 15:00</td></tr></tbody></table>",
    );

    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
    expect(result).toContain("Club");
    expect(result).toContain("KCVV Elewijt");
    expect(result).toContain("Zondag 15:00");
  });

  it("turns entities into spaces rather than index tokens", () => {
    expect(stripTableHtml("<td>KFC&nbsp;Herent</td>")).toBe("KFC Herent");
    expect(stripTableHtml("<td>Jan&amp;Piet</td>")).toBe("Jan Piet");
    expect(stripTableHtml("<td>A&#39;B</td>")).toBe("A B");
    expect(stripTableHtml("<td>&nbsp;</td>")).toBe("");
  });

  it("turns hex references into spaces too, not just named and decimal ones", () => {
    expect(stripTableHtml("<td>Jan&#x26;Piet</td>")).toBe("Jan Piet");
    expect(stripTableHtml("<td>A&#X27;B</td>")).toBe("A B");
  });

  it("collapses the whitespace the tags leave behind", () => {
    const result = stripTableHtml("<tr>\n  <td>A</td>\n  <td>B</td>\n</tr>");

    expect(result).toBe("A B");
  });

  it("returns an empty string for an article with no table", () => {
    expect(stripTableHtml("")).toBe("");
  });
});

describe("buildArticleIndexText", () => {
  const base = {
    title: "Verslag: KCVV wint derby",
    tags: ["verslag", "derby"],
    lead: "Een late kopbal besliste de derby.",
    prose: "KCVV Elewijt won de derby met 3-1.",
    qaQuestions: ["Hoe ging het?"],
    qaAnswers: "Uitstekend, echt waar.",
    tableHtml: ["<table><tr><td>Jef Janssens</td></tr></table>"],
    pullQuoteText: "Een tribune die zingt is meer waard dan een aanwinst.",
  };

  it("combines title, tags, lead, prose, pullQuote text, Q&A, and table text", () => {
    const result = buildArticleIndexText(base);

    expect(result).toContain("Verslag: KCVV wint derby");
    expect(result).toContain("verslag derby");
    expect(result).toContain("Een late kopbal besliste de derby.");
    expect(result).toContain("KCVV Elewijt won de derby met 3-1.");
    expect(result).toContain(
      "Een tribune die zingt is meer waard dan een aanwinst.",
    );
    expect(result).toContain("Hoe ging het?");
    expect(result).toContain("Uitstekend, echt waar.");
    expect(result).toContain("Jef Janssens");
    expect(result).not.toContain("<td>");
  });

  it("keeps the whole interview when the body holds no prose at all", () => {
    // `pt::text(body)` returns null, not "", for a body with no top-level
    // block, so a Q&A-only article is exactly the case a GROQ-side join would
    // blank out — the article this fix exists for.
    const result = buildArticleIndexText({
      ...base,
      prose: "",
      tableHtml: [],
    });

    expect(result).toContain("Hoe ging het?");
    expect(result).toContain("Uitstekend, echt waar.");
  });

  it("indexes a squad name that lives only inside a table", () => {
    const result = buildArticleIndexText({
      title: "Transferoverzicht kern 2024-2025",
      tags: ["transfers"],
      lead: "",
      prose: "Een overzicht van de kern.",
      qaQuestions: [],
      qaAnswers: "",
      tableHtml: [
        "<table><tr><td>Bocar Sarr</td><td>FC Mariekerke</td></tr></table>",
      ],
      pullQuoteText: "",
    });

    expect(result).toContain("Bocar Sarr");
    expect(result).toContain("FC Mariekerke");
  });

  it("indexes a quote that lives only inside a pullQuote block", () => {
    // Mirrors qaAnswers: `pt::text(body)` never sees a pullQuote's own
    // `body` field, so an article whose only real content is a quote would
    // otherwise be unfindable by anything said in it.
    const result = buildArticleIndexText({
      title: "Reactie na de match",
      tags: [],
      lead: "",
      prose: "",
      qaQuestions: [],
      qaAnswers: "",
      tableHtml: [],
      pullQuoteText: "We hebben de kleedkamer wakker gekregen.",
    });

    expect(result).toContain("We hebben de kleedkamer wakker gekregen.");
  });

  it("emits no bare separators for an article that is prose and nothing else", () => {
    const result = buildArticleIndexText({
      title: "Kort bericht",
      tags: [],
      lead: "",
      prose: "Enkel proza.",
      qaQuestions: [],
      qaAnswers: "",
      tableHtml: [],
      pullQuoteText: "",
    });

    expect(result).toBe("Kort bericht. Enkel proza.");
    expect(result).not.toContain("undefined");
    expect(result).not.toContain("null");
  });

  it("yields an empty string for an article with nothing indexable", () => {
    expect(
      buildArticleIndexText({
        title: "",
        tags: [],
        lead: "",
        prose: "",
        qaQuestions: [],
        qaAnswers: "",
        tableHtml: [],
        pullQuoteText: "",
      }),
    ).toBe("");
  });
});

describe("buildArticleExcerpt", () => {
  it("prefers the editor's lead", () => {
    expect(
      buildArticleExcerpt({
        lead: "Een late kopbal besliste de derby.",
        prose: "KCVV Elewijt won de derby met 3-1.",
      }),
    ).toBe("Een late kopbal besliste de derby.");
  });

  it("falls back to the prose, never to the Q&A or the table text", () => {
    // The fallback is the article's own opening paragraph. An interview with
    // an empty lead must not show "Hoe ging het? Uitstekend" as its summary.
    expect(buildArticleExcerpt({ lead: "", prose: "Inleidend proza." })).toBe(
      "Inleidend proza.",
    );
  });

  it("caps at 200 characters and never yields null", () => {
    expect(
      buildArticleExcerpt({ lead: "x".repeat(300), prose: "" }),
    ).toHaveLength(200);
    expect(buildArticleExcerpt({ lead: "", prose: "" })).toBe("");
  });
});

describe("buildArticleMetadata", () => {
  const doc = {
    slug: "kcvv-wint-derby",
    title: "KCVV wint derby",
    lead: "Een late kopbal besliste de derby.",
    prose: "KCVV Elewijt won de derby met 3-1.",
    tags: ["verslag", "derby"],
  };

  it("writes the same record whichever path indexed the article", () => {
    // The two paths hand-assembled this and had already drifted: the nightly
    // sweep wrote `tags` and the webhook did not.
    expect(buildArticleMetadata(doc)).toEqual({
      slug: "kcvv-wint-derby",
      type: "article",
      title: "KCVV wint derby",
      excerpt: "Een late kopbal besliste de derby.",
      tags: "verslag,derby",
    });
  });

  it("carries an imageUrl only when the article has a cover", () => {
    expect(
      buildArticleMetadata({ ...doc, imageUrl: "https://x/y.webp" }),
    ).toHaveProperty("imageUrl", "https://x/y.webp");
    expect(buildArticleMetadata({ ...doc, imageUrl: null })).not.toHaveProperty(
      "imageUrl",
    );
  });
});

describe("buildPageIndexText", () => {
  it("combines title and body text", () => {
    const result = buildPageIndexText({
      title: "Over KCVV Elewijt",
      bodyText: "KCVV Elewijt is een voetbalclub uit Elewijt.",
      fileAttachmentLabels: [],
    });

    expect(result).toContain("Over KCVV Elewijt");
    expect(result).toContain("KCVV Elewijt is een voetbalclub uit Elewijt.");
  });

  it("handles null body text gracefully", () => {
    const result = buildPageIndexText({
      title: "Lege pagina",
      bodyText: null,
      fileAttachmentLabels: [],
    });

    expect(result).toBe("Lege pagina");
  });

  it("indexes fileAttachment labels alongside the body text", () => {
    // The `downloads` page: two section-heading blocks over three
    // fileAttachments. Without this branch the document names themselves
    // ("Ongevalsaangifte") never reach the index (#2832).
    const result = buildPageIndexText({
      title: "Downloads",
      bodyText: "Aangiftes. Reglementen",
      fileAttachmentLabels: [
        "Ongevalsaangifte",
        "Reglement van Inwendige Orde",
      ],
    });

    expect(result).toContain("Ongevalsaangifte");
    expect(result).toContain("Reglement van Inwendige Orde");
  });

  it("keeps the fileAttachment labels when the body has no top-level block", () => {
    // pt::text(body) is null here, not "" — a body built only from
    // fileAttachment items has no top-level `block` at all.
    const result = buildPageIndexText({
      title: "Downloads",
      bodyText: null,
      fileAttachmentLabels: ["Ongevalsaangifte"],
    });

    expect(result).not.toBe("");
    expect(result).toContain("Downloads");
    expect(result).toContain("Ongevalsaangifte");
  });
});

describe("buildPageMetadata", () => {
  it("writes the same record whichever path indexed the page", () => {
    expect(
      buildPageMetadata({
        slug: "over-kcvv",
        title: "Over KCVV Elewijt",
        bodyText: "KCVV Elewijt is een voetbalclub uit Elewijt.",
        fileAttachmentLabels: [],
      }),
    ).toEqual({
      slug: "over-kcvv",
      type: "page",
      title: "Over KCVV Elewijt",
      excerpt: "KCVV Elewijt is een voetbalclub uit Elewijt.",
    });
  });

  it("falls back to an empty excerpt for a null body and no attachments", () => {
    expect(
      buildPageMetadata({
        slug: "leeg",
        title: "Lege pagina",
        bodyText: null,
        fileAttachmentLabels: [],
      }),
    ).toHaveProperty("excerpt", "");
  });

  it("caps the excerpt at 200 characters", () => {
    expect(
      buildPageMetadata({
        slug: "lang",
        title: "Lange pagina",
        bodyText: "x".repeat(300),
        fileAttachmentLabels: [],
      }),
    ).toHaveProperty("excerpt", "x".repeat(200));
  });

  it("falls back to the joined fileAttachment labels when there is no prose", () => {
    // The exact `downloads` case: pt::text(body) is null for a body built
    // only from fileAttachment items. Without this fallback the search
    // result card renders a title over a blank line, and the AI-answer
    // context gets nothing but "Downloads: ".
    expect(
      buildPageMetadata({
        slug: "downloads",
        title: "Downloads",
        bodyText: null,
        fileAttachmentLabels: [
          "Ongevalsaangifte",
          "Reglement van Inwendige Orde",
        ],
      }),
    ).toHaveProperty(
      "excerpt",
      "Ongevalsaangifte, Reglement van Inwendige Orde",
    );
  });

  it("prefers the body prose over the attachment labels when both exist", () => {
    expect(
      buildPageMetadata({
        slug: "downloads",
        title: "Downloads",
        bodyText: "Aangiftes. Reglementen",
        fileAttachmentLabels: ["Ongevalsaangifte"],
      }),
    ).toHaveProperty("excerpt", "Aangiftes. Reglementen");
  });
});

describe("buildResponsibilityMetadata", () => {
  it("writes the same record whichever path indexed the responsibility", () => {
    expect(
      buildResponsibilityMetadata({
        slug: "kantine-evenementen",
        title: "Kantine & evenementen",
        summary: "De kantine wordt beheerd door de evenementencommissie.",
      }),
    ).toEqual({
      slug: "kantine-evenementen",
      type: "responsibility",
      title: "Kantine & evenementen",
      excerpt: "De kantine wordt beheerd door de evenementencommissie.",
    });
  });

  it("caps the excerpt at 200 characters", () => {
    expect(
      buildResponsibilityMetadata({
        slug: "lang",
        title: "Lang",
        summary: "x".repeat(300),
      }),
    ).toHaveProperty("excerpt", "x".repeat(200));
  });
});
