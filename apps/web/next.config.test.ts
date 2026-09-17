import { describe, it, expect } from "vitest";
import nextConfig from "./next.config";

describe("next.config redirects", () => {
  it("redirects old Dutch URL renames with 308", async () => {
    const redirects = await nextConfig.redirects!();

    const expected = [
      { source: "/news", destination: "/nieuws" },
      { source: "/news/:slug", destination: "/nieuws/:slug" },
      { source: "/game/:matchId", destination: "/wedstrijd/:matchId" },
      { source: "/search", destination: "/zoeken" },
    ];

    for (const { source, destination } of expected) {
      const match = redirects.find((r) => r.source === source);
      expect(match, `Missing redirect for ${source}`).toBeDefined();
      expect(match!.destination).toBe(destination);
      expect(match!.permanent).toBe(true);
    }
  });

  it("redirects phase 2 route renames with 308", async () => {
    const redirects = await nextConfig.redirects!();

    const expected = [
      { source: "/calendar", destination: "/kalender" },
      { source: "/teams", destination: "/ploegen" },
      { source: "/team/:slug", destination: "/ploegen/:slug" },
      { source: "/club/history", destination: "/club/geschiedenis" },
      { source: "/club/register", destination: "/club/praktische-informatie" },
      // #2207 — practical-info hub re-slugged inschrijven → praktische-informatie
      {
        source: "/club/inschrijven",
        destination: "/club/praktische-informatie",
      },
    ];

    for (const { source, destination } of expected) {
      const match = redirects.find((r) => r.source === source);
      expect(match, `Missing redirect for ${source}`).toBeDefined();
      expect(match!.destination).toBe(destination);
      expect(match!.permanent).toBe(true);
    }
  });

  it("redirects /events route rename to /evenementen with 308", async () => {
    const redirects = await nextConfig.redirects!();

    const expected = [
      { source: "/events", destination: "/evenementen" },
      { source: "/events/:slug", destination: "/evenementen/:slug" },
    ];

    for (const { source, destination } of expected) {
      const match = redirects.find((r) => r.source === source);
      expect(match, `Missing redirect for ${source}`).toBeDefined();
      expect(match!.destination).toBe(destination);
      expect(match!.permanent).toBe(true);
    }
  });

  it("redirects the retired /club/organigram to the /hulp hub with 308 (#2058)", async () => {
    const redirects = await nextConfig.redirects!();

    const match = redirects.find((r) => r.source === "/club/organigram");
    expect(match, "Missing redirect for /club/organigram").toBeDefined();
    expect(match!.destination).toBe("/hulp#structuur");
    expect(match!.permanent).toBe(true);
  });

  it("redirects retired Gatsby routes to the nearest page with 308 (#2227 SEO-9)", async () => {
    const redirects = await nextConfig.redirects!();

    const expected = [
      // #3014 — `/club/cashless` renders its CMS page again; the sub-path
      // lands on it.
      { source: "/club/cashless/voorwaarden", destination: "/club/cashless" },
      { source: "/kiosk", destination: "/kalender" },
      { source: "/kiosk/:path*", destination: "/kalender" },
    ];

    for (const { source, destination } of expected) {
      const match = redirects.find((r) => r.source === source);
      expect(match, `Missing redirect for ${source}`).toBeDefined();
      expect(match!.destination).toBe(destination);
      expect(match!.permanent).toBe(true);
    }
  });

  it("lets the /club/downloads and /club/cashless CMS pages render (#3014)", async () => {
    const redirects = await nextConfig.redirects!();
    const sources = redirects.map((r) => r.source);
    // Both are live Sanity `page` docs linked from the header and the /club
    // hub; a redirect here sends the visitor back to the page they left.
    expect(sources).not.toContain("/club/downloads");
    expect(sources).not.toContain("/club/cashless");
  });

  it("sends the printed /ongeval QR code to the accident path with 307 (#3014)", async () => {
    const redirects = await nextConfig.redirects!();

    const match = redirects.find((r) => r.source === "/ongeval");
    expect(match, "Missing redirect for /ongeval").toBeDefined();
    expect(match!.destination).toBe("/hulp#sportongeval");
    // Temporary on purpose: the QR code is printed for good and the target may
    // move, so browsers must not cache it.
    expect(match!.permanent).toBe(false);
  });

  it("drops the broken static player/staff/youth renames now handled by resolver routes (#2227)", async () => {
    const redirects = await nextConfig.redirects!();
    const sources = redirects.map((r) => r.source);
    // These passed a name-slug / bare age token to psdId-/slug-keyed targets and
    // 404'd. Resolution now lives in src/app/{player,players,staff}/[slug] and
    // src/app/(landing)/jeugd/[slug].
    expect(sources).not.toContain("/players/:slug");
    expect(sources).not.toContain("/staff/:slug");
    expect(sources.some((source) => source.startsWith("/jeugd/"))).toBe(false);
  });

  it("routes the Gatsby team slugs that did not survive the rename (#2963)", async () => {
    const redirects = await nextConfig.redirects!();

    const expected = [
      { source: "/team/a-ploeg", destination: "/ploegen/eerste-elftallen-a" },
      { source: "/team/b-ploeg", destination: "/ploegen/eerste-elftallen-b" },
      { source: "/team/u17", destination: "/ploegen/kcvve-u17" },
      { source: "/team/zondagsreserven", destination: "/ploegen/reserven" },
      { source: "/team/veteranen", destination: "/ploegen" },
      { source: "/team/:slug/index.html", destination: "/team/:slug" },
    ];

    for (const { source, destination } of expected) {
      const match = redirects.find((r) => r.source === source);
      expect(match, `Missing redirect for ${source}`).toBeDefined();
      expect(match!.destination).toBe(destination);
      expect(match!.permanent).toBe(true);
    }
  });

  it("puts every /team and /news specific rule ahead of its generic rename (#2963)", async () => {
    const redirects = await nextConfig.redirects!();
    const indexOf = (source: string) =>
      redirects.findIndex((r) => r.source === source);

    // A generic rule placed first would swallow the specific ones and land the
    // visitor on a not-found page that answers 200 — the #2963 defect.
    const genericTeam = indexOf("/team/:slug");
    const genericNews = indexOf("/news/:slug");
    expect(genericTeam).toBeGreaterThan(-1);
    expect(genericNews).toBeGreaterThan(-1);

    for (const source of [
      "/team/a-ploeg",
      "/team/b-ploeg",
      "/team/u17",
      "/team/zondagsreserven",
      "/team/veteranen",
    ]) {
      expect(
        indexOf(source),
        `${source} must precede /team/:slug`,
      ).toBeLessThan(genericTeam);
    }

    for (const source of [
      "/news/transfernieuws",
      "/news/jeugd",
      "/news/b-ploeg",
      "/news/bestuur",
      "/news/:page(\\d+)",
    ]) {
      expect(
        indexOf(source),
        `${source} must precede /news/:slug`,
      ).toBeLessThan(genericNews);
    }
  });

  it("routes the Gatsby category archives to the tag listing (#2963)", async () => {
    const redirects = await nextConfig.redirects!();

    const expected = [
      {
        source: "/news/transfernieuws",
        destination: "/nieuws?categorie=Transfernieuws",
      },
      { source: "/news/jeugd", destination: "/nieuws?categorie=Jeugd" },
      { source: "/news/b-ploeg", destination: "/nieuws?categorie=B-Ploeg" },
      { source: "/news/sponsor", destination: "/nieuws?categorie=Sponsor" },
      { source: "/news/corona", destination: "/nieuws?categorie=Corona" },
      {
        source: "/news/beker-van-zemst",
        destination: "/nieuws?categorie=Beker%20Van%20Zemst",
      },
      {
        source: "/news/beker-van-brabant",
        destination: "/nieuws?categorie=Beker%20Van%20Brabant",
      },
      // No surviving tag — the archive itself.
      { source: "/news/bestuur", destination: "/nieuws" },
      { source: "/news/kcvv-tv", destination: "/nieuws" },
      { source: "/news/ploeg", destination: "/nieuws" },
      { source: "/news/:page(\\d+)", destination: "/nieuws" },
    ];

    for (const { source, destination } of expected) {
      const match = redirects.find((r) => r.source === source);
      expect(match, `Missing redirect for ${source}`).toBeDefined();
      expect(match!.destination).toBe(destination);
      expect(match!.permanent).toBe(true);
    }
  });

  it("routes the five re-slugged articles from their date-prefixed URL (#2963)", async () => {
    const redirects = await nextConfig.redirects!();

    const expected = [
      "vincent-haegeman-geen-afscheidsinterview",
      "kcvv-elewijt-b-stelt-de-kern-voor-van-seizoen-2026-2027",
      "dieter-van-dionant-groei-visie-succesvol",
      "afscheid-van-julien-en-nillie",
      "maxim-breugelmans-drive-passie-en-doorzettingsvermogen",
    ];

    for (const slug of expected) {
      const match = redirects.find((r) => r.destination === `/nieuws/${slug}`);
      expect(match, `Missing redirect to /nieuws/${slug}`).toBeDefined();
      expect(match!.source).toMatch(/^\/nieuws\/\d{4}-\d{2}-\d{2}-/);
      expect(match!.permanent).toBe(true);
    }
  });

  it("does not strip the date prefix generically — 120 article slugs legitimately carry one (#2963)", async () => {
    const redirects = await nextConfig.redirects!();
    // A pattern rule here would break every article whose slug really does
    // begin with a date. Only the five hand-listed exceptions may exist.
    const dated = redirects.filter((r) => r.source.startsWith("/nieuws/"));
    expect(dated).toHaveLength(5);
    for (const r of dated) {
      expect(r.source).not.toContain(":");
    }
  });

  it("routes the Gatsby content-hashed PDF URLs to their migrated copies (#2960)", async () => {
    const redirects = await nextConfig.redirects!();

    const expected = [
      {
        source:
          "/static/reglement_inwendige_orde_2022-823bb0914d959fb88bd234cfdbe94df5.pdf",
        destination: "/downloads/reglement_inwendige_orde_2022.pdf",
      },
      {
        source:
          "/static/2022-2023_-_De_ideale_voetbalgrootouder-9258184a39461d932c725c054e3007f9.pdf",
        destination: "/downloads/2022-2023_-_De_ideale_voetbalgrootouder.pdf",
      },
    ];

    for (const { source, destination } of expected) {
      const match = redirects.find((r) => r.source === source);
      expect(match, `Missing redirect for ${source}`).toBeDefined();
      expect(match!.destination).toBe(destination);
      expect(match!.permanent).toBe(true);
    }
  });
});
