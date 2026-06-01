import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { TapedFigure } from "@/components/design-system/TapedFigure";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { JerseyShirt } from "@/components/design-system/JerseyShirt";
import { getYouthDivision } from "@/lib/utils/group-teams";

export interface TeamHeroProps {
  /**
   * Full team name from Sanity (e.g. "KCVV Elewijt A", "KCVV Elewijt U13").
   * Used as the primary source for the category headline.
   */
  name: string;
  /** Team age code from Sanity (e.g. "A", "B", "U13"). Used as a fallback only. */
  age: string | null;
  /** "senior" or "youth" — drives kicker + meta pill logic. */
  teamType: "youth" | "senior";
  /** Age group extracted from `age` (e.g. "U13"). Computed by the repository. */
  ageGroup?: string;
  /** Division label, short (e.g. "3NA") or full (preferred). */
  division?: string | null;
  /** Full division label (e.g. "Eerste Elftal A – 3e Nat. A"). */
  divisionFull?: string | null;
  /** Season label (e.g. "25/26"). */
  season?: string | null;
  /** Editorial tagline — renders as italic display lead. Auto-hides when absent. */
  tagline?: string | null;
  /** Squad photo URL (landscape newsprint photo). No photo → JerseyShirt fallback. */
  teamImageUrl?: string | null;
  className?: string;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled teamType variant: ${String(value)}`);
}

function computeCategory(
  name: string,
  age: string | null,
  teamType: "youth" | "senior",
): string {
  if (teamType === "youth") {
    // age field is reliable for youth (U6, U8, U13, U17, …)
    if (age) return age.toUpperCase();
    return "Jeugd";
  }
  if (teamType === "senior") {
    // Sanity name is the full PSD name (e.g. "KCVV Elewijt Eerste Elftallen A").
    // The last word is the single-letter team suffix — more reliable than the age field,
    // which PSD sometimes sends as "A" for both first and second teams.
    const lastWord = name.trim().split(/\s+/).pop()?.toUpperCase() ?? "";
    if (lastWord === "A") return "A-ploeg";
    if (lastWord === "B") return "B-ploeg";
    // Fallback to age field if name doesn't end in A/B (edge case)
    if (age?.toUpperCase() === "A") return "A-ploeg";
    if (age?.toUpperCase() === "B") return "B-ploeg";
    return "Ploeg";
  }
  return assertNever(teamType);
}

export function TeamHero({
  name,
  age,
  teamType,
  ageGroup,
  division,
  divisionFull,
  season,
  tagline,
  teamImageUrl,
  className,
}: TeamHeroProps) {
  const hasPhoto =
    teamImageUrl !== undefined && teamImageUrl !== null && teamImageUrl !== "";
  const category = computeCategory(name, age, teamType);

  const kicker = teamType === "youth" ? "KCVV Elewijt · Jeugd" : "KCVV Elewijt";

  // Meta pills: senior = division + season; youth = youth band + season.
  const divisionLabel = divisionFull ?? division ?? null;
  const bandLabel =
    teamType === "youth" ? getYouthDivision(ageGroup) : divisionLabel;

  const showBandPill = bandLabel !== null && bandLabel !== "";
  const showSeasonPill =
    season !== null && season !== undefined && season !== "";
  const showMeta = showBandPill || showSeasonPill;

  const showTagline =
    tagline !== null && tagline !== undefined && tagline !== "";

  // Chest letter on the JerseyShirt fallback: prefer the normalised ageGroup
  // (e.g. "U13") over the raw age string (which may have a suffix like "U13A").
  const jerseyLetter = (ageGroup ?? age)?.toUpperCase();

  return (
    <section
      data-testid="team-hero"
      aria-label={`${category} · ploegpagina`}
      className={cn(
        "grid grid-cols-1 items-start gap-x-10 gap-y-8 overflow-x-clip sm:grid-cols-[1fr_minmax(300px,420px)]",
        className,
      )}
    >
      {/* Words column — order-last on mobile so artefact appears above */}
      <div className="order-last flex flex-col gap-4 sm:order-first">
        <span data-testid="team-hero-kicker">
          <MonoLabel variant="plain">{kicker}</MonoLabel>
        </span>

        <EditorialHeading level={1} size="display-xl" emphasis={{ text: "." }}>
          {category}
        </EditorialHeading>

        {showMeta ? (
          <div
            data-testid="team-hero-meta"
            className="flex flex-wrap items-center gap-2"
          >
            {showBandPill ? (
              <MonoLabel variant="pill-ink" size="sm">
                {bandLabel}
              </MonoLabel>
            ) : null}
            {showSeasonPill ? (
              <MonoLabel variant="pill-cream" size="sm">
                {season}
              </MonoLabel>
            ) : null}
          </div>
        ) : null}

        {showTagline ? (
          <p
            data-testid="team-hero-tagline"
            className="font-display text-ink-muted text-[length:var(--text-display-sm)] leading-[var(--text-display-sm--lh)] italic"
          >
            {tagline}
          </p>
        ) : null}
      </div>

      {/* Artefact column — order-first on mobile so it appears above the words */}
      <div
        data-testid="team-hero-artefact"
        data-state={hasPhoto ? "photo" : "jersey"}
        className="order-first flex w-full flex-col gap-3 justify-self-start sm:order-last sm:justify-self-end"
      >
        <TapedFigure
          aspect="landscape-3-2"
          rotation="b"
          tape={{ color: "warm", length: "md" }}
          bg="cream-soft"
          tint={hasPhoto ? "newsprint" : "none"}
          padding="none"
        >
          {hasPhoto ? (
            <Image
              src={teamImageUrl!}
              alt={`${category} teamfoto`}
              width={420}
              height={280}
              unoptimized
              className="block h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <JerseyShirt
                letterOverlay={jerseyLetter}
                ariaLabel={`${category} jersey`}
                className="h-full max-h-[160px] w-full max-w-[160px]"
              />
            </div>
          )}
        </TapedFigure>

        {/* Season stub — decorative; season content is accessible via the meta pill above. */}
        {showSeasonPill ? (
          <div
            data-testid="team-hero-season-stub"
            aria-hidden="true"
            className="border-ink bg-cream inline-flex w-fit translate-x-2 rotate-[0.5deg] items-center gap-2 border-2 border-dashed px-3 py-2 shadow-[2px_2px_0_0_var(--color-ink)]"
          >
            <MonoLabel variant="plain" size="sm">
              Seizoen
            </MonoLabel>
            <span className="font-display-big text-ink text-[length:var(--text-display-sm)] leading-none">
              {season}
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
