import Image from "next/image";
import {
  EditorialHeading,
  MonoLabel,
  TapedFigure,
} from "@/components/design-system";

/**
 * Dark group-photo hero for the board pages (`/club/bestuur`,
 * `/club/jeugdbestuur`, `/club/angels`) — design contract 7b1 (Hero B) + 7b2.
 *
 * `jersey-deep-dark` band (the redesign dark, NOT the retired `kcvv-black`):
 * kicker "De club" + `<EditorialHeading>` team name with a **warm "." accent**
 * (gold period pops on dark green) + tagline lead, beside the group photo in a
 * cream `<TapedFigure>` that pops on the dark field. The photo column is
 * omitted when the team has no `imageUrl`.
 */
export interface BoardHeroProps {
  /** Team name — the hero headline. */
  name: string;
  /** Tagline lead under the headline. */
  tagline?: string;
  /** Group / board photo URL (`team.teamImageUrl`). */
  imageUrl?: string;
}

export function BoardHero({ name, tagline, imageUrl }: BoardHeroProps) {
  const lead = tagline?.trim() || "De mensen achter KCVV Elewijt";

  return (
    <header className="bg-jersey-deep-dark">
      <div className="mx-auto grid max-w-[var(--container-wide)] gap-8 px-4 py-14 sm:py-20 md:grid-cols-[1fr_auto] md:items-center md:px-8">
        <div className="flex flex-col gap-4">
          <span>
            <MonoLabel variant="plain" tone="cream">
              De club
            </MonoLabel>
          </span>
          <EditorialHeading
            level={1}
            size="display-2xl"
            tone="cream"
            emphasis={{ text: ".", tone: "warm" }}
            className="mb-0"
          >
            {name}
          </EditorialHeading>
          <p className="text-cream/85 font-display text-[length:var(--text-display-sm)] leading-[var(--text-display-sm--lh)] italic">
            {lead}
          </p>
        </div>

        {imageUrl ? (
          <TapedFigure
            aspect="landscape-3-2"
            bg="cream-soft"
            tint="newsprint"
            rotation="b"
            tape={{
              color: "warm",
              length: "md",
              position: "left",
              rotation: "a",
            }}
            className="w-full md:w-[24rem]"
          >
            <Image
              src={imageUrl}
              alt={`${name} groepsfoto`}
              fill
              sizes="(min-width: 768px) 24rem, 100vw"
              className="object-cover"
            />
          </TapedFigure>
        ) : null}
      </div>
    </header>
  );
}
