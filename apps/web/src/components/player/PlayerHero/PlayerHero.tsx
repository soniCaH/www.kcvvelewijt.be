/**
 * <PlayerHero> — Phase 6.A hero band for `/spelers/[slug]`.
 *
 * Composes existing Phase 0–5 primitives per the locked design drills:
 * - **6.d1 — Name typography:** first name in upright Black display, last
 *   name in italic display Regular with a period suffix. The two pieces
 *   render as a 2-line stacked rhythm. Implemented as consumer-level
 *   `<span>` children (option (b) from the brief) — `<EditorialHeading>`
 *   does not grow a `nameWeight` prop for this single use site.
 * - **6.d2 — Hero figure:** `<TapedFigure aspect="portrait-3-4">`. When
 *   `photoUrl` is present, renders the photo inside the polaroid frame
 *   with the global newsprint filter + paper-grain. When missing, renders
 *   the shared `<JerseyIllustration variant="hero">` fallback (head + torso +
 *   V-collar + 4 stripes, from `_jersey-paths.ts`). Never a hybrid — see
 *   `[[feedback_playerfigure_no_hybrid]]`.
 * - **6.d3 — NIEUW badge dropped:** no `<MonoLabel>NIEUW</MonoLabel>` here.
 * - **6.d9 — Cross-age meta row:** `position · birthDate` only. Adults
 *   (>=18) render the full `DD·MM·YYYY` date; minors (<18) render
 *   `<age> jaar · '<YY>` to keep the full DOB off the page.
 *
 * **Upright Black display weight audit (PRD §7 Q1, AC):** verified at
 * implementation time. `<EditorialHeading size="display-2xl">` already
 * ships `font-display-big font-black` in production via the Adobe Fonts
 * Typekit subset (loaded by `apps/web/src/app/layout.tsx`). Reusing the
 * same `font-display-big font-black` class set for the first-name span
 * inherits that subset — no follow-up font re-cut required.
 *
 * **`<EditorialHeading>` API extension (PRD §7 Q2, AC):** option (b) —
 * consumer-level spans — picked here. The split-rhythm is hero-specific
 * and would clutter the heading primitive's surface area for a single
 * caller. If future surfaces (PlayerCard squad grid, transfer hero per
 * 6.d1 cascade list) adopt the same rhythm, revisit promoting it to a
 * `nameWeight="split"` prop on `<EditorialHeading>`.
 *
 * **Multi-team disambiguation (PRD §7 Q4, AC):** this component is
 * deliberately data-flat. The hero kicker / ticket-stub `teamLabel` is
 * supplied by the page (`/spelers/[slug]/page.tsx`), which already owns
 * the active-roster selection via the `currentTeam` GROQ projection on
 * `PLAYER_BY_PSD_ID_QUERY` (first non-archived team that references the
 * player, ordered alphabetically by team name). `<PlayerHero>` does not
 * consume a `playerTeams` array; the page picks the team to render.
 */

import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { TapedFigure } from "@/components/design-system/TapedFigure";
import { NumberDisplay } from "@/components/design-system/NumberDisplay";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { JerseyIllustration } from "@/components/design-system/JerseyIllustration";

const ADULT_AGE_THRESHOLD = 18;

export interface PlayerHeroProps {
  firstName: string;
  lastName: string;
  /** Editorial position label, sentence case (e.g. "Middenvelder"). */
  position: string;
  /** Resolved photo URL (typically `transparentImageUrl ?? psdImageUrl`). Missing → illustration fallback. */
  photoUrl?: string;
  /** ISO date string `YYYY-MM-DD`. Omitted → birthDate cell drops. */
  birthDate?: string;
  jerseyNumber?: number;
  /** Active-team label resolved by the page (e.g. "A-Ploeg", "U17"). */
  teamLabel?: string;
  /** Season label (e.g. "26/27"). Combined with `teamLabel` into the ticket-stub. */
  season?: string;
  className?: string;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function computeAge(birth: Date, now: Date): number {
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - birth.getUTCMonth();
  if (
    monthDelta < 0 ||
    (monthDelta === 0 && now.getUTCDate() < birth.getUTCDate())
  ) {
    age -= 1;
  }
  return age;
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function formatAgeGradedBirthDate(iso: string, now: Date): string | undefined {
  const match = ISO_DATE_PATTERN.exec(iso);
  if (match === null) return undefined;
  const year = Number.parseInt(match[1] ?? "", 10);
  const month = Number.parseInt(match[2] ?? "", 10);
  const day = Number.parseInt(match[3] ?? "", 10);
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return undefined;
  }
  const birth = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(birth.getTime())) return undefined;
  // Reject roll-overs (e.g. 2024-02-31 → 2024-03-02) by re-checking parts.
  if (
    birth.getUTCFullYear() !== year ||
    birth.getUTCMonth() !== month - 1 ||
    birth.getUTCDate() !== day
  ) {
    return undefined;
  }
  // Reject future dates outright.
  if (birth.getTime() > now.getTime()) return undefined;
  const age = computeAge(birth, now);
  if (age >= ADULT_AGE_THRESHOLD) {
    const dd = pad2(birth.getUTCDate());
    const mm = pad2(birth.getUTCMonth() + 1);
    const yyyy = birth.getUTCFullYear();
    return `${dd}·${mm}·${yyyy}`;
  }
  const yy = pad2(birth.getUTCFullYear() % 100);
  return `${age} jaar · '${yy}`;
}

export function PlayerHero({
  firstName,
  lastName,
  position,
  photoUrl,
  birthDate,
  jerseyNumber,
  teamLabel,
  season,
  className,
}: PlayerHeroProps) {
  const hasPhoto = photoUrl !== undefined && photoUrl !== "";
  const figureState: "photo" | "illustration" = hasPhoto
    ? "photo"
    : "illustration";

  const now = new Date();
  const formattedBirthDate =
    birthDate !== undefined && birthDate !== ""
      ? formatAgeGradedBirthDate(birthDate, now)
      : undefined;

  const showTicketStub =
    teamLabel !== undefined &&
    teamLabel !== "" &&
    season !== undefined &&
    season !== "";

  return (
    <section
      data-testid="player-hero"
      className={cn(
        "grid grid-cols-1 items-start gap-x-10 gap-y-8 sm:grid-cols-[1fr_minmax(220px,320px)]",
        className,
      )}
    >
      <div className="flex flex-col gap-5">
        {teamLabel !== undefined && teamLabel !== "" ? (
          <span className="uppercase">
            <MonoLabel variant="plain">{teamLabel}</MonoLabel>
          </span>
        ) : null}

        {jerseyNumber !== undefined ? (
          <span data-testid="player-hero-number" className="block">
            <NumberDisplay
              value={jerseyNumber}
              prefix="#"
              size="display-2xl"
              tone="jersey"
            />
          </span>
        ) : null}

        <h1 className="text-ink m-0 flex flex-col leading-[0.9]">
          <span
            data-testid="player-hero-first-name"
            className="font-display-big block text-[length:var(--text-display-2xl)] leading-[var(--text-display-2xl--lh)] font-black"
          >
            {firstName}
          </span>
          <span
            data-testid="player-hero-last-name"
            className="font-display block text-[length:var(--text-display-xl)] leading-[var(--text-display-xl--lh)] font-normal italic"
          >
            {lastName}.
          </span>
        </h1>

        <div
          data-testid="player-hero-meta"
          className="text-ink-muted flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs tracking-[0.1em] uppercase"
        >
          <span>{position}</span>
          {formattedBirthDate !== undefined ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{formattedBirthDate}</span>
            </>
          ) : null}
        </div>

        {showTicketStub ? (
          <span
            data-testid="player-hero-ticket-stub"
            className="border-ink bg-cream text-ink inline-flex w-fit items-center gap-2 border-2 px-3 py-1 font-mono text-xs tracking-[0.12em] uppercase shadow-[2px_2px_0_0_var(--color-ink)]"
          >
            <span>{teamLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{season}</span>
          </span>
        ) : null}
      </div>

      <div
        data-testid="player-hero-figure"
        data-state={figureState}
        className="w-full max-w-[320px] justify-self-start sm:justify-self-end"
      >
        <TapedFigure
          aspect="portrait-3-4"
          rotation="b"
          tape={{ color: "jersey", length: "md" }}
          bg="cream-soft"
          tint={hasPhoto ? "newsprint" : "none"}
          padding="none"
        >
          {hasPhoto ? (
            <Image
              src={photoUrl}
              alt={`${firstName} ${lastName}`}
              width={400}
              height={533}
              unoptimized
              className="block h-full w-full object-cover"
            />
          ) : (
            <JerseyIllustration
              variant="hero"
              data-testid="player-hero-illustration"
            />
          )}
        </TapedFigure>
      </div>
    </section>
  );
}
