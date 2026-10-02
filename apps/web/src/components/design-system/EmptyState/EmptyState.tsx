/**
 * <EmptyState> — shared "nothing to show" primitive, two tiers (#2427 / #2562).
 *
 * A surface with nothing to show says so in exactly two registers, chosen by
 * how much of the page is missing:
 *
 * - **Tier "surface"** — the whole surface is empty (`/sponsors`, `/galerij`,
 *   `/zoeken`, a filtered `/nieuws`). The `SearchNoResultsCard` register: a
 *   cream-soft paper card taped at its top border, an artefact (a defaulting
 *   slot — pass nothing and it ships the jersey), a display heading, a body line, and — only when
 *   `reason: "filtered"` — the mandatory undo (#2427 rule 4). That case is
 *   structural, not conventional: `undo` is a required field on that variant,
 *   the same way tier "slot" has no `heading`/`artefact` prop at all rather
 *   than trusting every host to remember one. `undo.analyticsSource`/
 *   `analyticsFacet` are required alongside `label`/`onClick`, rendered as
 *   inert `data-*` attributes a single global click listener reads — see
 *   `EmptyStateAction` below for why the analytics fields live there.
 *   `emphasis` (#2815) accents a substring of `heading` — an **optional**
 *   prop, defaulting to `{ text: "." }` so every call site that doesn't pass
 *   one keeps accenting the auto-appended trailing period exactly as before.
 *   `/zoeken`'s failure card is the one caller that overrides it, to accent
 *   the failure word ("Zoeken **mislukt**.") instead of the period. This is
 *   not a new `reason` value — the admission rule below is unchanged;
 *   `emphasis` forces nothing, so it was never a candidate for a `reason`
 *   discriminant in the first place.
 * - **Tier "slot"** — one slot is empty inside an otherwise full page (a
 *   `MatchLineup` team column, a `MatchEvents` team list). A dashed box that
 *   holds the slot's shape so the absence reads as a known gap rather than a
 *   render failure — `border-ink-muted` by default (`background:
 *   "transparent"`), or `border-ink` on a `cream-soft` fill
 *   (`background: "cream-soft"`) for a slot standing alone on the page
 *   rather than inside an already-framed surface (`<CompetitiveStatusLine>`,
 *   #2636). No heading, ever — the type system has no `heading`/`artefact`
 *   prop on this tier. The held-open member additionally has no action;
 *   its sibling failure-notice member below may carry one (#2815).
 *   `flex-1` by default so it fills a `flex flex-col` host column's
 *   grid-stretched height instead of collapsing to one line — the host
 *   still owns making that column `flex flex-col` in the first place; the
 *   primitive cannot reach outside itself to do that part.
 *
 *   `reason: "unavailable"` (#2469/#2576) swaps that held-open register for
 *   a **failure notice**: a sentence in the section's own body copy instead
 *   of a short mono label, still tier "slot" — "not a new primitive… it is
 *   #2427's Tier 2 carrying different copy" (#2469 resolution rule 5). Named
 *   `reason` (not a bespoke `variant`) to match tier "surface"'s own
 *   discriminant, and the literal `"unavailable"` to match the vocabulary
 *   every neighbouring permanently-failed-PSD-read case already uses
 *   (`<CompetitiveStatusLine variant="unavailable">`,
 *   `/ploegen/[slug]/page.tsx`'s literal `"unavailable"` return). This is its
 *   own tier-"slot" discriminant, not a value tier "surface"'s `reason` ever
 *   admits — #2690 considered and rejected widening tier "surface" to reach
 *   it (see the admission rule below), so the two tiers keep naming this one
 *   failure state independently rather than sharing one wire value. Frame is
 *   fixed at `border-2 border-dashed border-ink/30` (rule 6 — the
 *   already-precedented dashed value on cream, `tegenstander/[clubId]/
 *   loading.tsx:65`), text `text-ink text-body-md` matching
 *   `<ErrorState>`'s own body line. `background` is not accepted on this
 *   member (`never`, mirroring `_internal/stateAction.ts`'s
 *   `href?: never`/`onClick?: never` mutual exclusion) — a notice's frame is
 *   not configurable, since only the cream case is in scope here; the
 *   dark-ground held-open frame is `HELD_OPEN_FRAME`, decided by #3103 (see
 *   below). `emphasis` accents the failure itself, not the subject (rule 3)
 *   — see below. `action` (#2815)
 *   is an **optional** retry button, mirroring the shape tier "surface"'s
 *   `EmptyStateAction` uses for its undo minus the undo-only analytics
 *   fields (`EmptyStateSlotNoticeAction` below) — added so `<LoadMoreFooter>`
 *   can render its failed-batch retry through this primitive instead of a
 *   bespoke `<p>` + ghost button, the "Tier 2 + action" register #2470's
 *   copy table asked for from the start. The held-open member above still
 *   has no action prop at all.
 *
 * **The failure register now carries both an accent and an action
 * (#2815).** Tier "surface" gained an optional `emphasis` (default `{ text:
 * "." }`) and tier "slot"'s notice member gained an optional `action` —
 * two additive, optional props, not a widened `reason`. Neither forces a
 * companion prop, so neither was ever a candidate for the admission rule
 * below; its table is unchanged.
 *
 * **The `reason` admission rule (#2690/#2804).** A `reason` value exists
 * ONLY to make a companion prop compiler-required. It is never a label for
 * copy. Tier "surface"'s `reason` stays exactly one value, `reason?:
 * "filtered"` — it does not grow to `pending | filtered | query |
 * unavailable`. Five candidates, one admitted:
 *
 * | Value           | Verdict                                                                                                                                                                                             |
 * | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
 * | `filtered`        | **admitted** — forces `undo` + `analyticsSource` + `analyticsFacet`                                                                                                                              |
 * | `query`           | **refused** — `SearchNoResultsCardProps.query` is already required at the owning boundary; adding `subject` to the primitive duplicates that guarantee for one caller. `HubSearch` is permanently excluded (#2427), so no second caller is coming |
 * | `pending`         | **refused** — forces nothing; it is today's default                                                                                                                                              |
 * | `unavailable`     | **refused** — forces nothing, and its only caller is `tier="slot"`, which has no `heading`/`artefact`/`undo` prop to force                                                                       |
 * | a failure value   | **refused** — #2470's resolution: "This ticket adds no new API to `<EmptyState>`." #2469's one new API (the accented substring) lands in #2576                                                  |
 *
 * (Quoted from #2804's own table — do not re-derive these reasons.)
 *
 * **The copy is the tell.** Both tiers share one visual register; only the
 * words distinguish genuine emptiness ("Nog geen …") from a filter that
 * emptied the surface ("Geen … in <facet>.", with the undo) from a fruitless
 * query (naming what was searched for) from a failure notice (tier "slot",
 * `reason: "unavailable"`). See the resolution comment on #2427 for the five
 * copy rules this primitive exists to carry, and #2469's resolution for the
 * failure-notice rules specifically.
 *
 * **Decided: the dark-ground answer is `HELD_OPEN_FRAME`, not this tier
 * (#3103).** Tier "slot" is ink-only (`SLOT_BACKGROUND_CLASS` below:
 * `border-ink-muted` / `border-ink bg-cream-soft`) — both wrong on a
 * dark-green band, and that stays true by design. Tier "surface" already
 * solved its own version via `surface="inverse"` (#2562); tier "slot" does
 * not grow a matching dark axis. Two places hand-roll the dark-ground
 * held-open frame instead: `FirstTeamsBlock`, on the homepage's
 * `jersey-deep-dark` band (see its `HELD_OPEN_FRAME` docblock in
 * `FirstTeamsBlock.tsx`), and `FeaturedEventBand`, on the homepage's
 * `jersey-deep` band (see `FeaturedEventUnavailableNotice`'s docblock in
 * `FeaturedEventBand.tsx`, #2944) — the second import of `FirstTeamsBlock`'s
 * own exported `HELD_OPEN_FRAME`, not a second hand-copy of the value:
 * "two consumers is the primitive's own signal to exist" (review finding on
 * #2944), read there as a signal for the constant, not for this tier —
 * #3103 overrode the open question by deciding tier "slot" keeps no dark
 * axis of its own; a `tier="slot"` dark variant on a component with ~13
 * callers, shaped for two, is exactly the speculative API #2690 itself
 * refused. Carry `HELD_OPEN_FRAME` (`@/components/home/FirstTeamsBlock`)
 * verbatim when reaching for the dark-ground held-open frame; the two
 * files' own text tones (`SkipCard` `text-cream-quiet`, band note
 * `text-cream`, #2551) stay per-file. Reopen only if a dark consumer appears
 * off the homepage.
 *
 * **Not every failure notice on cream goes through this register.**
 * `<CompetitiveStatusLine>` (#2540/#2636) is a deliberate non-adopter: its
 * one sentence stands in for *two* sections at once (`/ploegen/[slug]`'s
 * klassement + wedstrijden), so it stays a plain `<MonoLabel tone="muted">`
 * in the held-open frame rather than this notice's body-copy sentence — a
 * single chip can't honestly name either region below it (#2576's own
 * resolution comment). A future third failure-notice site should default to
 * this register and re-open that exception deliberately, not assume
 * `<CompetitiveStatusLine>`'s shape is the norm.
 *
 * **A homepage band that acknowledges a remote feed holds its shape and
 * names the reason on a failed read (#2399/#2505/#2844).** A visitor
 * watching such a band go empty can't otherwise tell a stalled read from a
 * feed that's genuinely gone quiet, so the band says which one happened
 * instead of just going dark. `<FirstTeamsBlock>` holds that shape on every
 * zero-row cause, not only a failure, and hand-rolls the dark-ground
 * held-open frame instead of adopting this register (see the decision
 * above); `<UpcomingMatches>` reaches this exact register (`tier="slot"`,
 * `reason="unavailable"`), and only on a failed read — a genuinely empty
 * feed still drops it silently.
 *
 * **`<FeaturedEventBand>` is not the auto-hide counter-example this rule
 * was once believed to have (#2944, fixed).** Its query
 * (`NEXT_FEATURED_EVENT_QUERY`, `event.repository.ts`) is a `coalesce()` of
 * a `featuredOnHome`-preferred branch and a second, unfiltered "any upcoming
 * event" branch — so the flag is a *preference*, not a gate, and the band is
 * normally populated the same way `<UpcomingMatches>` is, not "one optional,
 * editorially-gated document." `(landing)/page.tsx` now degrades a failed
 * read to a sentinel distinct from the genuinely-empty `null`
 * (`FEATURED_EVENT_READ_FAILED`), and passes that apart as `unavailable` —
 * the band holds its shape and names the reason on a failed read, exactly
 * this rule's shape, and still drops silently on a genuinely empty calendar.
 * It reaches that held-open frame through its own dark-ground notice
 * rather than through `<EmptyState tier="slot" reason="unavailable">`
 * itself — that member is ink-only by decision (see above) and this band's
 * `bg-jersey-deep` ground is exactly the dark-ground case `HELD_OPEN_FRAME`
 * answers instead; `<FeaturedEventBand>`'s own file carries the reasoning.
 *
 * The artefact is never `<TapedCard>` — that primitive has no frameless
 * (`shadow: "none"`) or transparent-`bg` option today, and this slot needs
 * both (a bare `<JerseyShirt>`, not a second nested card). Add those options
 * to `<TapedCard>` before reaching for a third way to frame an artefact.
 *
 * The tier-"surface" frame itself is `<TapedCard>` open-coded, for one
 * reason: `<TapedCard>` forwards `data-*` but not `role`, and `live` here
 * needs a `role` of its own (`"status"` or `"alert"` — see `liveRegionProps`
 * below). It still anchors its tape the way `<TapedCard>` does — one strip,
 * direct child of the frame, on the frame's own border.
 *
 * Sits beside `<ErrorState>` — same job at a different severity, same
 * folder. `EmptyStateAction` shares its base shape with `ErrorStateAction`
 * via `_internal/stateAction.ts`; see that file for why the two components'
 * action *rows* stay separate rather than one shared render component.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type { EmptyStateUndoSource } from "@/lib/analytics/empty-state-undo-attrs";
import { Button } from "../Button";
import {
  EditorialHeading,
  type EditorialHeadingLevel,
} from "../EditorialHeading";
import { JerseyShirt } from "../JerseyShirt";
import { MonoLabel } from "../MonoLabel";
import { TapeStrip } from "../TapeStrip";
import { AccentEm, splitOnAccent } from "../_internal/accent";
import type { StateActionBase } from "../_internal/stateAction";

/**
 * An undo action — always a button (a filter reset never navigates).
 *
 * `analyticsSource`/`analyticsFacet` are mandatory alongside `label`/
 * `onClick`: rendered as inert `data-empty-state-undo-source`/`-facet`
 * attributes (mirroring `<ErrorState>`'s `data-error-action`,
 * `ErrorState.tsx:92` — though there `analyticsAction` stays optional and a
 * plain `string`, since `<ErrorState>`'s action row isn't undo-only and its
 * wrapper is page-scoped, not a single global listener) for one global click
 * listener to read — never imported into or consumed by this component.
 * They live on the action, not as flat sibling props on `<EmptyState>`,
 * because `EmptyStateAction` is only ever reached via `undo` — a variant
 * with no `undo` has nothing to forbid.
 *
 * `EmptyStateUndoSource`'s own type — the closed set of hosts — lives in
 * `@/lib/analytics/empty-state-undo-attrs` (a GA4 vocabulary, not a
 * design-system shape), imported here as a type only so this file still
 * imports nothing from `@/components/analytics` at runtime.
 */
export interface EmptyStateAction extends StateActionBase {
  onClick: () => void;
  analyticsSource: EmptyStateUndoSource;
  analyticsFacet: string;
}

/**
 * Chrome the tier-"surface" card draws around itself.
 *
 * - `"paper"` (default) — the full paper frame: border, hard shadow,
 *   cream-soft fill. The standalone register (`/sponsors`, `/galerij`, …).
 * - `"bare"` — no frame at all, for a host that already sits inside another
 *   bordered/shadowed panel (`CalendarWidget`'s own shell, the
 *   `ScheurkalenderPage` poster sheet). Framing twice nests two ink borders
 *   with a shadow between them.
 * - `"inverse"` — the paper frame with the muted-ink "soft" shadow instead
 *   of the hard one, for a host on an ink or dark-green ground (`/evenementen`
 *   on `bg-jersey-deep-dark`). The hard shadow is drawn in solid ink and the
 *   dark field swallows it — DESIGN.md's rule that chrome on a dark ground
 *   takes the soft shadow, not the hard paper one.
 */
export type EmptyStateSurface = "paper" | "bare" | "inverse";

const SURFACE_CLASS: Record<EmptyStateSurface, string> = {
  paper: "border-ink bg-cream-soft shadow-paper-sm border-2 p-7 sm:p-8",
  bare: "py-2",
  inverse: "border-ink bg-cream-soft shadow-paper-sm-soft border-2 p-7 sm:p-8",
};

interface EmptyStateSharedProps {
  /**
   * Renders a live region so assistive tech announces a client-side change.
   * `true` — `role="status"` (polite): a filter emptying the surface, or a
   * slot going empty after a client change nobody needs alarmed about.
   * `"assertive"` — `role="alert"` + `aria-live="assertive"`: a failure
   * answering an action the visitor just took (a submit, a search) needs an
   * immediate announcement, the same urgency `<Alert variant="error">` and a
   * bare `role="alert" aria-live="assertive"` paragraph already carried
   * before this primitive replaced them. Omit for an empty state already
   * present on first render.
   *
   * At tier "slot"'s failure-notice member (`reason: "unavailable"`), `true`
   * is upgraded to `"assertive"` automatically — that member is *always* a
   * failure, so the discriminant is `reason`, not "did the visitor click
   * something" (measured across all 24 `<EmptyState>` call sites in the app:
   * several filter-click sites are visitor-initiated yet correctly polite —
   * the 1:1 correlation is failure vs. emptiness, not who triggered it).
   * Pass `"assertive"` explicitly only where the tier has no failure
   * discriminant to derive it from (tier "surface" — see `SearchInterface`'s
   * "Zoeken mislukt"). #2815 gave tier "surface" an optional `emphasis` for
   * the accent, but deliberately did not give it a failure discriminant to
   * derive `live` from (that would have meant widening `reason` — see the
   * admission rule below), so this stays explicit at that call site.
   */
  live?: boolean | "assertive";
  className?: string;
}

interface EmptyStateSurfaceCommonProps extends EmptyStateSharedProps {
  tier: "surface";
  /** Heading. Auto-terminated with a period by `<EditorialHeading>`, and
   *  accented per `emphasis` below (defaulting to the trailing period) —
   *  the `SponsorEmptyState` / `SearchNoResultsCard` convention. */
  heading: string;
  /** Rendered heading tag, for a page that already has an adjacent `<h2>`
   *  this heading would otherwise collide with. Default `"h2"`, matching
   *  `<SectionHeader>`'s own `as` prop. */
  as?: "h1" | "h2" | "h3";
  /** Body copy. May embed inline `<Link>`s directly (the way-forward idiom
   *  used by `SearchNoResultsCard` and `HulpFinder`). */
  children: ReactNode;
  /**
   * The artefact beside the copy. A **defaulting slot**, not a hardcoded
   * image — omit it and the primitive ships a `<JerseyShirt>`. A surface with
   * its own obvious mark (a crest, a ball) can pass one without touching
   * this component.
   */
  artefact?: ReactNode;
  surface?: EmptyStateSurface;
  /**
   * Accented substring of `heading` (post period-termination), forwarded to
   * `<EditorialHeading>`. Optional (#2815) — omit it and every existing call
   * site ships byte-identical output: the accent lands on the
   * auto-appended trailing period, same as before this prop existed. Pass
   * your own to move the accent onto the words that actually matter, e.g.
   * `/zoeken`'s failure card accenting "mislukt" instead of the period.
   * @default { text: "." }
   */
  emphasis?: EmptyStateEmphasis;
}

/** Genuine emptiness or a fruitless query — nothing to undo. */
export interface EmptyStateSurfacePendingProps extends EmptyStateSurfaceCommonProps {
  reason?: undefined;
}

/** A filter emptied the surface — the undo is mandatory, structurally: this
 *  variant does not compile without one, including its analytics payload
 *  (see `EmptyStateAction` above). "Right where the results would have
 *  been" (#2427 rule 4). */
export interface EmptyStateSurfaceFilteredProps extends EmptyStateSurfaceCommonProps {
  reason: "filtered";
  undo: EmptyStateAction;
}

export type EmptyStateSurfaceProps =
  EmptyStateSurfacePendingProps | EmptyStateSurfaceFilteredProps;

/**
 * Tier-"slot" background, the same idea as tier-"surface"'s `surface` prop:
 * - `"transparent"` (default) — the original held-open gap: `ink-muted`
 *   border, no fill. Every existing consumer (`MatchLineup`, `MatchEvents`,
 *   `CalendarMonth`) gets this without asking for it, so none of their
 *   baselines move.
 * - `"cream-soft"` — a solid-ink border on a `cream-soft` fill, for a slot
 *   that stands alone on the page rather than sitting inside an
 *   already-framed surface (`<CompetitiveStatusLine>`, #2636). Recolours the
 *   same primitive instead of a host overriding its border/fill classes from
 *   outside.
 */
export type EmptyStateSlotBackground = "transparent" | "cream-soft";

const SLOT_BACKGROUND_CLASS: Record<EmptyStateSlotBackground, string> = {
  transparent: "border-ink-muted",
  "cream-soft": "border-ink bg-cream-soft",
};

/** Held-open register — the original tier "slot" (#2427/#2562). */
export interface EmptyStateSlotHeldOpenProps extends EmptyStateSharedProps {
  tier: "slot";
  reason?: undefined;
  /** The held-open label — short, mono, uppercase. No heading, no action —
   *  unlike its sibling failure-notice member below, this one never grows
   *  one (#2815). */
  children: ReactNode;
  /** @default "transparent" */
  background?: EmptyStateSlotBackground;
  /** Not accepted on the held-open register — `never` rather than omitting
   *  the field, the same mutual-exclusion trick the notice member's own
   *  `background?: never` uses below: a bare TS union's excess-property
   *  check does not flag a property that exists on a SIBLING member, so
   *  without this, `<EmptyState tier="slot" action={{…}}>` silently drops
   *  the action instead of failing to compile (#2815 review finding 1). */
  action?: never;
}

/**
 * Accented substring within a heading (tier "surface") or a
 * `EmptyStateSlotNoticeProps.children` sentence (tier "slot") — mirrors
 * `<EditorialHeading>`'s `emphasis={{ text }}` (#2469 resolution rule 5)
 * rather than inventing a second shape. Shared by both tiers since #2815
 * gave tier "surface" its own optional `emphasis` prop. No `tone`/
 * `highlight`: the highlighter sweep is this site's *celebratory* register,
 * wrong on an outage (rule 2), and a dark-ground tone is `HELD_OPEN_FRAME`'s
 * job, decided by #3103 (see the file docblock above), not wired here.
 */
export interface EmptyStateEmphasis {
  text: string;
}

/**
 * The failure notice's optional retry (#2815) — a plain button action,
 * mirroring `EmptyStateAction`'s shape (`label` + `onClick`, extending the
 * same `StateActionBase`) minus its undo-only analytics fields:
 * `analyticsSource`/`analyticsFacet` are `EmptyStateUndoSource`'s closed
 * GA4 vocabulary for a filter's undo specifically — a load-more retry is
 * not an undo and has no home there, so this member stays a plain button.
 * Added so `<LoadMoreFooter>` can render its failed-batch retry through
 * this primitive instead of a bespoke `<p>` + ghost button — the
 * "Tier 2 + action" register #2470's copy table asked for from the start.
 */
export interface EmptyStateSlotNoticeAction extends StateActionBase {
  onClick: () => void;
}

/**
 * A failure notice (#2469/#2576) — a sentence in the section's own body
 * copy, with an accented substring on the words that failed, not the
 * subject (#2469 resolution rule 3, e.g. *"Het klassement is `even niet
 * beschikbaar`."*). Still tier "slot": no heading, ever — but unlike the
 * held-open member above, it may carry a single optional retry `action`
 * (#2815).
 */
export interface EmptyStateSlotNoticeProps extends EmptyStateSharedProps {
  tier: "slot";
  reason: "unavailable";
  /** The full sentence. Must contain `emphasis.text` verbatim once — a
   *  dev-only console warning fires otherwise, mirroring
   *  `<EditorialHeading>`'s own `emphasis.text`-not-found warning. */
  children: string;
  emphasis: EmptyStateEmphasis;
  /** Optional retry button, rendered below the sentence (#2815). Omit it
   *  for the original action-less notice every existing call site still
   *  gets. */
  action?: EmptyStateSlotNoticeAction;
  /** Not accepted on the notice register (#2576 review finding 5) — `never`
   *  rather than omitting the field, the same mutual-exclusion trick
   *  `_internal/stateAction.ts`'s `href?: never`/`onClick?: never` uses, so
   *  passing it is a compile error instead of a silently-ignored prop (a
   *  bare TS union's excess-property check does not flag a property that
   *  exists on a SIBLING member, even when it doesn't belong on the member
   *  actually matched). */
  background?: never;
}

export type EmptyStateSlotProps =
  EmptyStateSlotHeldOpenProps | EmptyStateSlotNoticeProps;

export type EmptyStateProps = EmptyStateSurfaceProps | EmptyStateSlotProps;

/** `live` → the ARIA live-region attributes shared by all three renderers —
 *  one place to keep `"assertive"`'s `role="alert"` + `aria-live="assertive"`
 *  pair in sync with plain `true`'s `role="status"` (implicitly polite). */
function liveRegionProps(live: boolean | "assertive" | undefined): {
  role?: "alert" | "status";
  "aria-live"?: "assertive";
} {
  if (live === "assertive") return { role: "alert", "aria-live": "assertive" };
  if (live) return { role: "status" };
  return {};
}

function headingLevelFor(
  as: EmptyStateSurfaceProps["as"],
): EditorialHeadingLevel {
  switch (as) {
    case "h1":
      return 1;
    case "h3":
      return 3;
    case "h2":
    case undefined:
      return 2;
    default: {
      // Exhaustiveness check, mirroring <SectionHeader>'s headingLevelFor.
      const _exhaustive: never = as;
      throw new Error(`headingLevelFor: unhandled value ${_exhaustive}`);
    }
  }
}

function SlotNoticeEmptyState({
  children,
  emphasis,
  action,
  live,
  className,
}: EmptyStateSlotNoticeProps) {
  // `emphasis` and `children` are both mandatory in the type, but Storybook's
  // autogenerated `autodocs` controls can still flip this member's discriminant
  // at runtime on a story built for a sibling member — a tier-2 story with no
  // `emphasis` control would otherwise throw on `emphasis.text` instead of
  // rendering the plain sentence (#2576 review finding 4).
  const split =
    emphasis && children ? splitOnAccent(children, emphasis.text) : null;
  if (
    !split &&
    emphasis &&
    children &&
    process.env.NODE_ENV === "development"
  ) {
    console.warn(
      `[EmptyState] emphasis.text "${emphasis.text}" not found in notice children "${children}"`,
    );
  }
  const sentence = split ? (
    <>
      {split.before}
      <span className="text-[1.09em]">
        <AccentEm tone="jersey-deep">{split.match}</AccentEm>
      </span>
      {split.after}
    </>
  ) : (
    children
  );
  // This member is always a failure (`reason: "unavailable"` is its own
  // discriminant), so any truthy `live` upgrades to assertive here — the
  // caller no longer spells out "assertive" at each call site.
  const live_ = liveRegionProps(live ? "assertive" : undefined);

  // No `action` (every existing call site) → the original single-`<p>`
  // register, byte-identical to before #2815 added the prop. `action`
  // present → a wrapping `<div>` frame so the retry button can sit below
  // the sentence rather than nested inside its `<p>` (#2815).
  if (!action) {
    return (
      <p
        {...live_}
        className={cn(
          "border-ink/30 text-ink text-body-md border-2 border-dashed px-6 py-8 text-center",
          className,
        )}
      >
        {sentence}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "border-ink/30 border-2 border-dashed px-6 py-8 text-center",
        className,
      )}
    >
      {/* The live-region attributes stay on the sentence only, not this
          wrapping frame — a `role="alert"` subtree is flattened to a plain
          announced string by some AT (JAWS), so a `<Button>` living inside
          one is announced as text with no signal a control exists at all
          (#2815 review finding 3). The bespoke markup this replaced had the
          same property: the retry button sat outside any live region. */}
      <p {...live_} className="text-ink text-body-md">
        {sentence}
      </p>
      <div className="mt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      </div>
    </div>
  );
}

function SlotHeldOpenEmptyState({
  children,
  live,
  className,
  background = "transparent",
}: EmptyStateSlotHeldOpenProps) {
  return (
    <div
      {...liveRegionProps(live)}
      className={cn(
        "flex flex-1 items-center justify-center border-2 border-dashed px-3 py-3 text-center",
        SLOT_BACKGROUND_CLASS[background],
        className,
      )}
    >
      <MonoLabel tone="muted">{children}</MonoLabel>
    </div>
  );
}

function SlotEmptyState(props: EmptyStateSlotProps) {
  if (props.reason === "unavailable")
    return <SlotNoticeEmptyState {...props} />;
  return <SlotHeldOpenEmptyState {...props} />;
}

function SurfaceEmptyState(props: EmptyStateSurfaceProps) {
  const {
    heading,
    as,
    children,
    artefact,
    surface = "paper",
    // Defaults to the trailing period — the original hardcode every
    // existing call site still gets byte-identically (#2815).
    emphasis = { text: "." },
    live,
    className,
  } = props;

  return (
    <section
      {...liveRegionProps(live)}
      className={cn(
        SURFACE_CLASS[surface],
        "relative text-center sm:text-left",
        className,
      )}
    >
      {/* Tape straddles the card's own top border, so it must be a direct
          child of the framed `<section>` — the same anchoring `<TapedCard>`
          uses. Parented to the artefact wrapper it anchored to an invisible
          inner box and floated in open cream (#2677). `surface="bare"` draws
          no border, so there is no edge to straddle and no tape. */}
      {surface !== "bare" && <TapeStrip color="warm" length="md" />}

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-7">
        {/* Artefact — a defaulting slot, not a hardcoded image. Ordered
            AFTER the text on mobile (rule 4: the undo belongs "right where
            the results would have been" — a decorative artefact pushed below
            the fold costs nothing; the heading/body/action row pushed below
            it does). Row order on `sm+` is unaffected. */}
        <div className="order-2 inline-block flex-shrink-0 sm:order-1">
          {artefact ?? (
            <JerseyShirt className="h-20 w-20 -rotate-3 sm:h-28 sm:w-28" />
          )}
        </div>

        <div className="order-1 sm:order-2">
          <EditorialHeading
            level={headingLevelFor(as)}
            size="display-md"
            emphasis={emphasis}
          >
            {heading}
          </EditorialHeading>

          <div className="text-ink mt-3 max-w-[var(--container-prose)] text-[14.5px] leading-relaxed">
            {children}
          </div>

          {props.reason === "filtered" && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={props.undo.onClick}
                data-empty-state-undo-source={props.undo.analyticsSource}
                data-empty-state-undo-facet={props.undo.analyticsFacet}
              >
                {props.undo.label}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function EmptyState(props: EmptyStateProps) {
  if (props.tier === "slot") return <SlotEmptyState {...props} />;
  return <SurfaceEmptyState {...props} />;
}
