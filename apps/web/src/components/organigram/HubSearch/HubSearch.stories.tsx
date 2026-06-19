import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within, userEvent } from "storybook/test";
import { useEffect, type ReactNode } from "react";
import { HubSearch } from "./HubSearch";
import { HUB_SEARCH_MEMBERS, HUB_SEARCH_PATHS } from "./hub-search.fixture";
import type { SemanticSearchResult } from "@/hooks/useSemanticSearch";

/** A canned semantic hit for a fixture path (slug == path id). */
function hit(slug: string, score: number): SemanticSearchResult {
  return {
    id: slug,
    slug,
    type: "responsibility",
    score,
    title: "",
    excerpt: "",
  };
}

/**
 * Stub `POST /api/search` so the (otherwise backend-dependent) semantic answer
 * lane renders deterministically in Storybook. `mode: "error"` exercises the
 * keyword fallback.
 */
function SemanticStub({
  results,
  mode = "ok",
  children,
}: {
  results: SemanticSearchResult[];
  mode?: "ok" | "error";
  children: ReactNode;
}) {
  useEffect(() => {
    const original = window.fetch;
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/search")) {
        if (mode === "error") return new Response("nope", { status: 503 });
        return new Response(JSON.stringify({ results }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return original(input, init);
    };
    return () => {
      window.fetch = original;
    };
  }, [results, mode]);
  return <>{children}</>;
}

const heroBand = (node: ReactNode) => (
  <div className="bg-jersey-deep-dark p-10">{node}</div>
);

const meta = {
  title: "Features/Organigram/HubSearch",
  component: HubSearch,
  tags: ["autodocs", "vr"],
  args: {
    members: HUB_SEARCH_MEMBERS,
    responsibilityPaths: HUB_SEARCH_PATHS,
    variant: "hero",
    className: "max-w-[480px]",
  },
  parameters: {
    docs: {
      description: {
        component:
          "Unified front-door search for the `/hulp` hub. People lane = keyword/structured; **answer lane = semantic** (bge-m3 + Vectorize via `/api/search`, #2057). A strong top answer (score ≥ 0.5) renders answer-forward with its own CMS summary; on endpoint failure the answer lane falls back to keyword.",
      },
    },
  },
} satisfies Meta<typeof HubSearch>;

export default meta;
type Story = StoryObj<typeof meta>;

const typePlay =
  (text: string): NonNullable<Story["play"]> =>
  async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Zoek een persoon of hulpvraag");
    await userEvent.click(input);
    await userEvent.type(input, text);
  };

/** Hero variant — the prominent box on the dark band it lives in. */
export const Hero: Story = {
  decorators: [(Story) => heroBand(<Story />)],
};

/** Answer-forward — a strong semantic match (≥ 0.5) shows its CMS summary inline. */
export const AnswerForward: Story = {
  decorators: [
    (Story) =>
      heroBand(
        <SemanticStub results={[hit("blessure", 0.82)]}>
          <Story />
        </SemanticStub>,
      ),
  ],
  play: typePlay("mijn kind heeft zich bezeerd"),
};

/** List-only + smart hint — weaker matches (< 0.5) interleave with people. */
export const SmartList: Story = {
  decorators: [
    (Story) =>
      heroBand(
        <SemanticStub results={[hit("inschrijven", 0.44)]}>
          <Story />
        </SemanticStub>,
      ),
  ],
  play: typePlay("in"),
};

/** Keyword fallback — the endpoint errors; the answer lane drops to keyword (no smart hint). */
export const KeywordFallback: Story = {
  decorators: [
    (Story) =>
      heroBand(
        <SemanticStub results={[]} mode="error">
          <Story />
        </SemanticStub>,
      ),
  ],
  play: typePlay("blessure"),
};

/** Compact variant — the repeated search inside the sticky section nav. */
export const Nav: Story = {
  args: { variant: "nav", className: "max-w-[260px]" },
  decorators: [(Story) => <div className="bg-cream-deep p-6">{<Story />}</div>],
};

/** No-match empty state. */
export const NoResults: Story = {
  decorators: [
    (Story) =>
      heroBand(
        <SemanticStub results={[]}>
          <Story />
        </SemanticStub>,
      ),
  ],
  play: typePlay("zzzzz"),
};
