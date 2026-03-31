/**
 * Tests for canonical URL metadata on dynamic routes.
 *
 * Verifies that all public dynamic routes include
 * `alternates.canonical` in their generateMetadata output,
 * and that noindex routes do NOT include canonical tags.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { SITE_CONFIG } from "@/lib/constants";

// ── Mocks ──────────────────────────────────────────────────────────

// Mock the Effect runtime so generateMetadata never hits real services
vi.mock("@/lib/effect/runtime", () => ({
  runPromise: vi.fn(),
}));

// Mock notFound to prevent Next.js navigation side-effects
vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
}));

// Lazy-import runPromise so we can configure per-test return values
const { runPromise } = await import("@/lib/effect/runtime");
const mockRunPromise = vi.mocked(runPromise);

// Import all page modules upfront (mocks are already in place)
const nieuws = await import("./nieuws/[slug]/page");
const spelers = await import("./spelers/[slug]/page");
const staf = await import("./staf/[slug]/page");
const ploegen = await import("./ploegen/[slug]/page");
const wedstrijd = await import("./wedstrijd/[matchId]/page");

// ── Fixtures ───────────────────────────────────────────────────────

const articleFixture = {
  title: "Test Article",
  slug: "test-article",
  publishedAt: "2026-01-01",
  coverImageUrl: null,
};

const playerFixture = {
  firstName: "Jan",
  lastName: "Janssens",
  position: "Aanvaller",
  imageUrl: null,
};

const staffFixture = {
  firstName: "Piet",
  lastName: "Pieters",
  imageUrl: null,
};

const teamFixture = {
  name: "Eerste Ploeg",
  slug: "eerste-ploeg",
  teamType: "senior",
  tagline: "De beste ploeg",
  teamImageUrl: null,
};

const matchFixture = {
  id: 12345,
  date: new Date("2026-03-15"),
  status: "played",
  home_team: { name: "KCVV Elewijt", logo: null },
  away_team: { name: "FC Test", logo: null },
  home_score: 2,
  away_score: 1,
  competition: "Provinciaal",
};

// ── Tests ──────────────────────────────────────────────────────────

describe("Canonical URLs on dynamic routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("/nieuws/[slug] includes canonical URL", async () => {
    mockRunPromise.mockResolvedValueOnce(articleFixture);
    const metadata = await nieuws.generateMetadata({
      params: Promise.resolve({ slug: "test-article" }),
    });
    expect(metadata).toHaveProperty(
      "alternates.canonical",
      `${SITE_CONFIG.siteUrl}/nieuws/test-article`,
    );
  });

  it("/spelers/[slug] includes canonical URL", async () => {
    mockRunPromise.mockResolvedValueOnce(playerFixture);
    const metadata = await spelers.generateMetadata({
      params: Promise.resolve({ slug: "123" }),
    });
    expect(metadata).toHaveProperty(
      "alternates.canonical",
      `${SITE_CONFIG.siteUrl}/spelers/123`,
    );
  });

  it("/staf/[slug] includes canonical URL", async () => {
    mockRunPromise.mockResolvedValueOnce(staffFixture);
    const metadata = await staf.generateMetadata({
      params: Promise.resolve({ slug: "456" }),
    });
    expect(metadata).toHaveProperty(
      "alternates.canonical",
      `${SITE_CONFIG.siteUrl}/staf/456`,
    );
  });

  it("/ploegen/[slug] includes canonical URL", async () => {
    mockRunPromise.mockResolvedValueOnce(teamFixture);
    const metadata = await ploegen.generateMetadata({
      params: Promise.resolve({ slug: "eerste-ploeg" }),
    });
    expect(metadata).toHaveProperty(
      "alternates.canonical",
      `${SITE_CONFIG.siteUrl}/ploegen/eerste-ploeg`,
    );
  });

  it("/wedstrijd/[matchId] includes canonical URL", async () => {
    mockRunPromise.mockResolvedValueOnce(matchFixture);
    const metadata = await wedstrijd.generateMetadata({
      params: Promise.resolve({ matchId: "12345" }),
      searchParams: Promise.resolve({}),
    });
    expect(metadata).toHaveProperty(
      "alternates.canonical",
      `${SITE_CONFIG.siteUrl}/wedstrijd/12345`,
    );
  });
});

describe("Noindex routes do NOT have canonical URLs", () => {
  it("/tegenstander/[clubId] has robots noindex and no canonical", async () => {
    const { metadata } = await import("./tegenstander/[clubId]/page");
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata).not.toHaveProperty("alternates");
  });

  it("/share has robots noindex and no canonical", async () => {
    const { metadata } = await import("./share/page");
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata).not.toHaveProperty("alternates");
  });
});
