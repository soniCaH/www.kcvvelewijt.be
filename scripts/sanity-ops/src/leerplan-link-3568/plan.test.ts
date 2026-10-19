import { describe, expect, it } from "vitest";
import {
  ARTICLE_ID,
  NEW_HREF,
  OLD_HREF,
  buildLinkPatch,
  preflight,
  type ArticleDoc,
} from "./plan";

// The real block shape, read from production on 2026-10-19.
const doc = (href: string): ArticleDoc => ({
  _id: ARTICLE_ID,
  _rev: "rev1",
  body: [
    { _key: "intro", _type: "block", markDefs: [] },
    {
      _key: "fdbd1f21a6bb",
      _type: "block",
      markDefs: [{ _key: "9faa76e83523", _type: "link", href }],
    },
    { _key: "img", _type: "image" },
  ],
});

describe("buildLinkPatch", () => {
  it("targets the dead link by key, pinned to the revision read", () => {
    expect(buildLinkPatch(doc(OLD_HREF))).toEqual({
      id: ARTICLE_ID,
      rev: "rev1",
      paths: ['body[_key=="fdbd1f21a6bb"].markDefs[_key=="9faa76e83523"].href'],
    });
  });

  it("is a no-op once the link is repointed", () => {
    expect(buildLinkPatch(doc(NEW_HREF))).toBeNull();
  });

  it("refuses an article that holds neither href", () => {
    expect(() => buildLinkPatch(doc("/elders.pdf"))).toThrow(/edited/);
  });

  it("copes with an empty body", () => {
    expect(() => buildLinkPatch({ _id: "x", _rev: "r", body: null })).toThrow(
      /edited/,
    );
  });
});

describe("preflight", () => {
  it("passes a clean snapshot", () => {
    expect(preflight({ article: doc(OLD_HREF), drafts: [] })).toEqual([]);
  });

  it("flags a missing article and any draft", () => {
    expect(
      preflight({ article: null, drafts: [`drafts.${ARTICLE_ID}`] }),
    ).toHaveLength(2);
  });
});
