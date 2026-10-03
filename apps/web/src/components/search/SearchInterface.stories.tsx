/**
 * SearchInterface Storybook Stories
 *
 * SearchInterface orchestrates SearchForm + SearchFilters + SearchResults
 * and manages fetch calls to /api/search. Fetch is mocked per-story.
 */

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { SearchInterface } from "./SearchInterface";
import type { SearchResponse } from "@/types/search";
import { fixtureImage } from "@test-fixtures/images";
import { forceSearchFocusRing } from "./search-form-vr-focus";

const meta = {
  title: "Features/Search/SearchInterface",
  component: SearchInterface,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs", "vr"],
  // VR determinism (#3033): every story here renders the nested
  // <SearchForm> (via <SearchMasthead>) under the `vr` tag above, so force
  // its focus-ring to a state the story declares rather than one dependent
  // on the runner's real frame focus, for all of them — not just the one
  // story an earlier pass happened to observe flaking. Composes with any
  // story-level `play` below (Storybook runs the meta-level one first).
  // See search-form-vr-focus.ts.
  play: async ({ canvasElement }) => {
    forceSearchFocusRing(canvasElement);
  },
} satisfies Meta<typeof SearchInterface>;

export default meta;
type Story = StoryObj<typeof meta>;

// The semantic augment lane (POST /api/search, `useSemanticAugment`) settles
// AFTER the lexical GET renders the results, then prepends the "Slim antwoord"
// card (above results) or appends the "Gerelateerd" list (below). Without
// waiting, the VR screenshot races that second render and captures a
// results-only frame — a large top/height diff (flaky, seen on #2282). Wait
// for the settled semantic surface before the runner screenshots.
//
// Since #2824 this also covers the failed-search notice: it now waits for
// the semantic lane to settle too (`augment.kind !== "pending"`), so it can
// stay suppressed if a high-confidence answer is about to arrive — the same
// debounce, same race, same fix (`FetchError` below).
const waitForSemantic =
  (pattern: RegExp): NonNullable<Story["play"]> =>
  async ({ canvasElement }) => {
    await within(canvasElement).findByText(pattern, {}, { timeout: 5000 });
  };

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
    semanticDelay = 0,
  }: {
    semantic?: SemanticResponse;
    delay?: number;
    /** Extra wait on the semantic POST only — the answer lands after the list. */
    semanticDelay?: number;
  } = {},
) {
  const original = globalThis.fetch;
  globalThis.fetch = async (_url: RequestInfo | URL, init?: RequestInit) => {
    const isSemantic = init?.method === "POST";
    const wait = delay + (isSemantic ? semanticDelay : 0);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    const body = isSemantic ? semantic : lexical;
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

// The first lexical GET resolves; every later one never does — a re-search left
// in flight, so the dimmed list and its floating scarf hold still.
function mockFetchFirstThenPending(lexical: SearchResponse) {
  const original = globalThis.fetch;
  let lexicalCalls = 0;
  globalThis.fetch = async (_url: RequestInfo | URL, init?: RequestInit) => {
    if (init?.method === "POST") {
      return new Response(JSON.stringify(noSemantic), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    lexicalCalls += 1;
    if (lexicalCalls > 1) return new Promise<Response>(() => {});
    return new Response(JSON.stringify(lexical), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
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
  play: waitForSemantic(/slim antwoord/i),
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
  play: waitForSemantic(/gerelateerd/i),
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
 *
 * `mockFetchError` fails every fetch regardless of method, so both the
 * lexical GET and the semantic POST 500 — the semantic lane settles to
 * `{ kind: "none" }` (no answer), which is what keeps the notice showing
 * here rather than being suppressed (#2824's `WithSmartAnswer`-shaped
 * suppression case has its own story if one is ever added).
 */
export const FetchError: Story = {
  args: {
    initialQuery: "KCVV",
  },
  parameters: SEARCH_NAVIGATION_PARAMS,
  beforeEach() {
    return mockFetchError();
  },
  // The notice now waits for the semantic lane to settle too (#2824) —
  // without this, the VR runner can screenshot the in-between window where
  // the lexical fetch has already failed but the semantic POST (300ms
  // debounce + its own round trip) hasn't settled yet, capturing neither
  // the notice nor anything else in its place.
  play: waitForSemantic(/mislukt/i),
};

/**
 * Re-search (#3396): the visitor types on while a list is on screen. The old
 * list stays — dimmed to half opacity after a 150 ms delay, `aria-busy` on its
 * region, the scarf floating over it. `play` types onto the query, then asserts
 * the busy flag, the settled dim (computed style, since VR cannot see a broken
 * transition) and the floating scarf; the capture is taken at rest.
 */
export const ReSearching: Story = {
  args: {
    initialQuery: "KCVV",
  },
  parameters: SEARCH_NAVIGATION_PARAMS,
  beforeEach() {
    return mockFetchFirstThenPending(mockResponse);
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const count = await canvas.findByText(
      /resultaten voor/i,
      {},
      { timeout: 5000 },
    );
    // The dimmed, busy wrapper around the list; the scarf floats beside it.
    const region = count.closest("div.space-y-6")!.parentElement as HTMLElement;
    const host = region.parentElement as HTMLElement;

    await userEvent.type(canvas.getByRole("textbox"), " Mechelen{enter}");

    await waitFor(() => expect(region).toHaveAttribute("aria-busy", "true"));
    // Rows stay usable: the old list is still there, links and all.
    await expect(within(region).getAllByRole("link").length).toBeGreaterThan(0);
    // 150 ms delay + 150 ms fade, then at rest at half opacity.
    await waitFor(() => expect(getComputedStyle(region).opacity).toBe("0.5"), {
      timeout: 2000,
    });
    // The scarf floats over the list and adds no height to it. It sits in the
    // undimmed host, not inside the dimmed, busy region.
    const scarf = await within(host).findByRole("status");
    await expect(region.contains(scarf)).toBe(false);
    await expect(getComputedStyle(host).opacity).toBe("1");
    await expect(getComputedStyle(scarf.parentElement!).position).toBe(
      "absolute",
    );
  },
};

/**
 * The answer card lands about a second after the list (#3396). It opens its own
 * room: the card's wrapper grows from zero to its natural height at the Arrival
 * speed (`500ms`), so the list slides down instead of jumping. `play` watches
 * the list move. Not baselined: the end state is `WithSmartAnswer`'s, and a
 * screenshot cannot see the transition.
 */
export const LateAnswerCard: Story = {
  args: {
    initialQuery: "lid worden",
  },
  parameters: {
    // vr.disable: the end state is WithSmartAnswer's baseline; the story exists to time a transition VR freezes
    // Repro: capture it and diff against WithSmartAnswer — same frame, a duplicate baseline that proves nothing
    // Approved by: @soniCaH / https://github.com/soniCaH/www.kcvvelewijt.be/pull/3407
    // Re-evaluate: 2027-04-03
    vr: { disable: true },
    nextjs: {
      navigation: { pathname: "/zoeken", query: { q: "lid worden" } },
    },
  },
  beforeEach() {
    return mockFetch(mockResponse, {
      semantic: smartAnswerResponse,
      semanticDelay: 100,
    });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const count = await canvas.findByText(
      /resultaten voor/i,
      {},
      { timeout: 5000 },
    );
    const card = await canvas.findByText(
      /slim antwoord/i,
      {},
      { timeout: 5000 },
    );
    const room = card.closest("[class*='grid-rows-']") as HTMLElement;

    // The page's 32px gap is spent inside the room, so it grows with it
    // instead of snapping in at the first frame.
    await expect(getComputedStyle(room).marginBottom).toBe("0px");

    // The VR runner freezes every transition to 0s before `play` (its
    // determinism stylesheet, `.storybook/test-runner.ts`), so there is no
    // motion to measure there; `pnpm test:storybook` is where this runs.
    if (navigator.userAgent.includes("StorybookTestRunner")) return;
    // Height is travel: under `prefers-reduced-motion` the room opens at once.
    // Otherwise the transition names the property it animates, at the Arrival
    // speed, and the list slides down by the card's height.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      await expect(getComputedStyle(room).transitionProperty).toBe("none");
      return;
    }
    await expect(getComputedStyle(room).transitionProperty).toBe(
      "grid-template-rows",
    );
    await expect(getComputedStyle(room).transitionDuration).toBe("0.5s");
    const before = count.getBoundingClientRect().top;
    await new Promise((resolve) => setTimeout(resolve, 550));
    const after = count.getBoundingClientRect().top;
    await expect(after - before).toBeGreaterThan(100);
  },
};
