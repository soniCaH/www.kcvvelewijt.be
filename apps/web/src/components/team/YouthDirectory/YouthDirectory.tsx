import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { TapedCard } from "@/components/design-system/TapedCard";
import { JerseyShirt } from "@/components/design-system/JerseyShirt";
import {
  getYouthDivision,
  getYouthDivisionTone,
  isAgeCode,
  type YouthDivisionGroup,
  type YouthDivisionTone,
} from "@/lib/utils/group-teams";

/**
 * The presentation half of the D6/D6a tone lookup (#2615) — `getYouthDivisionTone`
 * resolves a colour-token identity, never a class string, so the Tailwind
 * utility per tone lives here, beside its only consumer. Two maps because the
 * tone lands on two different CSS properties: the card caption's text colour,
 * and the group-bar tick's fill (`docs/design/mockups/research-d-series/d6a-band-tones.html`
 * — the comp's `.gbar` label text stays `ink-muted`; only its 10px tick square
 * carries the tone).
 */
const TONE_CLASS = {
  ink: "text-ink",
  "jersey-deep": "text-jersey-deep",
  alert: "text-alert",
  warning: "text-warning",
} satisfies Record<YouthDivisionTone, string>;

const TICK_TONE_CLASS = {
  ink: "bg-ink",
  "jersey-deep": "bg-jersey-deep",
  alert: "bg-alert",
  warning: "bg-warning",
} satisfies Record<YouthDivisionTone, string>;

/**
 * Resolve a team's own tone from its own age — never from the group it
 * happens to render inside. A search hit or related-teams card will one day
 * hold only a `TeamLandingItem`, with no group label to key on, so the tone
 * must be derivable from the team alone for it to travel with the card at
 * all (#2615). Reserven's age is `"A"` — a senior code — so it resolves via
 * this exact call the same way any senior team does: no Reserven-specific
 * branch.
 */
function toneFor(age: string): YouthDivisionTone {
  return getYouthDivisionTone(getYouthDivision(age));
}

export interface YouthDirectoryProps {
  /**
   * The section's own heading, and its landmark name. A prop rather than a
   * constant because two routes render this list over two different sets of
   * teams: on `/jeugd` it is the youth section, on `/ploegen` it is every team
   * the two flagships above it leave out — including Reserven, which is not
   * youth (#2641).
   */
  heading: string;
  divisions: readonly YouthDivisionGroup[];
  className?: string;
}

// Subtle ±1° scrapbook tilt, cycled by index (design lock 7j5). Kept small so a
// full division reads as character, not noise.
const CARD_ROTATIONS = [-1.1, 0.7, -0.5];

/**
 * Team directory (`/jeugd` + `/ploegen`). Grouped Reserven / Bovenbouw /
 * Middenbouw / Onderbouw (per [[project_youth_divisions]]); each team is a taped
 * polaroid of its squad photo (`team.teamImageUrl`, backfilled in #2070)
 * captioned with the team's display name — design locks 7j4 (variant C) + 7j5
 * (age-code-only · subtle rotation · newsprint colour). Teams without a photo
 * fall back to the canonical `<JerseyShirt>` illustration. A group with no
 * `range` renders its heading bare (#2414). Empty groups are omitted; the whole
 * block hides when no group has teams.
 */
export function YouthDirectory({
  heading,
  divisions,
  className,
}: YouthDirectoryProps) {
  const groups = divisions.filter((d) => d.teams.length > 0);
  if (groups.length === 0) return null;

  return (
    <section
      data-testid="youth-directory"
      aria-label={heading}
      className={cn("flex flex-col gap-10", className)}
    >
      <EditorialHeading level={2} size="display-md" emphasis={{ text: "." }}>
        {heading}
      </EditorialHeading>

      {groups.map((group) => (
        <div key={group.label} data-testid="youth-division">
          {/* The group bar is otherwise identical to `<SquadGrid>`'s heading
            (same classes bar `mb-5`/`mb-3`) — deliberately: SquadGrid groups
            players by position, which has no comparable tone, so the two
            headings diverge here rather than sharing an extracted one. */}
          <h3 className="text-ink-muted border-paper-edge mb-5 flex items-center gap-[9px] border-b pb-1.5 font-mono text-[11px] tracking-[0.1em] uppercase">
            {/* Comp treatment, not a guess: `d6a-band-tones.html`'s `.gbar`
              keeps its label text `ink-muted` in every variant that ships a
              group bar at all — only a 10px tick square beside it carries
              the tone. First team's age stands in for the whole group: every
              team a group holds already shares one division by construction
              (`groupTeamsForLanding`), Reserven included via its "A" age. */}
            <span
              aria-hidden="true"
              data-testid="youth-division-tick"
              data-tone={toneFor(group.teams[0].age)}
              className={cn(
                "h-2.5 w-2.5 flex-none",
                TICK_TONE_CLASS[toneFor(group.teams[0].age)],
              )}
            />
            <span>
              {group.label}
              {group.range ? ` · ${group.range}` : null}
            </span>
          </h3>
          {/* Track minimum is a chosen constant per breakpoint, not a fit to
            the group (#2602): 150px on the phone, 200px from `md` up — the
            component's only breakpoint. `auto-fill` counts tracks with the
            minimum, so a phone card is `(358 − 16) / 2 = 171px` at two
            columns on a 390px phone; any minimum above 171px drops that
            phone to one column, turning this sixteen-card directory from 8
            rows (~1750px) into 16 (~3900–5700px). 171px is the loosest gate,
            not the binding one — narrower phones tip first: this repo's own
            VR `mobile` viewport (375px) needs ≤163px, and a 360px phone
            needs ≤156px. Wendy is on a phone — check a raise against the
            narrowest width in that range, not just 390px. */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-4 gap-y-7 md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
            {group.teams.map((team, index) => {
              // The caption is the team's one display name (#2630) — the same
              // string its page heads itself with, so the click confirms
              // itself. The chest keeps reading `age` directly: the 56px
              // overlay fits a letter or an age code, not a word, and an empty
              // chest reads as a broken card. Reserven's age is "A" — a senior
              // code that reads as the A-ploeg in a youth grid — so non-age
              // teams wear the caption's initial instead.
              const ageCode = isAgeCode(team.age) ? team.age : null;
              const caption = team.displayName;
              const chestMark = ageCode ?? caption.charAt(0).toUpperCase();
              // The team's own age, not the group it renders inside — see
              // `toneFor`'s doc comment for why that distinction matters.
              const cardTone = toneFor(team.age);
              return (
                <Link
                  key={team._id}
                  href={`/ploegen/${team.slug}`}
                  data-testid="youth-team-card"
                  aria-label={`${caption} — bekijk ploeg`}
                  className="block"
                >
                  <TapedCard
                    rotation={CARD_ROTATIONS[index % CARD_ROTATIONS.length]}
                    tape={{
                      color: "warm",
                      length: "sm",
                      position: index % 2 === 0 ? "left" : "right",
                      rotation: "a",
                    }}
                    bg="cream"
                    padding="sm"
                    interactive="press"
                  >
                    <div className="border-ink relative aspect-[4/3] w-full overflow-hidden border">
                      {team.teamImageUrl ? (
                        <Image
                          src={team.teamImageUrl}
                          alt=""
                          fill
                          // Sanity CDN URL already carries ?w/q/fm transforms —
                          // skip /_next/image (matches TeamFlagship/PlayerCard/TeamStaff).
                          unoptimized
                          sizes="(min-width: 768px) 230px, 45vw"
                          className="object-cover"
                          style={{ filter: "var(--filter-photo-newsprint)" }}
                        />
                      ) : (
                        <div className="bg-cream-soft flex h-full w-full items-center justify-center">
                          <JerseyShirt
                            letterOverlay={chestMark}
                            className="h-full max-h-24 w-auto py-2"
                          />
                        </div>
                      )}
                    </div>
                    <p
                      data-tone={cardTone}
                      className={cn(
                        TONE_CLASS[cardTone],
                        // Not a figure (#2516 review) — `caption` renders a
                        // string like "U21", not a number, so it keeps its
                        // display face and never carried a real figure-style
                        // rule to begin with. `tabular-nums` was inert dead
                        // weight; #2579 drops it.
                        "font-display-big mt-2 text-center text-2xl font-black",
                      )}
                    >
                      {caption}
                    </p>
                    {/* The reeks this team plays in, when the club has
                      published one — and nothing at all when it has not
                      (#2641). The slot used to fall back to `team.name`, which
                      made it true on 1 of the directory's 16 cards: measured on
                      production, `divisionFull` is null on all fifteen youth
                      teams and set only on Reserven, so fifteen cards printed
                      their own caption back at themselves, five of them with
                      the double space the federation name carries. No
                      `?? division` either, unlike the surfaces that have room
                      for it — that field is a code (`3NA`), which says nothing
                      at 10px. */}
                    {team.divisionFull ? (
                      <p className="text-ink-soft mt-0.5 text-center font-mono text-[10px] leading-tight tracking-[0.08em] uppercase">
                        {team.divisionFull}
                      </p>
                    ) : null}
                  </TapedCard>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
