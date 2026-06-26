/**
 * SearchInterface Storybook Stories
 *
 * SearchInterface orchestrates SearchForm + SearchFilters + SearchResults
 * and manages fetch calls to /api/search. Fetch is mocked per-story.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchInterface } from "./SearchInterface";
import type { SearchResponse } from "@/types/search";
import { fixtureImage } from "@test-fixtures/images";

const meta = {
  title: "Features/Search/SearchInterface",
  component: SearchInterface,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs", "vr"],
} satisfies Meta<typeof SearchInterface>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockResponse: SearchResponse = {
  results: [
    {
      id: "1",
      type: "article",
      title: "KCVV Elewijt wint belangrijke wedstrijd met 3-2",
      description:
        "In een spannende wedstrijd heeft KCVV Elewijt met 3-2 gewonnen van de stadsrivaal.",
      url: "/nieuws/kcvv-elewijt-wint",
      imageUrl: fixtureImage("article-hero-matchverslag", 0),
      tags: ["A-ploeg", "Wedstrijdverslag"],
      date: "2026-01-15T10:00:00Z",
    },
    {
      id: "2",
      type: "article",
      title: "Voorbeschouwing: KCVV thuis tegen Racing Mechelen",
      description:
        "Zaterdag ontvangt KCVV Elewijt Racing Mechelen op eigen veld.",
      url: "/nieuws/voorbeschouwing-racing-mechelen",
      imageUrl: fixtureImage("article-hero-generic", 0),
      tags: ["A-ploeg", "Voorbeschouwing"],
      date: "2026-01-10T08:00:00Z",
    },
    {
      id: "3",
      type: "player",
      title: "Kevin De Smedt",
      description: "Aanvaller — A-ploeg",
      url: "/spelers/kevin-de-smedt",
      imageUrl: fixtureImage("player-portrait-square", 0),
    },
    {
      id: "4",
      type: "player",
      title: "Jonas Van Acker",
      description: "Doelman — A-ploeg",
      url: "/spelers/jonas-van-acker",
      imageUrl: fixtureImage("player-portrait-square", 1),
    },
    {
      id: "5",
      type: "team",
      title: "A-Ploeg",
      description: "Eerste ploeg — Nationale 1",
      url: "/ploegen/a-ploeg",
      imageUrl: fixtureImage("team-group", 0),
    },
  ],
  count: 5,
  query: "KCVV",
};

const mockEmpty: SearchResponse = { results: [], count: 0, query: "xqzptw" };

// Semantic (POST /api/search) response shape — distinct corpus from lexical
// (article/page/responsibility only; never players/teams).
interface SemanticResponse {
  results: Array<{
    id: string;
    slug: string;
    type: "article" | "page" | "responsibility";
    score: number;
    title: string;
    excerpt: string;
  }>;
  answer?: string;
}

const noSemantic: SemanticResponse = { results: [] };

// High-confidence: top score >= 0.5 + an LLM answer -> "Slim antwoord" card.
const smartAnswerResponse: SemanticResponse = {
  answer:
    "Laat je interesse achter via het inschrijvingsformulier — daarna nemen we contact op om samen een plek in de juiste leeftijdsploeg te zoeken. Een definitieve plaats hangt af van de beschikbaarheid per ploeg.",
  results: [
    {
      id: "page-inschrijven",
      slug: "inschrijven",
      type: "page",
      score: 0.74,
      title: "Word lid",
      excerpt: "Praktische informatie om aan te sluiten.",
    },
    {
      id: "page-jeugd",
      slug: "jeugd",
      type: "page",
      score: 0.61,
      title: "Jeugdwerking",
      excerpt: "Onze jeugdvisie en leeftijdsploegen.",
    },
  ],
};

// Mid-confidence: 0.35-0.5, no answer -> "Gerelateerd" links below the results.
const relatedResponse: SemanticResponse = {
  results: [
    {
      id: "page-jeugdvisie",
      slug: "jeugdvisie",
      type: "page",
      score: 0.44,
      title: "Onze jeugdvisie",
      excerpt: "Hoe we ploegen samenstellen.",
    },
    {
      id: "resp-inschrijven",
      slug: "inschrijven",
      type: "responsibility",
      score: 0.4,
      title: "Hoe schrijf ik mijn kind in?",
      excerpt: "De stappen om lid te worden.",
    },
  ],
};

// Method-aware: GET (lexical) -> `lexical`; POST (semantic) -> `semantic`.
function mockFetch(
  lexical: SearchResponse,
  {
    semantic = noSemantic,
    delay = 0,
  }: { semantic?: SemanticResponse; delay?: number } = {},
) {
  const original = globalThis.fetch;
  globalThis.fetch = async (_url: RequestInfo | URL, init?: RequestInit) => {
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    const body = init?.method === "POST" ? semantic : lexical;
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  return () => {
    globalThis.fetch = original;
  };
}

function mockFetchError() {
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response("Internal Server Error", { status: 500 });
  return () => {
    globalThis.fetch = original;
  };
}

function mockFetchPending() {
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Promise(() => {});
  return () => {
    globalThis.fetch = original;
  };
}

// Shared Next.js navigation parameters used by stories that simulate ?q=KCVV.
const SEARCH_NAVIGATION_PARAMS = {
  nextjs: { navigation: { pathname: "/zoeken", query: { q: "KCVV" } } },
};

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/**
 * Initial idle state — no query entered yet.
 * Shows the "Waar ben je naar op zoek?" pre-search card with type hints (8s4).
 */
export const Idle: Story = {
  args: {
    initialQuery: "",
  },
};

/**
 * Active lexical search with results across all content types (no semantic
 * augment — the semantic POST returns no match).
 * URL param `?q=KCVV` triggers a fetch on mount.
 */
export const WithResults: Story = {
  args: {
    initialQuery: "KCVV",
  },
  parameters: SEARCH_NAVIGATION_PARAMS,
  beforeEach() {
    return mockFetch(mockResponse);
  },
};

/**
 * High-confidence semantic answer (8s5 / ZOEK-3): the "Slim antwoord" card
 * renders ABOVE the lexical results.
 */
export const WithSmartAnswer: Story = {
  args: {
    initialQuery: "lid worden",
  },
  parameters: {
    nextjs: {
      navigation: { pathname: "/zoeken", query: { q: "lid worden" } },
    },
  },
  beforeEach() {
    return mockFetch(mockResponse, { semantic: smartAnswerResponse });
  },
};

/**
 * Low-confidence semantic fallback (8s5 / ZOEK-3): the "Gerelateerd" links
 * render BELOW the lexical results (no LLM answer at this score).
 */
export const WithRelated: Story = {
  args: {
    initialQuery: "jeugd",
  },
  parameters: {
    nextjs: {
      navigation: { pathname: "/zoeken", query: { q: "jeugd" } },
    },
  },
  beforeEach() {
    return mockFetch(mockResponse, { semantic: relatedResponse });
  },
};

/**
 * Results filtered to players only via the `type` URL param.
 */
export const FilteredByPlayer: Story = {
  args: {
    initialQuery: "KCVV",
    initialType: "player",
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/zoeken",
        query: { q: "KCVV", type: "player" },
      },
    },
  },
  beforeEach() {
    return mockFetch(mockResponse);
  },
};

/**
 * Valid query but the API returns zero results.
 * Shows the empty state inside SearchResults.
 */
export const NoResults: Story = {
  args: {
    initialQuery: "xqzptw",
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/zoeken",
        query: { q: "xqzptw" },
      },
    },
  },
  beforeEach() {
    return mockFetch(mockEmpty);
  },
};

/**
 * Fetch in progress — spinner is shown, results panel hidden.
 */
export const Loading: Story = {
  args: {
    initialQuery: "KCVV",
  },
  parameters: SEARCH_NAVIGATION_PARAMS,
  beforeEach() {
    // Never resolves — keeps the loading spinner visible
    return mockFetchPending();
  },
};

/**
 * API returns a 500 — displays the inline error message.
 */
export const FetchError: Story = {
  args: {
    initialQuery: "KCVV",
  },
  parameters: SEARCH_NAVIGATION_PARAMS,
  beforeEach() {
    return mockFetchError();
  },
};
