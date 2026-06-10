import Image from "next/image";
import {
  EditorialHeading,
  MonoLabel,
  TapedFigure,
} from "@/components/design-system";

export interface JeugdHeroProps {
  /**
   * Youth team / training photo. Defaults to the committed youth asset
   * (also the homepage `<YouthSection>` backdrop), so the page can render
   * `<JeugdHero />` with no props.
   */
  imageUrl?: string;
}

/** Local committed youth asset — also the homepage YouthSection backdrop. */
const DEFAULT_PHOTO = "/images/youth-trainers.jpg";

/**
 * <JeugdHero> — the `/jeugd` split hero (Phase 7 / Phase 2, design contract
 * 7j1). Mirrors the `<SponsorHero>` / `<BoardHero>` sibling-hero structure on
 * cream: a MonoLabel kicker + `<EditorialHeading>` "Beter worden begint met
 * plezier." (jersey-deep period) + an italic-display lead for parents (keeps
 * "gediplomeerde trainers"), beside a youth photo in a newsprint
 * `<TapedFigure>`. Register: development through plezier.
 *
 * The text column uses `flex flex-col gap-4` with `mb-0` on the heading so the
 * global `h1 { margin-bottom: 1em }` base rule (≈96px at display-2xl) collapses
 * to the column gap — the same pattern as `<BoardHero>`.
 */
export function JeugdHero({ imageUrl = DEFAULT_PHOTO }: JeugdHeroProps) {
  return (
    <header className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
      <div className="flex flex-col gap-4">
        <span>
          <MonoLabel variant="plain">De jeugdopleiding · U6 tot U21</MonoLabel>
        </span>
        <EditorialHeading
          level={1}
          size="display-2xl"
          emphasis={{ text: "." }}
          className="mb-0"
        >
          Beter worden begint met plezier
        </EditorialHeading>
        <p className="text-ink-soft font-display text-[length:var(--text-display-sm)] leading-[var(--text-display-sm--lh)] italic">
          Een doordachte opleiding van Onderbouw tot Bovenbouw, met
          gediplomeerde trainers en plezier als motor. Want wie graag speelt,
          groeit vanzelf — op en naast het veld.
        </p>
        <span>
          <MonoLabel variant="plain">
            Onderbouw → Middenbouw → Bovenbouw
          </MonoLabel>
        </span>
      </div>

      <TapedFigure
        aspect="landscape-3-2"
        bg="cream-soft"
        tint="newsprint"
        rotation="b"
        tape={{ color: "warm", length: "md", position: "left", rotation: "a" }}
        className="w-full"
      >
        <Image
          src={imageUrl}
          alt="Jeugdspelers van KCVV Elewijt tijdens een training"
          fill
          sizes="(min-width: 1024px) 32rem, 100vw"
          className="object-cover"
        />
      </TapedFigure>
    </header>
  );
}
