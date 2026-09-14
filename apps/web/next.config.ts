import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Static SEO redirects for renamed/retired routes. Dynamic legacy resolvers
  // that need a CMS lookup (player/staff name-slug → psdId, youth age → team
  // slug) are routes under src/app/{player,players,staff}/[slug] and
  // src/app/(landing)/jeugd/[slug] instead — a static prefix redirect there
  // would 404 against the psdId-/slug-keyed targets (#2227).
  async redirects() {
    return [
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
      // #2227 (SEO-9) — retired Gatsby routes with no direct equivalent →
      // nearest live page (owner decision on the issue).
      {
        source: "/club/cashless",
        destination: "/club/praktische-informatie",
        permanent: true,
      },
      {
        source: "/club/cashless/voorwaarden",
        destination: "/club/praktische-informatie",
        permanent: true,
      },
      {
        source: "/club/downloads",
        destination: "/club",
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
      { protocol: "https", hostname: "placehold.co", pathname: "/**" },
      { protocol: "https", hostname: "api.kcvvelewijt.be", pathname: "/**" },
      {
        protocol: "https",
        hostname: "dfaozfi7c7f3s.cloudfront.net",
        pathname: "/**",
      },
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "cdn.sanity.io", pathname: "/**" },
    ],
    // PERF-2 (#2235): serve optimizer-transformed heroes as AVIF (best
    // compression) with WebP fallback, and cache optimized variants for a
    // day so repeat views skip re-optimization. Most photos already arrive
    // as pre-transformed Sanity CDN URLs; this only governs the optimizer-
    // served path. `picsum.photos`/`placehold.co` remotePatterns are used
    // exclusively by Storybook stories + `*.mocks.ts` — confirmed not
    // referenced by any production render path.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    // SVG Security Configuration
    // Current analysis (2025-01-05):
    // - Drupal API serves standard image formats: JPEG, PNG, GIF, WebP
    // - Schema validation enforces image MIME types (no SVG from Drupal API)
    // - Local SVGs are controlled files (footer-top.svg)
    // - placehold.co is a trusted placeholder service
    // SECURITY NOTE: If user-uploaded SVGs are added in the future:
    // 1. Add server-side SVG sanitization (e.g., dompurify, svg-sanitizer)
    // 2. Implement magic byte validation in Drupal (not just MIME types)
    // 3. Consider converting SVGs to PNG/WebP on upload
    // 4. Use Content-Security-Policy headers to restrict SVG capabilities
    // See SECURITY.md for full file validation guidelines
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    // Content-Disposition: attachment forces download instead of inline display
    // This provides defense-in-depth against potential SVG XSS
  },
};

export default nextConfig;
