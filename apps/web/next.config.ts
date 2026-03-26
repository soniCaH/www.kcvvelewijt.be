import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Redirects for old /jeugd/* URLs to /team/*
  // This ensures SEO preservation for any indexed youth team pages
  async redirects() {
    return [
      {
        source: "/jeugd/:slug",
        destination: "/ploegen/:slug",
        permanent: true, // 308 redirect for SEO
      },
      // #819 — Dutch URL renames
      {
        source: "/players/:slug",
        destination: "/spelers/:slug",
        permanent: true,
      },
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
        destination: "/club/inschrijven",
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
