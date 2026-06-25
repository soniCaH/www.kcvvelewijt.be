import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { JerseyShirt } from "@/components/design-system/JerseyShirt";
import { TapedCard } from "@/components/design-system/TapedCard";

export interface TeamFlagshipProps {
  /**
   * `a` — jersey-deep filled block, content-left / photo-right.
   * `b` — the same block mirrored (photo-left / content-right) in cream.
   */
  variant: "a" | "b";
  /** Small label above the headline, e.g. "Eerste elftal" / "Tweede elftal". */
  kicker: string;
  /** Category headline without the period, e.g. "A-ploeg" / "B-ploeg". */
  category: string;
  division?: string | null;
  season?: string | null;
  /** Squad photo URL (newsprint). No photo → JerseyShirt fallback. */
  teamImageUrl?: string | null;
  /** Detail-page href. */
  href: string;
  className?: string;
}

export function TeamFlagship({
  variant,
  kicker,
  category,
  division,
  season,
  teamImageUrl,
  href,
  className,
}: TeamFlagshipProps) {
  const isA = variant === "a";
  const hasPhoto =
    teamImageUrl !== undefined && teamImageUrl !== null && teamImageUrl !== "";

  const meta = [division, season].filter((v): v is string => Boolean(v));

  // A is jersey-deep (white small text passes AA where cream would not);
  // B is cream (ink text). Big headline is large-text so cream/ink both pass.
  const smallText = isA ? "text-white" : "text-ink-muted";

  const photo = (
    <div
      data-testid="team-flagship-photo"
      data-state={hasPhoto ? "photo" : "jersey"}
      className={cn(
        "relative min-h-[220px] overflow-hidden sm:min-h-[300px]",
        isA ? "bg-jersey-deep" : "bg-cream-soft",
      )}
    >
      {hasPhoto ? (
        <Image
          src={teamImageUrl!}
          alt={`${category} teamfoto`}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover"
          style={{ filter: "var(--filter-photo-newsprint)" }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-8">
          <JerseyShirt ariaLabel={`${category} jersey`} className="h-40 w-40" />
        </div>
      )}
    </div>
  );

  const content = (
    // TEAMS-1: B-ploeg mirrors the A-ploeg row — its content sits on the right,
    // so right-align it instead of the shared left default.
    <div
      className={cn(
        "flex flex-col justify-center gap-4 p-6 sm:p-10",
        isA ? "items-start" : "items-end text-right",
      )}
    >
      <span
        className={cn(
          "font-mono text-[11px] tracking-[0.12em] uppercase",
          smallText,
        )}
      >
        {kicker}
      </span>

      <EditorialHeading
        level={2}
        size="display-lg"
        tone={isA ? "cream" : "ink"}
        emphasis={{ text: ".", tone: isA ? "warm" : "jersey-deep" }}
      >
        {category}
      </EditorialHeading>

      {meta.length > 0 ? (
        <p
          className={cn(
            "font-mono text-xs tracking-[0.08em] uppercase",
            smallText,
          )}
        >
          {meta.join(" · ")}
        </p>
      ) : null}

      <span
        className={cn(
          "mt-2 inline-flex items-center gap-1 border-2 px-4 py-2 font-mono text-[11px] tracking-[0.1em] uppercase transition-all duration-300 group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none",
          isA
            ? // white (not cream) text — cream on jersey-deep is 4.04:1, below AA
              "border-cream text-white shadow-[3px_3px_0_0_var(--color-cream)]"
            : "border-ink text-ink shadow-[3px_3px_0_0_var(--color-ink)]",
        )}
      >
        Bekijk ploeg →
      </span>
    </div>
  );

  return (
    <Link
      href={href}
      data-testid="team-flagship"
      data-variant={variant}
      aria-label={`${category} — bekijk ploeg`}
      className={cn("group block", className)}
    >
      <TapedCard
        as="div"
        bg={isA ? "jersey-deep" : "cream"}
        // Original literal offset was 5px; `md` (6px) is the nearest token.
        shadow="md"
        padding="none"
        interactive={false}
        className={cn(
          "grid grid-cols-1",
          // Photo is always the 1fr column, content the 1.25fr column. A puts
          // content left; B mirrors to photo left — so the track order flips.
          isA ? "sm:grid-cols-[1.25fr_1fr]" : "sm:grid-cols-[1fr_1.25fr]",
        )}
      >
        {isA ? (
          <>
            {content}
            {photo}
          </>
        ) : (
          <>
            {/* Mirrored: photo-left / content-right. Source order keeps photo
                first; on mobile (single column) photo stays on top for both. */}
            {photo}
            {content}
          </>
        )}
      </TapedCard>
    </Link>
  );
}
