import type { NextConfig } from "next";
import { spawn, type ChildProcess } from "child_process";

// Module-level singleton to prevent duplicate watchers on config reloads
let responsibilityWatcher: ChildProcess | null = null;

/**
 * Cleanup watcher process (idempotent)
 */
function cleanupWatcher(): void {
  if (responsibilityWatcher && !responsibilityWatcher.killed) {
    try {
      responsibilityWatcher.kill();
      responsibilityWatcher = null;
    } catch (err) {
      console.error("[next.config] Failed to kill watcher:", err);
    }
  }
}

// Auto-start responsibility markdown watch mode during development
if (process.env.NODE_ENV === "development" && !responsibilityWatcher) {
  try {
    // Spawn without shell to avoid command injection risk
    responsibilityWatcher = spawn("npm", ["run", "watch:responsibility"], {
      stdio: "inherit",
    });

    // Log errors
    responsibilityWatcher.on("error", (err) => {
      console.error("[next.config] Watcher process error:", err);
      responsibilityWatcher = null;
    });

    // Log unexpected exits
    responsibilityWatcher.on("exit", (code, signal) => {
      if (code !== null && code !== 0) {
        console.error(
          `[next.config] Watcher exited with code ${code}, signal ${signal}`,
        );
      }
      responsibilityWatcher = null;
    });

    // Cleanup on process exit (idempotent via cleanupWatcher)
    process.once("exit", cleanupWatcher);
    process.once("SIGINT", () => {
      cleanupWatcher();
      process.exit(130); // Standard exit code for SIGINT
    });
    process.once("SIGTERM", () => {
      cleanupWatcher();
      process.exit(143); // Standard exit code for SIGTERM
    });

    // Attempt graceful cleanup on unhandled errors (SIGKILL cannot be caught)
    process.once("uncaughtException", (err) => {
      console.error("[next.config] Uncaught exception:", err);
      cleanupWatcher();
      process.exit(1);
    });
    process.once("unhandledRejection", (reason) => {
      console.error("[next.config] Unhandled rejection:", reason);
      cleanupWatcher();
      process.exit(1);
    });
  } catch (err) {
    console.error("[next.config] Failed to start watcher:", err);
  }
}

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
      {
        protocol: "https",
        hostname: "clubapi.prosoccerdata.com",
        pathname: "/**",
      },
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
