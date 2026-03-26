import { describe, it, expect } from "vitest";
import nextConfig from "./next.config";

describe("next.config redirects", () => {
  it("redirects old Dutch URL renames with 308", async () => {
    const redirects = await nextConfig.redirects!();

    const expected = [
      { source: "/players/:slug", destination: "/spelers/:slug" },
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
      { source: "/club/register", destination: "/club/inschrijven" },
    ];

    for (const { source, destination } of expected) {
      const match = redirects.find((r) => r.source === source);
      expect(match, `Missing redirect for ${source}`).toBeDefined();
      expect(match!.destination).toBe(destination);
      expect(match!.permanent).toBe(true);
    }
  });

  it("redirects /jeugd/:slug to /ploegen/:slug", async () => {
    const redirects = await nextConfig.redirects!();

    const match = redirects.find((r) => r.source === "/jeugd/:slug");
    expect(match).toBeDefined();
    expect(match!.destination).toBe("/ploegen/:slug");
    expect(match!.permanent).toBe(true);
  });
});
