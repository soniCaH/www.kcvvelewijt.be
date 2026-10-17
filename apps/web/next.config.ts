import type { NextConfig } from "next";
import { BOARD_TEAM_SLUGS } from "./src/lib/utils/team-href";

// `:slug(bestuur|jeugdbestuur|angels)` — see `BOARD_TEAM_SLUGS` (#3483).
const BOARD_SLUG_PARAM = `:slug(${BOARD_TEAM_SLUGS.join("|")})`;

const nextConfig: NextConfig = {
  /* config options here */

  poweredByHeader: false,

  // #3476 — baseline security headers. `frame-ancestors` is the only CSP
  // directive on purpose; a full CSP is a separate decision.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      // #3495 — /sitemap.xml is rendered per request (`dynamic = "force-dynamic"`),
      // so the CDN, not a prerender, bounds its cost and staleness: <= 30 min
      // fresh + 10 min stale-while-revalidate, inside the 60-min publish window.
      // Vercel-CDN-Cache-Control, not Cache-Control: on Vercel, Next's own
      // `max-age=0, must-revalidate` wins over a config Cache-Control (measured:
      // always MISS); Vercel reads this header first and strips it before the browser.
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Vercel-CDN-Cache-Control",
            value: "max-age=1800, stale-while-revalidate=600",
          },
        ],
      },
    ];
  },

  // Static SEO redirects for renamed/retired routes. Dynamic legacy resolvers
  // that need a CMS lookup (player/staff name-slug → psdId, youth age → team
  // slug) are routes under src/app/{player,players,staff}/[slug] and
  // src/app/(landing)/jeugd/[slug] instead — a static prefix redirect there
  // would 404 against the psdId-/slug-keyed targets (#2227).
  async redirects() {
    return [
      // ── #2960 — Gatsby's content-hashed asset URLs for two PDFs that are
      // already migrated to `public/downloads/` at identical byte sizes. Only
      // the old hashed path was unrouted.
      {
        source:
          "/static/reglement_inwendige_orde_2022-823bb0914d959fb88bd234cfdbe94df5.pdf",
        destination: "/downloads/reglement_inwendige_orde_2022.pdf",
        permanent: true,
      },
      {
        source:
          "/static/2022-2023_-_De_ideale_voetbalgrootouder-9258184a39461d932c725c054e3007f9.pdf",
        destination: "/downloads/2022-2023_-_De_ideale_voetbalgrootouder.pdf",
        permanent: true,
      },

      // ── #2963 — specific rules, kept ABOVE the generic `/news/:slug` and
      // `/team/:slug` renames below, which would otherwise swallow them and
      // land the visitor on a not-found page that answers 200 (see the issue).

      // Gatsby team slugs that did not survive the rename. `/team/:slug` →
      // `/ploegen/:slug` assumed the slug was stable; it was not, so
      // `/team/a-ploeg/` — the site's #2 page at 1,171 clicks/yr — has been
      // landing on "Team niet gevonden". Live slugs come from Sanity `team`.
      {
        source: "/team/a-ploeg",
        destination: "/ploegen/eerste-elftallen-a",
        permanent: true,
      },
      {
        source: "/team/b-ploeg",
        destination: "/ploegen/eerste-elftallen-b",
        permanent: true,
      },
      {
        source: "/team/u17",
        destination: "/ploegen/kcvve-u17",
        permanent: true,
      },
      {
        source: "/team/zondagsreserven",
        destination: "/ploegen/reserven",
        permanent: true,
      },
      // No modern equivalent — the veterans side is not a `team` document.
      // The directory is the nearest honest target.
      {
        source: "/team/veteranen",
        destination: "/ploegen",
        permanent: true,
      },
      // #3483 — the three board teams live at `/club/<slug>` only. Listing them
      // under `/ploegen` made a second public URL for the same page, and the
      // generic `/team/:slug` rename would take two hops to reach it. Literal
      // list on purpose: `showInNavigation` would also hide the real teams
      // `kcvve-u5` and `fc-weitse-gans`. The list is `BOARD_TEAM_SLUGS`.
      {
        source: `/team/${BOARD_SLUG_PARAM}`,
        destination: "/club/:slug",
        permanent: true,
      },
      {
        source: `/ploegen/${BOARD_SLUG_PARAM}`,
        destination: "/club/:slug",
        permanent: true,
      },
      {
        source: `/ploegen/${BOARD_SLUG_PARAM}/wedstrijden`,
        destination: "/club/:slug",
        permanent: true,
      },
      // Gatsby emitted directory-style URLs. Redirect to the extension-less
      // form rather than straight to `/ploegen/:slug`, so the rules above get
      // their turn on the second hop instead of being bypassed.
      {
        source: "/team/:slug/index.html",
        destination: "/team/:slug",
        permanent: true,
      },

      // Gatsby category archives. These are tag listings, not articles, so
      // `/news/:slug` below would send them to a non-existent article. The
      // `categorie` value is the tag verbatim — GROQ `in` is case-sensitive.
      {
        source: "/news/transfernieuws",
        destination: "/nieuws?categorie=Transfernieuws",
        permanent: true,
      },
      {
        source: "/news/jeugd",
        destination: "/nieuws?categorie=Jeugd",
        permanent: true,
      },
      {
        source: "/news/b-ploeg",
        destination: "/nieuws?categorie=B-Ploeg",
        permanent: true,
      },
      {
        source: "/news/sponsor",
        destination: "/nieuws?categorie=Sponsor",
        permanent: true,
      },
      {
        source: "/news/corona",
        destination: "/nieuws?categorie=Corona",
        permanent: true,
      },
      {
        source: "/news/beker-van-zemst",
        destination: "/nieuws?categorie=Beker%20Van%20Zemst",
        permanent: true,
      },
      {
        source: "/news/beker-van-brabant",
        destination: "/nieuws?categorie=Beker%20Van%20Brabant",
        permanent: true,
      },
      // `bestuur`, `kcvv-tv` and `ploeg` were Gatsby categories with no
      // surviving tag — the archive itself is the nearest target.
      {
        source: "/news/bestuur",
        destination: "/nieuws",
        permanent: true,
      },
      {
        source: "/news/kcvv-tv",
        destination: "/nieuws",
        permanent: true,
      },
      {
        source: "/news/ploeg",
        destination: "/nieuws",
        permanent: true,
      },
      // Gatsby's numbered pagination pages. `/nieuws` loads more in place.
      {
        source: "/news/:page(\\d+)",
        destination: "/nieuws",
        permanent: true,
      },

      // Five articles were re-slugged in Sanity without the `YYYY-MM-DD-`
      // prefix the other 120 still carry, so their indexed URL is dead. A
      // generic "strip the date" rule is NOT possible — it would break the
      // 120 articles whose slug legitimately begins with a date.
      {
        source: "/nieuws/2026-04-27-vincent-haegeman-geen-afscheidsinterview",
        destination: "/nieuws/vincent-haegeman-geen-afscheidsinterview",
        permanent: true,
      },
      {
        source:
          "/nieuws/2026-07-08-kcvv-elewijt-b-stelt-de-kern-voor-van-seizoen-2026-2027",
        destination:
          "/nieuws/kcvv-elewijt-b-stelt-de-kern-voor-van-seizoen-2026-2027",
        permanent: true,
      },
      {
        source: "/nieuws/2026-04-14-dieter-van-dionant-groei-visie-succesvol",
        destination: "/nieuws/dieter-van-dionant-groei-visie-succesvol",
        permanent: true,
      },
      {
        source: "/nieuws/2026-04-25-afscheid-van-julien-en-nillie",
        destination: "/nieuws/afscheid-van-julien-en-nillie",
        permanent: true,
      },
      {
        source:
          "/nieuws/2026-04-17-maxim-breugelmans-drive-passie-en-doorzettingsvermogen",
        destination:
          "/nieuws/maxim-breugelmans-drive-passie-en-doorzettingsvermogen",
        permanent: true,
      },

      // #819 — Dutch URL renames
      {
        source: "/news",
        destination: "/nieuws",
        permanent: true,
      },
      {
        source: "/news/:slug",
        destination: "/nieuws/:slug",
        permanent: true,
      },
      {
        source: "/game/:matchId",
        destination: "/wedstrijd/:matchId",
        permanent: true,
      },
      {
        source: "/search",
        destination: "/zoeken",
        permanent: true,
      },
      // #1078 — Phase 2 Dutch URL renames
      {
        source: "/calendar",
        destination: "/kalender",
        permanent: true,
      },
      {
        source: "/teams",
        destination: "/ploegen",
        permanent: true,
      },
      {
        source: "/team/:slug",
        destination: "/ploegen/:slug",
        permanent: true,
      },
      {
        source: "/club/history",
        destination: "/club/geschiedenis",
        permanent: true,
      },
      {
        source: "/club/register",
        destination: "/club/praktische-informatie",
        permanent: true,
      },
      // #2207 — CMS practical-info hub re-slugged (was wrongly "inschrijven",
      // which reads as "sign up"; the signup is /club/word-lid).
      {
        source: "/club/inschrijven",
        destination: "/club/praktische-informatie",
        permanent: true,
      },
      // #1964 — Phase 6.E events route rename /events → /evenementen.
      // `permanent: true` emits a 308 (matching every rename above); the
      // issue's "301" is shorthand for a permanent redirect.
      {
        source: "/events",
        destination: "/evenementen",
        permanent: true,
      },
      {
        source: "/events/:slug",
        destination: "/evenementen/:slug",
        permanent: true,
      },
      // #2058 — Phase 7 hub assembly: the standalone organigram page was fused
      // into the unified `/hulp` hub (its directory lives at `#structuur`). 308
      // so old bookmarks / search-index entries land on the structure section
      // instead of 404ing. Note: a `#fragment` in the destination is not a
      // reliable carrier for the source query string, so legacy `?member=`/
      // `?view=` deep-links are not preserved — those rare links land on the hub
      // and the person is one search away (acceptable for a retired route).
      {
        source: "/club/organigram",
        destination: "/hulp#structuur",
        permanent: true,
      },
      // #3014 — the printed accident letters carry a QR code for
      // `kcvvelewijt.be/ongeval`. 307, not 308: the print is permanent but the
      // target may become an article, and a 308 stays cached in browsers.
      {
        source: "/ongeval",
        destination: "/hulp#sportongeval",
        permanent: false,
      },
      // #2227 (SEO-9) — retired Gatsby routes with no direct equivalent →
      // nearest live page (owner decision on the issue). `/club/cashless` and
      // `/club/downloads` are NOT retired: both render their CMS page (#3014).
      {
        source: "/club/cashless/voorwaarden",
        destination: "/club/cashless",
        permanent: true,
      },
      // Internal kiosk displays (a, b, previous, upcoming, ranking/*) → calendar.
      {
        source: "/kiosk",
        destination: "/kalender",
        permanent: true,
      },
      {
        source: "/kiosk/:path*",
        destination: "/kalender",
        permanent: true,
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.kcvvelewijt.be", pathname: "/**" },
      {
        protocol: "https",
        hostname: "dfaozfi7c7f3s.cloudfront.net",
        pathname: "/**",
      },
      // Pinned to our project (prod and staging share `vhb33jaz`) so the
      // optimizer cannot be used to proxy any other Sanity project's images.
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/vhb33jaz/**",
      },
    ],
    // PERF-2 (#2235): serve optimizer-transformed heroes as AVIF (best
    // compression) with WebP fallback, and cache optimized variants for a
    // day so repeat views skip re-optimization. Most photos already arrive
    // as pre-transformed Sanity CDN URLs; this only governs the optimizer-
    // served path. Story-only hosts (picsum.photos, placehold.co) are not
    // listed: Storybook renders every <Image /> unoptimized.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    // SVG is allowed (local controlled files such as footer-top.svg), so the
    // optimizer response gets a locked-down CSP and is served as an attachment
    // (below) — defence in depth against SVG XSS. Sanity serves raster images.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    contentDispositionType: "attachment",
    // Content-Disposition: attachment forces download instead of inline display
    // This provides defense-in-depth against potential SVG XSS
  },
};

export default nextConfig;
