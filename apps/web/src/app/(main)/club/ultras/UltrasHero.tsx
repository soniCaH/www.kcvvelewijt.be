import Image from "next/image";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { PageContainer } from "@/components/design-system/PageContainer";
import { TapedFigure } from "@/components/design-system/TapedFigure";
import { UpLink, type UpLinkProps } from "@/components/design-system/UpLink";
import { ULTRAS_HERO } from "./copy";

/**
 * The `/club/ultras` opening. A departure from `<PageHero>` on its third
 * ground (#2426): a composition it cannot express. The group photo is the
 * subject, so it runs large (7 of 11 columns, index width) on the cream
 * field. Words reuse `<PageHero>`'s cream vocabulary.
 *
 * The photo is decorative (`alt=""`): the `<h1>` beside it names the subject
 * (#2559).
 */
export interface UltrasHeroProps {
  upLink?: Pick<UpLinkProps, "href" | "label">;
}

export function UltrasHero({ upLink }: UltrasHeroProps) {
  const { kicker, headline, accent, lead, image } = ULTRAS_HERO;
  return (
    <header data-testid="ultras-hero" className="overflow-x-clip">
      <PageContainer width="index" className="pb-12 sm:pb-16">
        {upLink ? (
          <UpLink href={upLink.href} label={upLink.label} tone="ink" />
        ) : null}

        <div className="mt-8 grid gap-10 md:grid-cols-[4fr_7fr] md:items-center md:gap-12">
          <div className="flex flex-col gap-4">
            <span className="text-jersey-deep text-label font-mono font-semibold uppercase">
              {kicker}
            </span>
            <EditorialHeading
              level={1}
              size="display-2xl"
              emphasis={{ text: accent, tone: "jersey-deep" }}
            >
              {headline}
            </EditorialHeading>
            <p className="font-display text-display-sm text-ink italic">
              {lead}
            </p>
          </div>

          <TapedFigure
            aspect="landscape-3-2"
            bg="cream-soft"
            tint="newsprint"
            rotation="b"
            tape={{
              color: "warm",
              length: "lg",
              position: "left",
              rotation: "c",
            }}
          >
            <Image
              src={image}
              alt=""
              fill
              priority
              sizes="(min-width: 1280px) 760px, (min-width: 768px) 62vw, 100vw"
              className="object-cover"
            />
          </TapedFigure>
        </div>
      </PageContainer>
    </header>
  );
}
