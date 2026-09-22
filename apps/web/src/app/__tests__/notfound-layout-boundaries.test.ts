/**
 * A same-segment `layout.tsx` gets a real `404`, not a soft one (#2968)
 *
 * `loading.tsx` wraps `page.js` and nested `layout.js` files in a
 * `<Suspense>` boundary, but never the `layout.js` in its own segment (Next
 * docs, `node_modules/next/dist/docs/.../loading.md`). So a same-segment
 * layout's existence check runs in the render shell, before that boundary
 * opens and the response commits to `200` — moving the check there is what
 * turns a soft 404 (200 + noindex) into a real one.
 *
 * A unit test cannot observe an HTTP status code — that needs a real
 * `next build` + `next start` + `curl` (see the PR body's status table).
 * What a unit test *can* lock is the mechanism that status is read from:
 * Next's `notFound()` throws a plain `Error` whose `.digest` is
 * `NEXT_HTTP_ERROR_FALLBACK;404` — `app-render.tsx`'s catch reads exactly
 * that string to set `res.statusCode` (see
 * `docs/research/nextjs-notfound-status-under-suspense.md` §2.3). Each case
 * below asserts a layout either produces that digest (unknown param) or
 * passes `children` through untouched (known param) — mirroring the digest
 * assertion `failed-read-boundaries.test.ts` already uses for
 * `/wedstrijd/[matchId]`'s page-level fix (#3034).
 *
 * Each route's fetch function is mocked at its own module (`./page` or
 * `./team-data`) rather than through the Effect/repository layer — the
 * repository-level existence semantics are already covered by that route's
 * own `page.test.tsx` / `opponent-data.test.ts`; this file's job is only the
 * layout's placement in the shell, which is orthogonal to how the entity is
 * fetched.
 *
 * @see https://github.com/soniCaH/www.kcvvelewijt.be/issues/2968
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createElement } from "react";

const {
  mockFetchPlayer,
  mockFetchStaffMember,
  mockFetchArticle,
  mockFetchClubPage,
  mockFetchGallery,
  mockFetchEvent,
  mockFetchOpponentData,
  mockFetchMatchOrNotFound,
  mockFetchTeam,
} = vi.hoisted(() => ({
  mockFetchPlayer: vi.fn(),
  mockFetchStaffMember: vi.fn(),
  mockFetchArticle: vi.fn(),
  mockFetchClubPage: vi.fn(),
  mockFetchGallery: vi.fn(),
  mockFetchEvent: vi.fn(),
  mockFetchOpponentData: vi.fn(),
  mockFetchMatchOrNotFound: vi.fn(),
  mockFetchTeam: vi.fn(),
}));

vi.mock("@/app/(main)/spelers/[slug]/page", () => ({
  fetchPlayerOrNull: mockFetchPlayer,
}));

vi.mock("@/app/(main)/staf/[slug]/page", () => ({
  fetchStaffMemberOrNull: mockFetchStaffMember,
}));

vi.mock("@/app/(main)/nieuws/[slug]/page", () => ({
  fetchArticleOrNull: mockFetchArticle,
}));

vi.mock("@/app/(main)/club/[slug]/page", () => ({
  fetchPage: mockFetchClubPage,
}));

vi.mock("@/app/(main)/galerij/[slug]/page", () => ({
  fetchGalleryOrNull: mockFetchGallery,
}));

vi.mock("@/app/(main)/evenementen/[slug]/page", () => ({
  fetchEventOrNull: mockFetchEvent,
  // Real predicate re-implemented here (not imported) so this file stays a
  // pure mock of the module — same semantics as `isEventNotFound` in
  // `page.tsx`: a missing event, or one whose `dateStart` was cleared.
  isEventNotFound: (event: { dateStart?: string } | null) =>
    !event || !event.dateStart,
}));

vi.mock("@/app/(main)/tegenstander/[clubId]/page", () => ({
  fetchOpponentData: mockFetchOpponentData,
}));

vi.mock("@/app/(main)/wedstrijd/[matchId]/page", () => ({
  fetchMatchOrNotFound: mockFetchMatchOrNotFound,
}));

vi.mock("@/app/(main)/ploegen/[slug]/team-data", () => ({
  fetchTeamOrNull: mockFetchTeam,
}));

import PlayerLayout from "@/app/(main)/spelers/[slug]/layout";
import StaffLayout from "@/app/(main)/staf/[slug]/layout";
import ArticleLayout from "@/app/(main)/nieuws/[slug]/layout";
import ClubPageLayout from "@/app/(main)/club/[slug]/layout";
import GalleryLayout from "@/app/(main)/galerij/[slug]/layout";
import EventLayout from "@/app/(main)/evenementen/[slug]/layout";
import OpponentLayout from "@/app/(main)/tegenstander/[clubId]/layout";
import MatchLayout from "@/app/(main)/wedstrijd/[matchId]/layout";
import TeamSegmentLayout from "@/app/(main)/ploegen/[slug]/layout";
import { MatchStripSlot } from "@/components/layout/MatchStrip";

/** A stable, identity-checkable stand-in for `children` — proves a resolving
 * layout passes it through untouched rather than swallowing or replacing it. */
const CHILDREN = createElement("div", { "data-testid": "children-sentinel" });

const NOT_FOUND_DIGEST = /^NEXT_HTTP_ERROR_FALLBACK;404/;

/** The two detail layouts that also mount the strip (#3027) return a
 * fragment: `<MatchStripSlot />` first, then `children`, still untouched. */
const STRIP_THEN_CHILDREN = expect.objectContaining({
  props: {
    children: [expect.objectContaining({ type: MatchStripSlot }), CHILDREN],
  },
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("(main)/spelers/[slug]/layout — #2968", () => {
  it("throws notFound()'s digest for an unknown slug", async () => {
    mockFetchPlayer.mockResolvedValue(null);
    await expect(
      PlayerLayout({
        children: CHILDREN,
        params: Promise.resolve({ slug: "unknown" }),
      }),
    ).rejects.toMatchObject({
      digest: expect.stringMatching(NOT_FOUND_DIGEST),
    });
  });

  it("mounts the strip, then passes children through, for a known slug", async () => {
    mockFetchPlayer.mockResolvedValue({ id: "player-1" });
    await expect(
      PlayerLayout({
        children: CHILDREN,
        params: Promise.resolve({ slug: "42" }),
      }),
    ).resolves.toEqual(STRIP_THEN_CHILDREN);
  });
});

describe("(main)/staf/[slug]/layout — #2968", () => {
  it("throws notFound()'s digest for an unknown slug", async () => {
    mockFetchStaffMember.mockResolvedValue(null);
    await expect(
      StaffLayout({
        children: CHILDREN,
        params: Promise.resolve({ slug: "unknown" }),
      }),
    ).rejects.toMatchObject({
      digest: expect.stringMatching(NOT_FOUND_DIGEST),
    });
  });

  it("passes children through for a known slug", async () => {
    mockFetchStaffMember.mockResolvedValue({ id: "staff-1" });
    await expect(
      StaffLayout({
        children: CHILDREN,
        params: Promise.resolve({ slug: "42" }),
      }),
    ).resolves.toBe(CHILDREN);
  });
});

describe("(main)/nieuws/[slug]/layout — #2968", () => {
  it("throws notFound()'s digest for an unknown slug", async () => {
    mockFetchArticle.mockResolvedValue(null);
    await expect(
      ArticleLayout({
        children: CHILDREN,
        params: Promise.resolve({ slug: "unknown" }),
      }),
    ).rejects.toMatchObject({
      digest: expect.stringMatching(NOT_FOUND_DIGEST),
    });
  });

  it("passes children through for a known slug", async () => {
    mockFetchArticle.mockResolvedValue({ id: "article-1" });
    await expect(
      ArticleLayout({
        children: CHILDREN,
        params: Promise.resolve({ slug: "een-artikel" }),
      }),
    ).resolves.toBe(CHILDREN);
  });
});

describe("(main)/club/[slug]/layout — #2968", () => {
  it("throws notFound()'s digest for an unknown slug", async () => {
    mockFetchClubPage.mockResolvedValue(null);
    await expect(
      ClubPageLayout({
        children: CHILDREN,
        params: Promise.resolve({ slug: "unknown" }),
      }),
    ).rejects.toMatchObject({
      digest: expect.stringMatching(NOT_FOUND_DIGEST),
    });
  });

  it("passes children through for a known slug", async () => {
    mockFetchClubPage.mockResolvedValue({ id: "page-1", title: "Inschrijven" });
    await expect(
      ClubPageLayout({
        children: CHILDREN,
        params: Promise.resolve({ slug: "inschrijven" }),
      }),
    ).resolves.toBe(CHILDREN);
  });
});

describe("(main)/galerij/[slug]/layout — #2968", () => {
  it("throws notFound()'s digest for an unknown slug", async () => {
    mockFetchGallery.mockResolvedValue(null);
    await expect(
      GalleryLayout({
        children: CHILDREN,
        params: Promise.resolve({ slug: "unknown" }),
      }),
    ).rejects.toMatchObject({
      digest: expect.stringMatching(NOT_FOUND_DIGEST),
    });
  });

  it("passes children through for a known slug", async () => {
    mockFetchGallery.mockResolvedValue({ id: "gallery-1" });
    await expect(
      GalleryLayout({
        children: CHILDREN,
        params: Promise.resolve({ slug: "een-galerij" }),
      }),
    ).resolves.toBe(CHILDREN);
  });
});

describe("(main)/evenementen/[slug]/layout — #2968", () => {
  it("throws notFound()'s digest for an unknown slug", async () => {
    mockFetchEvent.mockResolvedValue(null);
    await expect(
      EventLayout({
        children: CHILDREN,
        params: Promise.resolve({ slug: "unknown" }),
      }),
    ).rejects.toMatchObject({
      digest: expect.stringMatching(NOT_FOUND_DIGEST),
    });
  });

  it("throws notFound()'s digest for an event with a cleared dateStart (mirrors page.tsx's own check)", async () => {
    mockFetchEvent.mockResolvedValue({ id: "event-1", dateStart: "" });
    await expect(
      EventLayout({
        children: CHILDREN,
        params: Promise.resolve({ slug: "een-evenement" }),
      }),
    ).rejects.toMatchObject({
      digest: expect.stringMatching(NOT_FOUND_DIGEST),
    });
  });

  it("passes children through for a known slug with a real dateStart", async () => {
    mockFetchEvent.mockResolvedValue({
      id: "event-1",
      dateStart: "2026-10-01T18:00:00Z",
    });
    await expect(
      EventLayout({
        children: CHILDREN,
        params: Promise.resolve({ slug: "een-evenement" }),
      }),
    ).resolves.toBe(CHILDREN);
  });
});

describe("(main)/tegenstander/[clubId]/layout — #2968", () => {
  it("throws notFound()'s digest for a non-numeric clubId, without calling fetchOpponentData", async () => {
    await expect(
      OpponentLayout({
        children: CHILDREN,
        params: Promise.resolve({ clubId: "not-a-number" }),
      }),
    ).rejects.toMatchObject({
      digest: expect.stringMatching(NOT_FOUND_DIGEST),
    });
    expect(mockFetchOpponentData).not.toHaveBeenCalled();
  });

  it("throws notFound()'s digest when fetchOpponentData resolves no data", async () => {
    mockFetchOpponentData.mockResolvedValue(null);
    await expect(
      OpponentLayout({
        children: CHILDREN,
        params: Promise.resolve({ clubId: "1235" }),
      }),
    ).rejects.toMatchObject({
      digest: expect.stringMatching(NOT_FOUND_DIGEST),
    });
  });

  it("passes children through for a known clubId", async () => {
    mockFetchOpponentData.mockResolvedValue({
      opponentName: "Test FC",
      sections: [],
    });
    await expect(
      OpponentLayout({
        children: CHILDREN,
        params: Promise.resolve({ clubId: "1235" }),
      }),
    ).resolves.toBe(CHILDREN);
  });
});

describe("(main)/wedstrijd/[matchId]/layout — #2968", () => {
  it("throws notFound()'s digest for a non-numeric matchId, without calling fetchMatchOrNotFound", async () => {
    await expect(
      MatchLayout({
        children: CHILDREN,
        params: Promise.resolve({ matchId: "not-a-number" }),
      }),
    ).rejects.toMatchObject({
      digest: expect.stringMatching(NOT_FOUND_DIGEST),
    });
    expect(mockFetchMatchOrNotFound).not.toHaveBeenCalled();
  });

  it("propagates notFound()'s digest when fetchMatchOrNotFound rejects with it (#3034's fix already restores it)", async () => {
    const notFoundError = Object.assign(
      new Error("NEXT_HTTP_ERROR_FALLBACK;404"),
      {
        digest: "NEXT_HTTP_ERROR_FALLBACK;404",
      },
    );
    mockFetchMatchOrNotFound.mockRejectedValue(notFoundError);
    await expect(
      MatchLayout({
        children: CHILDREN,
        params: Promise.resolve({ matchId: "99999999" }),
      }),
    ).rejects.toMatchObject({
      digest: expect.stringMatching(NOT_FOUND_DIGEST),
    });
  });

  it("mounts the strip, then passes children through, for a known matchId", async () => {
    mockFetchMatchOrNotFound.mockResolvedValue({ id: 3424 });
    await expect(
      MatchLayout({
        children: CHILDREN,
        params: Promise.resolve({ matchId: "3424" }),
      }),
    ).resolves.toEqual(STRIP_THEN_CHILDREN);
  });
});

describe("(main)/ploegen/[slug]/layout — #2968 (covers both (detail) and wedstrijden children)", () => {
  it("throws notFound()'s digest for an unknown team slug", async () => {
    mockFetchTeam.mockResolvedValue(null);
    await expect(
      TeamSegmentLayout({
        children: CHILDREN,
        params: Promise.resolve({ slug: "unknown" }),
      }),
    ).rejects.toMatchObject({
      digest: expect.stringMatching(NOT_FOUND_DIGEST),
    });
  });

  it("passes children through for a known team slug", async () => {
    mockFetchTeam.mockResolvedValue({ id: "team-1" });
    await expect(
      TeamSegmentLayout({
        children: CHILDREN,
        params: Promise.resolve({ slug: "eerste-ploeg" }),
      }),
    ).resolves.toBe(CHILDREN);
  });
});
