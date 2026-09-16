import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { EmptyState } from "./EmptyState";

/**
 * #2427 / #2562 — one primitive, two tiers. State-coverage: tier-1 genuine
 * (the null path — default artefact, no undo), tier-1 filter-empty (with
 * the mandatory undo), tier-1's two non-default `surface` values, tier-1's
 * accented failure heading (`emphasis`, #2815), tier-2's held-open register,
 * tier-2's `reason="unavailable"` failure register (#2469/#2576), and
 * tier-2's failure notice with a retry `action` (#2815). `vr`-tagged so
 * every state acquires VR baselines per the master-design VR contract —
 * `surface="inverse"` exists specifically to fix a shadow that was invisible
 * on a dark ground, so it needs its own baseline or a future token change
 * could silently undo the fix (#2562 review round 4).
 *
 * No dedicated "custom artefact" story: every current call site that has
 * its own obvious mark (a crest, a ball) either doesn't exist yet or was
 * migrated without one (`/tegenstander` ships the default jersey) — a
 * story with nothing exercising it would ship three VR baselines nobody
 * reads (#2562 review round 3, D5). Pass `artefact` at the call site that
 * earns one; `EmptyState.test.tsx` covers the slot mechanically.
 */
const meta = {
  title: "UI/EmptyState",
  component: EmptyState,
  tags: ["autodocs", "vr"],
  parameters: { layout: "padded" },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Controls baseline, and tier 1's null path in one: nothing has arrived
 * yet, no custom artefact, no undo. "Nog geen" because sponsors can still
 * arrive.
 */
export const Playground: Story = {
  name: "Tier 1 — genuine (null path)",
  args: {
    tier: "surface",
    heading: "Nog geen sponsors",
    children:
      "We zoeken partners die mee de plezantste compagnie willen dragen — jouw zaak kan de eerste langs de lijn zijn.",
  },
};

/**
 * Tier 1, a filter emptied the surface — names the active facet back to the
 * reader and offers the mandatory undo right where the results would have
 * been. `reason: "filtered"` makes `undo` a compile-time requirement, not a
 * convention.
 */
export const SurfaceFilterEmpty: Story = {
  name: "Tier 1 — filter-empty (with undo)",
  args: {
    tier: "surface",
    heading: "Geen artikelen in Jeugd",
    reason: "filtered",
    // analyticsSource/analyticsFacet: an inert data-* payload for the
    // global analytics listener (#2719) — no visual effect, so this does
    // not touch the VR baseline.
    undo: {
      label: "Toon alles",
      onClick: fn(),
      analyticsSource: "nieuws",
      analyticsFacet: "Jeugd",
    },
    children: "Er zijn geen artikelen in deze categorie.",
  },
};

/**
 * Tier 1, a failed fetch (`/zoeken`'s "Zoeken mislukt" card) — `emphasis`
 * (#2815) moves the accent off the auto-appended trailing period and onto
 * the failure word instead. No `undo`: the search form above already
 * survives with the query intact, so a second retry action here would be
 * redundant chrome (#2470 resolution rule 4) — this is still the pending
 * (reason-omitted) variant, just with a non-default `emphasis`.
 */
export const SurfaceFailureHeading: Story = {
  name: "Tier 1 — failure heading (accented failure word)",
  args: {
    tier: "surface",
    heading: "Zoeken mislukt",
    emphasis: { text: "mislukt" },
    live: "assertive",
    children: "Er ging iets mis bij het zoeken — probeer opnieuw.",
  },
};

/**
 * Tier 1, `surface="bare"` — no card frame at all, for a host already
 * inside another bordered/shadowed panel (`CalendarWidget`,
 * `ScheurkalenderPage`). Wrapped in a stand-in panel here so the baseline
 * shows what the prop exists to avoid: two nested ink borders with a
 * shadow between them.
 */
export const SurfaceBare: Story = {
  name: "Tier 1 — surface: bare (nested panel)",
  args: {
    tier: "surface",
    heading: "Nog geen wedstrijden of evenementen gepland",
    surface: "bare",
    children:
      "Zodra er een wedstrijd of evenement gepland wordt, verschijnt het hier.",
  },
  decorators: [
    (Story) => (
      <div className="border-ink bg-cream shadow-paper-md border-2 p-4">
        <Story />
      </div>
    ),
  ],
};

/**
 * Tier 1, `surface="inverse"` — the paper frame with the muted "soft"
 * shadow instead of the hard one, for a host on an ink/dark-green ground
 * (`/evenementen`'s `bg-jersey-deep-dark`). The default hard shadow is
 * invisible there — this baseline is the regression cover for that fix.
 */
export const SurfaceInverse: Story = {
  name: "Tier 1 — surface: inverse (dark ground)",
  args: {
    tier: "surface",
    heading: "Nog geen evenementen gepland",
    surface: "inverse",
    children: "Kom snel terug voor het volgende evenement.",
  },
  decorators: [
    (Story) => (
      <div className="bg-jersey-deep-dark p-6">
        <Story />
      </div>
    ),
  ],
};

/**
 * Tier 2 — one slot is empty inside an otherwise full page. A dashed box
 * holding the slot's shape; no heading, no action, ever.
 */
export const Slot: Story = {
  name: "Tier 2 — held-open slot",
  args: {
    tier: "slot",
    children: "Geen opstelling beschikbaar",
  },
};

/**
 * Tier 2, `background="cream-soft"` — a solid-ink border on a `cream-soft`
 * fill, for a slot standing alone on the page rather than inside an
 * already-framed surface (`<CompetitiveStatusLine>`, #2636 finding 12).
 */
export const SlotCreamSoft: Story = {
  name: "Tier 2 — cream-soft background",
  args: {
    tier: "slot",
    background: "cream-soft",
    children: "De kalender voor dit seizoen is nog niet bekendgemaakt.",
  },
};

/**
 * Tier 2, `reason="unavailable"` (#2469/#2576) — a failure notice, not the
 * held-open register: a sentence in the section's own body copy, with a
 * display-italic accent on the words that failed, not the subject (#2469
 * resolution rule 3). Fixed `border-ink/30` dashed frame — the cream case
 * is the only one wired here; a dark-ground register is #2402's job
 * (parked via #2690/#2804 — see `EmptyState.tsx`'s file docblock).
 */
export const SlotNotice: Story = {
  name: "Tier 2 — failure notice",
  args: {
    tier: "slot",
    reason: "unavailable",
    emphasis: { text: "even niet beschikbaar" },
    children:
      "Het klassement is even niet beschikbaar. Probeer het later opnieuw.",
  },
};

/**
 * Tier 2, `reason="unavailable"` with an optional retry `action` (#2815) —
 * the register `<LoadMoreFooter>`'s failed-batch retry now renders through,
 * in place of its old bespoke `<p>` + ghost button. The same fixed dashed
 * frame as the plain notice above; the retry sits below the sentence.
 */
export const SlotNoticeWithAction: Story = {
  name: "Tier 2 — failure notice with action",
  args: {
    tier: "slot",
    reason: "unavailable",
    emphasis: { text: "mislukt" },
    action: { label: "Probeer opnieuw", onClick: fn() },
    children: "Artikelen laden mislukt.",
  },
};
