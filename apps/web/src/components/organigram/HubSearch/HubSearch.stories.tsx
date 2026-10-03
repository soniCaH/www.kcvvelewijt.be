import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { within, userEvent, waitFor, expect } from "storybook/test";
import { useEffect, type ReactNode } from "react";
import { HubSearch } from "./HubSearch";
import {
  HUB_SEARCH_MEMBERS,
  HUB_SEARCH_PATHS,
  HUB_SEARCH_PATHS_FORWARD_PHOTO,
} from "./hub-search.fixture";
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
 * keyword fallback; `"hang"` never answers (the wait holds still), `"once"`
 * answers the first request then hangs (a re-search left in flight), and
 * `"late"` answers after `delayMs` (the answer lands after the member rows).
 */
function SemanticStub({
  results,
  mode = "ok",
  delayMs = 0,
  children,
}: {
  results: SemanticSearchResult[];
  mode?: "ok" | "error" | "hang" | "once" | "late";
  delayMs?: number;
  children: ReactNode;
}) {
  useEffect(() => {
    const original = window.fetch;
    let calls = 0;
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/search")) {
        calls += 1;
        if (mode === "error") return new Response("nope", { status: 503 });
        if (mode === "hang" || (mode === "once" && calls > 1)) {
          // Honour the hook's abort, so a superseded request still ends.
          return new Promise<Response>((_, reject) =>
            init?.signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            ),
          );
        }
        if (mode === "late")
          await new Promise((resolve) => setTimeout(resolve, delayMs));
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
  }, [results, mode, delayMs]);
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
    // The people lane debounces (200ms) and the semantic answer lane debounces
    // + fetches before the dropdown settles. Without waiting, the VR screenshot
    // races the debounce and captures the "Bezig met zoeken…" shimmer instead
    // of the settled results. The `role="status"` region announces the final
    // state ("N resultaten" / "Geen resultaten"), so wait for that.
    await waitFor(
      () => {
        const status = canvas.getByRole("status");
        if (!/resulta(at|ten)/.test(status.textContent ?? "")) {
          throw new Error("HubSearch results not settled");
        }
      },
      { timeout: 5000 },
    );
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

/** Answer-forward whose contact has a photo — the 24px avatar shows it, not a monogram. */
export const AnswerForwardWithPhoto: Story = {
  args: { responsibilityPaths: HUB_SEARCH_PATHS_FORWARD_PHOTO },
  decorators: AnswerForward.decorators,
  play: AnswerForward.play,
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

/**
 * The `nav` results popup opens **below** the box, not over it. The `nav`
 * root is stretched to the bar row's height (#3248); if that root ever
 * becomes a flex container, the absolutely positioned popup's static
 * position moves to the root's top edge and it covers the text being typed.
 * `!vr`: geometry-only.
 */
export const NavPopupOpensBelowTheBox: Story = {
  ...Nav,
  tags: ["!vr"],
  play: async (context) => {
    await typePlay("in")(context);
    const canvas = within(context.canvasElement);
    const box = canvas.getByLabelText(
      "Zoek een persoon of hulpvraag",
    ).parentElement!;
    const popup = canvas.getByTestId("hub-search-popup");
    await expect(popup.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      box.getBoundingClientRect().bottom,
    );
  },
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

/**
 * The answer lane is still loading (#3399): a search is a request the visitor
 * made, so it waits with the scarf, in the slot the answer will land — not a
 * pulse skeleton. The member row that already matched stays on screen and
 * usable. The request never answers, so the capture holds still.
 */
export const Waiting: Story = {
  decorators: [
    (Story) =>
      heroBand(
        <SemanticStub results={[]} mode="hang">
          <Story />
        </SemanticStub>,
      ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Zoek een persoon of hulpvraag");
    await userEvent.click(input);
    await userEvent.type(input, "in");
    const popup = await canvas.findByTestId("hub-search-popup");
    // People lane debounces (200ms); the answer lane never settles.
    await within(popup).findByText("Inge De Wit");
    await expect(
      popup.querySelector(".kcvv-spinner-scarf--primary"),
    ).not.toBeNull();
  },
};

/**
 * Re-search (#3399): the answer lane settled, then the visitor types on. The
 * previous query's answer stays — dimmed to half opacity after a 150 ms delay —
 * with the scarf floating over it, and `aria-busy` on the listbox, until the
 * next answer swaps in at once. The member row that already matches the new
 * query is fresh and stays at full opacity. `play` asserts the busy flag, the
 * settled dim and the floating scarf (computed style: VR cannot see a broken
 * transition); the capture is taken at rest.
 */
export const ReSearching: Story = {
  decorators: [
    (Story) =>
      heroBand(
        <SemanticStub results={[hit("blessure", 0.44)]} mode="once">
          <Story />
        </SemanticStub>,
      ),
  ],
  play: async (context) => {
    await typePlay("in")(context);
    const canvas = within(context.canvasElement);
    await userEvent.type(
      canvas.getByLabelText("Zoek een persoon of hulpvraag"),
      "ge",
    );
    const listbox = await canvas.findByRole("listbox");
    await waitFor(() => expect(listbox).toHaveAttribute("aria-busy", "true"));
    const stale = within(listbox)
      .getByText("Wat moet ik doen bij een blessure?")
      .closest("button") as HTMLElement;
    const fresh = within(listbox)
      .getByText("Inge De Wit")
      .closest("button") as HTMLElement;
    // 150 ms delay + 150 ms fade, then at rest at half opacity.
    await waitFor(() => expect(getComputedStyle(stale).opacity).toBe("0.5"), {
      timeout: 2000,
    });
    await expect(getComputedStyle(fresh).opacity).toBe("1");
    await expect(getComputedStyle(listbox).opacity).toBe("1");
    // The scarf floats over the rows after the same delay and adds no height.
    const popup = canvas.getByTestId("hub-search-popup");
    await waitFor(() =>
      expect(
        popup.querySelector(".kcvv-spinner-scarf--primary"),
      ).not.toBeNull(),
    );
    const float = popup
      .querySelector(".kcvv-spinner-scarf--primary")!
      .closest(".absolute") as HTMLElement;
    await expect(getComputedStyle(float).position).toBe("absolute");
    await expect(listbox.contains(float)).toBe(false);
  },
};

/**
 * The answer-forward card lands after the member rows (#3399). It opens its
 * own room: its wrapper grows from zero to its natural height at the Arrival
 * speed (`500ms`), so the rows slide down instead of jumping. Not baselined:
 * the end state is `AnswerForward`'s, and a screenshot cannot see the
 * transition.
 */
export const LateAnswerCard: Story = {
  tags: ["!vr"],
  decorators: [
    (Story) =>
      heroBand(
        <SemanticStub
          results={[hit("blessure", 0.82)]}
          mode="late"
          delayMs={400}
        >
          <Story />
        </SemanticStub>,
      ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Zoek een persoon of hulpvraag");
    await userEvent.click(input);
    await userEvent.type(input, "in");
    await canvas.findByText("Inge De Wit");
    const card = await canvas.findByText(
      /Lees volledig antwoord/i,
      {},
      { timeout: 5000 },
    );
    const room = card.closest(".grid") as HTMLElement;
    // The VR runner freezes every transition to 0s before `play`, so there is
    // no motion to measure there; `pnpm test:storybook` is where this runs.
    if (navigator.userAgent.includes("StorybookTestRunner")) return;
    // Height is travel: under `prefers-reduced-motion` the room opens at once.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      await expect(getComputedStyle(room).transitionProperty).toBe("none");
      return;
    }
    await expect(getComputedStyle(room).transitionProperty).toBe(
      "grid-template-rows",
    );
    await expect(getComputedStyle(room).transitionDuration).toBe("0.5s");
  },
};
