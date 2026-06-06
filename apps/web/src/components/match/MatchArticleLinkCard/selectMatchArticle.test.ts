/**
 * `selectMatchArticle` — cross-state truth-table tests (6.B.d4 lock).
 *
 * Exhaustive coverage of every `match status × {recap?, preview?}` combination
 * from `docs/design/mockups/phase-6-match-detail/6b4-article-link-card/compare.md`.
 *
 * Rule summary: **recap wins on finished/edge states; preview wins on
 * scheduled.** When the dominant article is missing, fall back to the other
 * rather than hide. Both missing → `null`. Anomalous combinations (a recap
 * linked to an upcoming match) render per the fallback rule but emit a
 * `console.warn` so editors can spot the bad data in dev + Vercel logs.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { MatchStatus } from "@kcvv/api-contract";
import type { MatchArticleVM } from "@/lib/repositories/article.repository";
import {
  selectMatchArticle,
  RECAP_KICKER,
  PREVIEW_KICKER,
} from "./selectMatchArticle";

function makeArticle(
  articleType: "matchPreview" | "matchRecap",
  overrides?: Partial<MatchArticleVM>,
): MatchArticleVM {
  return {
    id: `article-${articleType}`,
    title:
      articleType === "matchRecap" ? "KCVV wint de derby" : "Op naar de derby",
    lead: "Een korte inleiding.",
    slug:
      articleType === "matchRecap" ? "kcvv-wint-de-derby" : "op-naar-de-derby",
    publishedAt: "2026-06-01T10:00:00Z",
    articleType,
    coverImageUrl: "https://cdn.sanity.io/images/x/y/cover.jpg",
    ...overrides,
  };
}

const RECAP = makeArticle("matchRecap");
const PREVIEW = makeArticle("matchPreview");

/** Edge states behave identically to `finished` per the truth table. */
const EDGE_STATES: MatchStatus[] = [
  "finished",
  "forfeited",
  "postponed",
  "cancelled",
  "stopped",
];

describe("selectMatchArticle", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  // Lock the exact kicker copy from the truth table.
  it("uses the locked kicker copy", () => {
    expect(RECAP_KICKER).toBe("LEES HET VERSLAG · MATCHVERSLAG");
    expect(PREVIEW_KICKER).toBe("LEES DE VOORBESCHOUWING · MATCHPREVIEW");
  });

  describe("scheduled (upcoming) — preview wins", () => {
    it("recap + preview → renders PREVIEW (recap is anomalous → warns), secondary = recap", () => {
      const result = selectMatchArticle([RECAP, PREVIEW], "scheduled");
      expect(result?.article.articleType).toBe("matchPreview");
      expect(result?.kicker).toBe(PREVIEW_KICKER);
      expect(result?.secondary?.article.articleType).toBe("matchRecap");
      expect(result?.secondary?.label).toBe("Lees ook het verslag");
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it("recap only → renders RECAP as a fallback (anomalous → warns), no secondary", () => {
      const result = selectMatchArticle([RECAP], "scheduled");
      expect(result?.article.articleType).toBe("matchRecap");
      expect(result?.kicker).toBe(RECAP_KICKER);
      expect(result?.secondary).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it("preview only → renders PREVIEW, no secondary, no warning", () => {
      const result = selectMatchArticle([PREVIEW], "scheduled");
      expect(result?.article.articleType).toBe("matchPreview");
      expect(result?.kicker).toBe(PREVIEW_KICKER);
      expect(result?.secondary).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("neither → null", () => {
      expect(selectMatchArticle([], "scheduled")).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe.each(EDGE_STATES)("%s (finished/edge) — recap wins", (status) => {
    it("recap + preview → renders RECAP, secondary = preview, no warning", () => {
      const result = selectMatchArticle([RECAP, PREVIEW], status);
      expect(result?.article.articleType).toBe("matchRecap");
      expect(result?.kicker).toBe(RECAP_KICKER);
      expect(result?.secondary?.article.articleType).toBe("matchPreview");
      expect(result?.secondary?.label).toBe("Lees ook de voorbeschouwing");
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("recap only → renders RECAP, no secondary, no warning", () => {
      const result = selectMatchArticle([RECAP], status);
      expect(result?.article.articleType).toBe("matchRecap");
      expect(result?.kicker).toBe(RECAP_KICKER);
      expect(result?.secondary).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("preview only → renders PREVIEW as a useful fallback, no secondary, no warning", () => {
      const result = selectMatchArticle([PREVIEW], status);
      expect(result?.article.articleType).toBe("matchPreview");
      expect(result?.kicker).toBe(PREVIEW_KICKER);
      expect(result?.secondary).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("neither → null", () => {
      expect(selectMatchArticle([], status)).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe("robustness", () => {
    it("ignores duplicate same-type rows, keeping the first (newest-first order)", () => {
      const newerRecap = makeArticle("matchRecap", {
        id: "recap-new",
        slug: "newer-recap",
      });
      const olderRecap = makeArticle("matchRecap", {
        id: "recap-old",
        slug: "older-recap",
      });
      const result = selectMatchArticle([newerRecap, olderRecap], "finished");
      expect(result?.article.slug).toBe("newer-recap");
    });

    it("secondary points at the non-dominant article's slug", () => {
      const result = selectMatchArticle([RECAP, PREVIEW], "finished");
      expect(result?.secondary?.article.slug).toBe("op-naar-de-derby");
    });
  });
});
