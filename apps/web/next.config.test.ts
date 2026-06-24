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
      { source: "/club/cashless", destination: "/club/praktische-informatie" },
      {
        source: "/club/cashless/voorwaarden",
        destination: "/club/praktische-informatie",
      },
      { source: "/club/downloads", destination: "/club" },
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
});
