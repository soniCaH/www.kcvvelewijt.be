/**
 * Tests for canonical URL metadata on dynamic routes.
 *
 * Verifies that all public dynamic routes include
 * `alternates.canonical` in their generateMetadata output,
 * and that noindex routes do NOT include canonical tags.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { SITE_CONFIG, DEFAULT_OG_IMAGE } from "@/lib/constants";

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

// Import all page modules upfront (mocks are already in place). Module scope
// is deliberate: Vitest charges an import inside an `it()` body against
// `testTimeout`, while these are paid during the untimed collect phase (#2362).
const nieuwsDetail = await import("./nieuws/[slug]/page");
const spelers = await import("./spelers/[slug]/page");
const staf = await import("./staf/[slug]/page");
const ploegen = await import("./ploegen/[slug]/page");
const wedstrijd = await import("./wedstrijd/[matchId]/page");
const privacy = await import("./privacy/page");
const clubSlug = await import("./club/[slug]/page");
const bestuur = await import("./club/bestuur/page");
const home = await import("../(landing)/page");
const nieuwsIndex = await import("../(landing)/nieuws/page");
const tegenstander = await import("./tegenstander/[clubId]/page");
const share = await import("./share/page");

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

const opponentFixture = {
  opponentName: "KVV St-Denijs Sport",
  opponentLogo: null,
  summary: { wins: 3, draws: 1, losses: 2, goalsFor: 10, goalsAgainst: 8 },
  matches: [],
};

// ── Tests ──────────────────────────────────────────────────────────

describe("Canonical URLs on dynamic routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("/nieuws/[slug] includes canonical URL", async () => {
    mockRunPromise.mockResolvedValueOnce(articleFixture);
    const metadata = await nieuwsDetail.generateMetadata({
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
    });
    expect(metadata).toHaveProperty(
      "alternates.canonical",
      `${SITE_CONFIG.siteUrl}/wedstrijd/12345`,
    );
  });
});

describe("Canonical URLs backfilled via buildPageMetadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("static page (/privacy) includes canonical URL", () => {
    const { metadata } = privacy;
    expect(metadata).toHaveProperty(
      "alternates.canonical",
      `${SITE_CONFIG.siteUrl}/privacy`,
    );
  });

  it("/club/[slug] includes canonical URL", async () => {
    mockRunPromise.mockResolvedValueOnce({
      title: "Praktische Informatie",
      metaDescription: null,
      ogImageUrl: null,
      heroImageUrl: null,
      body: [],
    });
    const metadata = await clubSlug.generateMetadata({
      params: Promise.resolve({ slug: "inschrijven" }),
    });
    expect(metadata).toHaveProperty(
      "alternates.canonical",
      `${SITE_CONFIG.siteUrl}/club/inschrijven`,
    );
  });

  it("board page (/club/bestuur) includes canonical URL", async () => {
    mockRunPromise.mockResolvedValueOnce({
      name: "Bestuur",
      tagline: null,
      teamImageUrl: null,
    });
    const metadata = await bestuur.generateMetadata();
    expect(metadata).toHaveProperty(
      "alternates.canonical",
      `${SITE_CONFIG.siteUrl}/club/bestuur`,
    );
  });
});

describe("Static listing canonicals (#2228)", () => {
  it("/ (homepage) canonicalizes to the site root", async () => {
    const metadata = await home.generateMetadata();
    expect(metadata).toHaveProperty(
      "alternates.canonical",
      SITE_CONFIG.siteUrl,
    );
  });

  it("/nieuws canonicalizes to /nieuws, including ?categorie views", async () => {
    const base = await nieuwsIndex.generateMetadata({
      searchParams: Promise.resolve({}),
    });
    expect(base).toHaveProperty(
      "alternates.canonical",
      `${SITE_CONFIG.siteUrl}/nieuws`,
    );
    const filtered = await nieuwsIndex.generateMetadata({
      searchParams: Promise.resolve({ categorie: "Jeugd" }),
    });
    expect(filtered).toHaveProperty(
      "alternates.canonical",
      `${SITE_CONFIG.siteUrl}/nieuws`,
    );
  });
});

describe("Noindex routes do NOT have canonical URLs", () => {
  it("/tegenstander/[clubId] has robots noindex and no canonical", async () => {
    mockRunPromise.mockResolvedValueOnce(opponentFixture);
    const metadata = await tegenstander.generateMetadata({
      params: Promise.resolve({ clubId: "11001" }),
    });
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata).not.toHaveProperty("alternates");
  });

  it("/share has robots noindex and no canonical", () => {
    const { metadata } = share;
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata).not.toHaveProperty("alternates");
  });
});

describe("/tegenstander/[clubId] names the opponent (#2464)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("title names the opponent and is distinct from the /wedstrijd 'vs' title", async () => {
    mockRunPromise.mockResolvedValueOnce(opponentFixture);
    const metadata = await tegenstander.generateMetadata({
      params: Promise.resolve({ clubId: "11001" }),
    });
    expect(metadata.title).toContain(opponentFixture.opponentName);
    expect(metadata.title).not.toBe(
      `KCVV Elewijt vs ${opponentFixture.opponentName}`,
    );
  });

  it("description and openGraph name the opponent, and og:image is the site default", async () => {
    mockRunPromise.mockResolvedValueOnce(opponentFixture);
    const metadata = await tegenstander.generateMetadata({
      params: Promise.resolve({ clubId: "11001" }),
    });
    expect(metadata.description).toContain(opponentFixture.opponentName);
    expect(metadata.openGraph?.title).toContain(opponentFixture.opponentName);
    expect(metadata.openGraph?.description).toContain(
      opponentFixture.opponentName,
    );
    expect(metadata.openGraph?.images).toEqual([DEFAULT_OG_IMAGE]);
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata).not.toHaveProperty("alternates");
  });

  it("a non-numeric clubId returns a not-found title that still carries robots", async () => {
    const metadata = await tegenstander.generateMetadata({
      params: Promise.resolve({ clubId: "not-a-number" }),
    });
    expect(metadata.title).toBeTruthy();
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata).not.toHaveProperty("alternates");
    expect(mockRunPromise).not.toHaveBeenCalled();
  });

  it("an unknown clubId returns a not-found title that still carries robots", async () => {
    mockRunPromise.mockResolvedValueOnce(null);
    const metadata = await tegenstander.generateMetadata({
      params: Promise.resolve({ clubId: "99999" }),
    });
    expect(metadata.title).toBeTruthy();
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata).not.toHaveProperty("alternates");
  });
});
