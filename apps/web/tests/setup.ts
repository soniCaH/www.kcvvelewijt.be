import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Mock next/font/google — font loaders are build-time only, not available in Vitest
vi.mock("next/font/google", () => ({
  Montserrat: () => ({ variable: "--font-montserrat" }),
  IBM_Plex_Mono: () => ({ variable: "--font-ibm-plex-mono" }),
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
process.env.DRUPAL_API_URL = "https://api.kcvvelewijt.be";
process.env.NEXT_PUBLIC_TYPEKIT_ID = "cvo5raz";
process.env.KCVV_API_URL = "http://localhost:8787";
process.env.NEXT_PUBLIC_SANITY_PROJECT_ID = "test-project";
process.env.NEXT_PUBLIC_SANITY_DATASET = "production";
