/**
 * <FirstTeamsBlock> — homepage "Eerste ploegen" eyecatcher (#2211).
 *
 * Full-bleed jersey-deep-dark matchday-desk band (StripedSeam top + bottom),
 * one full-width row per senior team: [team label] · [last result] ·
 * [next fixture]. Both the result and the next fixture render as the shared
 * unified <TeamAgendaRow> — the same match row used on team pages + /kalender
 * (#2301, Direction A): the result as a cream row, the next fixture as the
 * featured jersey-deep card. Each row owns its own press-down <Link> deep to
 * its match detail (`/wedstrijd/{id}`), so there is no bespoke card style left
 * to clash and no nested-interactive wrapper on touch.
 *
 * Design lock: docs/design/mockups/eerste-ploegen/eerste-ploegen-locked.md
 * (visual record: docs/design/mockups/eerste-ploegen/04-b3-ia.html).
 */
import Image from "next/image";
import Link from "next/link";
import { EditorialHeading, StripedSeam } from "@/components/design-system";
import { assertNever } from "@/lib/utils/assert-never";
import type { MatchesSliderPlaceholderVM } from "@/lib/repositories/homepage.repository";
import { FirstTeamAgendaRow } from "./FirstTeamAgendaRow";
import type { FirstTeamVM } from "./first-teams";
import {
  formatDaysUntil,
  resolvePlaceholderState,
  type Mededeling as MededelingVM,
  type PlaceholderState,
} from "./placeholder-rule";

export interface FirstTeamsBlockProps {
  teams: FirstTeamVM[];
  /**
   * Section heading. The homepage passes a fixture-aware label (HP-4) derived
   * by `firstTeamsHeading`, which owns the rule — see its docblock in
   * `first-teams.ts`. Defaults to "Dit weekend." so stories/tests stay stable;
   * that default is an unconditional claim, so real callers must pass one.
   */
  heading?: string;
  /**
   * A match read failed (BFF/PSD down or quota-exhausted), as opposed to the
   * feed genuinely holding no matches. Read solely on the no-rows path, where
   * it is folded into `resolvePlaceholderState`'s own `{ kind: "unavailable"
   * }` member — that member carries neither a mededeling nor an image, so an
   * outage structurally cannot render either (#2505/#2844, round-3 review
   * finding M4).
   */
  unavailable?: boolean;
  /**
   * The Studio-authored off-season notice (#2505) — countdown, mededeling and
   * highlight image, read only on the no-rows path and only when `unavailable`
   * is false. `null`/`undefined` when nothing is authored — the band falls
   * back to its unchanged "Nog geen wedstrijden ingepland." A failed
   * placeholder read degrades to `null` at the call site too
   * (`degradeSection`, `(landing)/page.tsx`), so it lands here
   * indistinguishable from "nothing authored" and produces the same
   * fallback copy.
   */
  placeholder?: MatchesSliderPlaceholderVM | null;
  /**
   * Render reference time for the countdown. Defaults to now; the homepage
   * passes the same `now` it already computed for `firstTeamsHeading` /
   * `deriveFirstTeamVM` so every date-derived value on the page agrees.
   * Stories and tests override it for a deterministic day count — a default
   * here is harmless (unlike `resolvePlaceholderState`'s own signature,
   * which drops it per #2505 round-3 review finding S6): this prop is read
   * only on the no-rows path, so every populated-row test that never passes
   * it is correctly indifferent to what it defaults to.
   */
  now?: Date;
}

/**
 * The held-open frame (#2427 tier 2) for the homepage's dark grounds — an
 * empty slot inside a populated dark band keeps its shape so the absence
 * reads as a known gap rather than a render failure, the dark-ground
 * counterpart of `<EmptyState tier="slot">`'s own ink-only register. Shared
 * by the per-slot `<SkipCard>` and the whole-band notice so the two can't
 * drift, the way `FIRST_TEAMS_ROW_GRID` is below — and exported for the
 * same reason `FIRST_TEAMS_ROW_GRID` is: `<FeaturedEventBand>`'s own
 * dark-ground notice (`jersey-deep`, #2944) reuses this constant rather
 * than hand-rolling a third copy of the same utility string. Import it via
 * `@/components/home/FirstTeamsBlock`, not by copying the value.
 *
 * **This is the decided dark-ground answer (#3103)**, not a stand-in for a
 * dark axis on `<EmptyState tier="slot">` — that tier stays ink-only by
 * design; see `EmptyState.tsx`'s own docblock for the other end of this
 * hand-off. `SkipCard` `text-cream/65`, band note `text-cream/80` stay this
 * file's own (not exported — only the frame itself is shared).
 */
export const HELD_OPEN_FRAME =
  "border-cream/40 border-2 border-dashed text-center";

function SkipCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${HELD_OPEN_FRAME} text-cream/65 flex items-center justify-center px-4 py-3 font-mono text-xs tracking-wide uppercase`}
    >
      {children}
    </div>
  );
}

/**
 * Row grid, shared with the homepage route skeleton so the two can't drift.
 *
 * Three columns only from `xl`: at `md` each scoreboard fell below its own
 * min-content and the row overflowed the page (#2397). The label column is a
 * bounded 11rem rather than the old `0.72fr` (~263px) — "A-ploeg" plus a
 * division needs about 110px, and the ~90px that frees is what lets a 30-char
 * club name sit unclipped. Bounded, not content-sized, because `divisionFull`
 * is PSD-authored and would otherwise spend that width straight back.
 *
 * Coupled to `<TeamAgendaRow>`'s `fluidNames` threshold: three-up lands each
 * card near 520px, deliberately under that 560px mark, because the fluid split
 * is what seats a long opponent name in a card that narrow.
 */
export const FIRST_TEAMS_ROW_GRID =
  "border-cream/20 grid gap-3 border-t py-5 first:border-t-0 xl:grid-cols-[minmax(0,11rem)_1fr_1fr] xl:gap-5";

/**
 * Renders a mededeling as a link when the Studio editor authored an
 * `announcementHref` beside it, plain text otherwise (#2505). The authored
 * production value today points at `/kalender` — the same destination the
 * band's own "Volledige kalender →" already offers — so the link changes
 * nothing for that content and exists for a future summer whose mededeling
 * points elsewhere (a news item, say).
 *
 * The schema admits absolute `http(s)` URLs alongside relative ones
 * (`matchesSliderPlaceholder.ts`'s `rule.uri({ scheme: ["http", "https"],
 * allowRelative: true })`), so an authored external URL gets the same
 * `target="_blank"`/`rel="noopener noreferrer"` treatment every other
 * CMS-authored link in the app applies — the shared `href.startsWith("http")`
 * check `ArticleBody.tsx`, `galerij/[slug]/page.tsx` and `QuestionCard.tsx`
 * each already re-derive locally (review finding 6 on #2505/PR #2852).
 *
 * **Named exception (#2565 register, cf. commit 7d393bd6):** this is a
 * fourth inline-link treatment, not a drift back into the three `.prose-link`
 * cut #2565 down to. `.prose-link` hardcodes `color:
 * var(--color-jersey-deep)` (`globals.css`), unusable on this band's
 * `jersey-deep-dark` ground, so `underline decoration-cream/50` is this
 * band's own deliberate cream-on-dark link style — scoped to
 * `<FirstTeamsBlock>`'s held-open notice only, not a candidate for the
 * shared roster (review finding 7).
 */
function Mededeling({ text, href }: MededelingVM) {
  if (!href) return <>{text}</>;
  const isExternal = href.startsWith("http");
  return (
    <Link
      href={href}
      className="decoration-cream/50 hover:decoration-cream underline underline-offset-2"
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {text}
    </Link>
  );
}

/**
 * The whole six-state copy table in one place — `state.kind` is the single
 * source of truth for which sentence renders, including the outage line
 * (#2505 round-3 review finding M4 folded `unavailable` into
 * `PlaceholderState` precisely so this switch could be the only place the
 * table is spelled out).
 */
function renderPlaceholderCopy(state: PlaceholderState): React.ReactNode {
  switch (state.kind) {
    case "unavailable":
      return "Uitslagen en wedstrijden zijn even niet beschikbaar. Probeer het later opnieuw.";
    case "today":
      return "Vandaag de aftrap van het nieuwe seizoen.";
    case "countdown":
      return (
        <>
          {`Nog ${formatDaysUntil(state.daysUntil)} tot de aftrap.`}
          {state.mededeling ? (
            <>
              {" "}
              <Mededeling {...state.mededeling} />
            </>
          ) : null}
        </>
      );
    case "mededeling":
      return <Mededeling {...state.mededeling} />;
    case "empty":
      return "Nog geen wedstrijden ingepland.";
    default:
      return assertNever(state);
  }
}

/**
 * The no-rows notice, for every state including the outage (#2505 round-3
 * review finding M4 — one rendered box, not two spellings of the dashed
 * frame kept in sync by eye). Renders the authored `highlightImage` inside
 * the dashed frame, above the sentence, at a capped height well under the
 * populated band's three-row height — never a decorative backdrop:
 * `highlightImage.alt` is `rule.required()` in the Studio schema, so a
 * `role="presentation"` treatment would leave a required editor field
 * feeding nothing, which is this ticket's own bug one level down (#2844).
 * `resolvePlaceholderState`'s `unavailable` member carries no `image` field
 * at all, so the outage state structurally cannot render one.
 */
function PlaceholderNotice({
  placeholder,
  now,
  unavailable,
}: {
  placeholder?: MatchesSliderPlaceholderVM | null;
  now: Date;
  unavailable: boolean;
}) {
  const state = resolvePlaceholderState(placeholder, now, unavailable);
  const image = state.kind === "unavailable" ? undefined : state.image;

  return (
    <div className={`${HELD_OPEN_FRAME} px-4 py-8`}>
      {image ? (
        <div className="relative mx-auto mb-4 h-40 w-full max-w-2xl overflow-hidden">
          <Image
            src={image.url}
            alt={image.alt}
            fill
            // `object-top`: a same-origin safety net for whatever the
            // server-side `fp-x`/`fp-y` crop (`homepage.repository.ts`) still
            // hands the browser to fit responsively — team/action photos put
            // their subject upper-frame far more often than centred, the
            // same reasoning `<YouthBackdrop>` already uses for its own
            // 16:9 crop (review finding 4 on #2505/PR #2852).
            className="object-cover object-top"
            sizes="(max-width: 768px) calc(100vw - 4rem), 672px"
            placeholder={image.lqip ? "blur" : "empty"}
            blurDataURL={image.lqip ?? undefined}
          />
        </div>
      ) : null}
      <p className="text-cream/80">{renderPlaceholderCopy(state)}</p>
    </div>
  );
}

function FirstTeamRow({ team }: { team: FirstTeamVM }) {
  return (
    <div className={`${FIRST_TEAMS_ROW_GRID} xl:items-stretch`}>
      <div className="flex flex-col justify-center">
        <span className="font-display text-cream text-2xl leading-tight font-bold">
          {team.label}
        </span>
        {team.division ? (
          <span className="text-cream/70 text-label mt-1 font-mono uppercase">
            {team.division}
          </span>
        ) : null}
      </div>
      {team.result ? (
        <FirstTeamAgendaRow
          match={team.result}
          teamSlug={team.slug}
          kind="result"
        />
      ) : (
        <SkipCard>Nog geen uitslag</SkipCard>
      )}
      {team.fixture ? (
        <FirstTeamAgendaRow
          match={team.fixture}
          teamSlug={team.slug}
          kind="fixture"
          featured
        />
      ) : (
        <SkipCard>Geen geplande wedstrijd</SkipCard>
      )}
    </div>
  );
}

/**
 * Render the "Eerste ploegen" band. Teams with neither a result nor a fixture
 * are dropped; when that leaves no rows at all the band still renders — chrome
 * plus a held-open notice — instead of vanishing (#2399). A silently absent
 * band left the homepage looking finished during a BFF outage, so a supporter
 * concluded the club had never posted the result.
 */
export function FirstTeamsBlock({
  teams,
  heading = "Dit weekend.",
  unavailable = false,
  placeholder = null,
  now = new Date(),
}: FirstTeamsBlockProps) {
  const rows = teams.filter((t) => t.result || t.fixture);

  return (
    <section aria-label="Eerste ploegen" className="bg-jersey-deep-dark">
      <StripedSeam colorPair="cream-jersey-deep" height="md" />
      <div className="mx-auto max-w-[var(--container-index)] px-4 py-10 md:px-8 md:py-12">
        <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
          <div>
            <span className="text-warm text-label font-mono font-semibold uppercase">
              Eerste ploegen
            </span>
            <EditorialHeading
              level={2}
              size="display-md"
              tone="cream"
              className="mt-2"
            >
              {heading}
            </EditorialHeading>
          </div>
          <Link
            href="/kalender"
            // `py-2 -my-2` — hit area only, no layout shift (#2394).
            className="text-warm hover:text-cream -my-2 shrink-0 py-2 font-mono text-xs font-semibold tracking-wide uppercase transition-colors"
          >
            Volledige kalender <span aria-hidden="true">→</span>
          </Link>
        </div>
        {rows.length > 0 ? (
          <div className="flex flex-col">
            {rows.map((team) => (
              <FirstTeamRow key={team.slug} team={team} />
            ))}
          </div>
        ) : (
          <PlaceholderNotice
            placeholder={placeholder}
            now={now}
            unavailable={unavailable}
          />
        )}
      </div>
      <StripedSeam colorPair="cream-jersey-deep" height="md" flip />
    </section>
  );
}
