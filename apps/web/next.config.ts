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
