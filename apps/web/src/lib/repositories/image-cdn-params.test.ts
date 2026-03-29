import { describe, expect, it } from "vitest";
import {
  ARTICLES_QUERY,
  ARTICLE_BY_SLUG_QUERY,
  RELATED_ARTICLES_QUERY,
} from "./article.repository";
import { EVENTS_QUERY, NEXT_FEATURED_EVENT_QUERY } from "./event.repository";
import { HOMEPAGE_BANNERS_QUERY } from "./homepage.repository";
import { PAGE_BY_SLUG_QUERY } from "./page.repository";
import { PLAYERS_QUERY, PLAYER_BY_PSD_ID_QUERY } from "./player.repository";
import { SPONSORS_QUERY } from "./sponsor.repository";
import { ORGANIGRAM_NODES_QUERY } from "./staff.repository";
import { TEAMS_QUERY, TEAM_BY_SLUG_QUERY } from "./team.repository";

const REQUIRED_CDN_PARAMS = ["?w=", "q=80", "fm=webp", "fit=max"];

/**
 * Extracts all `"fieldName": ...asset->url` or `"url": url` projections from a GROQ query,
 * excluding file attachment fields (fileUrl).
 */
function findImageUrlProjections(
  query: string,
): { field: string; projection: string }[] {
  const results: { field: string; projection: string }[] = [];

  // Match named image URL projections: "fieldName": something.asset->url...
  const namedPattern = /"(\w+)":\s*\w[\w.]*\.asset->url(?:\s*\+\s*"[^"]*")?/g;
  let match;
  while ((match = namedPattern.exec(query)) !== null) {
    const field = match[1];
    // Skip file attachment fields
    if (field === "fileUrl") continue;
    results.push({ field, projection: match[0] });
  }

  // Match inline body image projections: asset->{ url } or asset->{ "url": url + "..." }
  const inlinePattern =
    /asset->\{\s*(?:"url":\s*)?url(?:\s*\+\s*"[^"]*")?\s*\}/g;
  while ((match = inlinePattern.exec(query)) !== null) {
    results.push({ field: "url (inline body image)", projection: match[0] });
  }

  return results;
}

describe("Sanity image CDN optimization", () => {
  const queryCases = [
    { name: "PLAYERS_QUERY", query: PLAYERS_QUERY },
    { name: "PLAYER_BY_PSD_ID_QUERY", query: PLAYER_BY_PSD_ID_QUERY },
    { name: "TEAMS_QUERY", query: TEAMS_QUERY },
    { name: "TEAM_BY_SLUG_QUERY", query: TEAM_BY_SLUG_QUERY },
    { name: "ORGANIGRAM_NODES_QUERY", query: ORGANIGRAM_NODES_QUERY },
    { name: "ARTICLES_QUERY", query: ARTICLES_QUERY },
    { name: "ARTICLE_BY_SLUG_QUERY", query: ARTICLE_BY_SLUG_QUERY },
    { name: "RELATED_ARTICLES_QUERY", query: RELATED_ARTICLES_QUERY },
    { name: "HOMEPAGE_BANNERS_QUERY", query: HOMEPAGE_BANNERS_QUERY },
    { name: "EVENTS_QUERY", query: EVENTS_QUERY },
    { name: "NEXT_FEATURED_EVENT_QUERY", query: NEXT_FEATURED_EVENT_QUERY },
    { name: "SPONSORS_QUERY", query: SPONSORS_QUERY },
    { name: "PAGE_BY_SLUG_QUERY", query: PAGE_BY_SLUG_QUERY },
  ];

  for (const { name, query } of queryCases) {
    it(`${name}: all image projections include CDN params`, () => {
      const projections = findImageUrlProjections(query);
      expect(projections.length).toBeGreaterThan(0);

      for (const { field, projection } of projections) {
        for (const param of REQUIRED_CDN_PARAMS) {
          expect(
            projection,
            `${name} field "${field}" should include "${param}"`,
          ).toContain(param);
        }
      }
    });
  }

  it("fileUrl fields are NOT modified", () => {
    const queriesWithFiles = [
      TEAM_BY_SLUG_QUERY,
      ARTICLES_QUERY,
      ARTICLE_BY_SLUG_QUERY,
      PAGE_BY_SLUG_QUERY,
    ];
    for (const query of queriesWithFiles) {
      expect(query).toMatch(/"fileUrl"\s*:\s*file\.asset->url/);
      expect(query).not.toMatch(/"fileUrl"\s*:\s*file\.asset->url\s*\+/);
    }
  });
});
