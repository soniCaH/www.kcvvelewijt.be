import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Redirects for old /jeugd/* URLs to /team/*
  // This ensures SEO preservation for any indexed youth team pages
  async redirects() {
    return [
      {
        source: "/jeugd/:slug",
        destination: "/team/:slug",
        permanent: true, // 308 redirect for SEO
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
