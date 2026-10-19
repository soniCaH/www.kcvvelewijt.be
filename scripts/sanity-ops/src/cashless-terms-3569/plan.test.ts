import { describe, expect, it } from "vitest";
import {
  CASHLESS_ID,
  TERMS_HREF,
  buildCashlessPatch,
  buildTermsPage,
  htmlToBlocks,
  preflight,
  type CashlessDoc,
  type Snapshot,
} from "./plan";

const text = (b: { children: { text: string }[] }) =>
  b.children.map((c) => c.text).join("");

describe("htmlToBlocks", () => {
  it("maps h2 and p, decodes entities, keeps links as marks", () => {
    const blocks = htmlToBlocks(
      '<h2>Doel</h2>\n\n<p>A &amp; B <a href="https://x.be/?a=1&amp;b=2">link</a> end.</p>',
    );
    expect(blocks.map((b) => b.style)).toEqual(["h2", "normal"]);
    expect(text(blocks[1]!)).toBe("A & B link end.");
    expect(blocks[1]!.markDefs).toEqual([
      { _key: "t2l1", _type: "link", href: "https://x.be/?a=1&b=2" },
    ]);
    expect(blocks[1]!.children[1]).toMatchObject({
      text: "link",
      marks: ["t2l1"],
    });
  });

  it("drops a paragraph holding only &nbsp;", () => {
    expect(htmlToBlocks("<p>Tekst</p>\n<p>&nbsp;</p>")).toHaveLength(1);
  });

  it("refuses markup it cannot carry over verbatim", () => {
    expect(() => htmlToBlocks("<p>a <strong>b</strong></p>")).toThrow(/tag/);
    expect(() => htmlToBlocks("<ul><li>a</li></ul>")).toThrow(/Unparsed/);
    expect(() => htmlToBlocks("<p>a&euro;</p>")).toThrow(/entity/);
  });
});

describe("buildTermsPage", () => {
  const page = buildTermsPage();

  it("holds the 11 sections of the Drupal terms, in order", () => {
    expect(
      page.body.filter((b) => b.style === "h2").map((b) => text(b)),
    ).toEqual([
      "Doel",
      "Toepasselijkheid",
      "Aanvraag en uitgifte",
      "Saldo en verificatie",
      "Gebruik",
      "Verlies, diefstal en beschadiging",
      "Beëindiging",
      "Aansprakelijkheid",
      "Geschillen",
      "Overige bepalingen",
      "Wijzigingen",
    ]);
  });

  it("keeps both KNIP app store links and the last paragraph", () => {
    const links = page.body.flatMap((b) => b.markDefs.map((d) => d.href));
    expect(links).toEqual([
      "https://itunes.apple.com/nl/app/knip/id1034721738?mt=8",
      "https://play.google.com/store/apps/details?id=nl.lecreditsportif.knip&hl=nl",
    ]);
    expect(text(page.body.at(-1)!)).toContain("12 februari 2023");
  });

  it("is a page at the two-segment slug, with unique block keys", () => {
    expect(page).toMatchObject({
      _type: "page",
      slug: { current: "cashless/voorwaarden" },
    });
    const keys = page.body.flatMap((b) => [
      b._key,
      ...b.children.map((c) => c._key),
    ]);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

const OLD =
  "De volledige algemene voorwaarden van de cashless clubkaart zijn beschikbaar aan de toog of op aanvraag via ";

const cashless = (): CashlessDoc => ({
  _id: CASHLESS_ID,
  _rev: "rev-1",
  body: [
    {
      _key: "k1",
      _type: "block",
      style: "h2",
      markDefs: [],
      children: [{ _key: "k2", _type: "span", marks: [], text: "Wat" }],
    },
    {
      _key: "k56",
      _type: "block",
      style: "normal",
      markDefs: [
        { _key: "k53", _type: "link", href: "mailto:info@kcvvelewijt.be" },
      ],
      children: [
        { _key: "k52", _type: "span", marks: [], text: OLD },
        {
          _key: "k54",
          _type: "span",
          marks: ["k53"],
          text: "info@kcvvelewijt.be",
        },
        { _key: "k55", _type: "span", marks: [], text: "." },
      ],
    },
  ],
});

describe("buildCashlessPatch", () => {
  it("links 'algemene voorwaarden' and keeps the mail link and the full stop", () => {
    const patch = buildCashlessPatch(cashless())!;
    expect(patch).toMatchObject({
      id: CASHLESS_ID,
      rev: "rev-1",
      blockKey: "k56",
    });
    expect(patch.after).toBe(
      "De volledige algemene voorwaarden van de cashless clubkaart lees je online. Een papieren exemplaar is beschikbaar aan de toog of op aanvraag via info@kcvvelewijt.be.",
    );
    const link = patch.block.children[1]!;
    expect(link.text).toBe("algemene voorwaarden");
    expect(
      patch.block.markDefs.find((d) => d._key === link.marks[0]),
    ).toMatchObject({ href: TERMS_HREF });
    expect(patch.block.markDefs).toContainEqual({
      _key: "k53",
      _type: "link",
      href: "mailto:info@kcvvelewijt.be",
    });
    const keys = patch.block.children.map((c) => c._key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("returns null on a re-run over the already patched paragraph", () => {
    const patched = buildCashlessPatch(cashless())!;
    const doc = cashless();
    doc.body![1] = patched.block;
    expect(buildCashlessPatch(doc)).toBeNull();
  });

  it("still patches when an unrelated block already links to the terms", () => {
    const doc = cashless();
    doc.body!.unshift({
      _key: "other",
      _type: "block",
      style: "normal",
      markDefs: [{ _key: "m", _type: "link", href: TERMS_HREF }],
      children: [{ _key: "s", _type: "span", marks: ["m"], text: "Elders" }],
    });
    expect(buildCashlessPatch(doc)).toMatchObject({ blockKey: "k56" });
  });

  it("refuses a paragraph that was edited since", () => {
    const doc = cashless();
    (doc.body![1] as { children: { text: string }[] }).children[0]!.text =
      "Iets anders.";
    expect(() => buildCashlessPatch(doc)).toThrow(/edited/);
  });
});

describe("preflight", () => {
  const ok: Snapshot = { cashless: cashless(), existingTerms: [], drafts: [] };

  it("passes on a clean snapshot", () => {
    expect(preflight(ok)).toEqual([]);
  });

  it("refuses a missing cashless page, an existing terms page and drafts", () => {
    expect(preflight({ ...ok, cashless: null })).toHaveLength(1);
    expect(
      preflight({ ...ok, existingTerms: ["page-cashless-voorwaarden"] }),
    ).toHaveLength(1);
    expect(preflight({ ...ok, drafts: ["drafts.page-cashless"] })).toHaveLength(
      1,
    );
  });
});
