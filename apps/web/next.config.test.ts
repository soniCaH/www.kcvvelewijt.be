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
});
