import Image from "next/image";
import {
  resolveSubject,
  type SubjectValue,
} from "@/components/article/SubjectAttribution";
import { cn } from "@/lib/utils/cn";

export interface InterviewHeroProps {
  title: string;
  subject: SubjectValue | null | undefined;
  coverImageUrl?: string | null;
  className?: string;
}

/**
 * Design §5.2 — interview-specific hero. The headline drops a size from the
 * announcement template to make room for a subtitle line (the subject's
 * full name), and the cover image crops to 4:5 portrait (taller than the
 * announcement 16:9) via Sanity CDN hotspot.
 *
 * Kicker composition:
 *   - subject.kind === 'player' with jersey + position: `INTERVIEW | #9 · MIDDENVELDER`
 *   - subject.kind === 'player' with only jersey:       `INTERVIEW | #9`
 *   - subject.kind === 'player' with only position:     `INTERVIEW | MIDDENVELDER`
 *   - any other subject state:                          `INTERVIEW`
 *
 * The transparent cutout is **not** used here — it is reserved for the
 * `key` qaBlock spread. The hero always renders the rectangular cover
 * image crop, falling back to a headline-only composition when
 * `coverImageUrl` is missing.
 */
export const InterviewHero = ({
  title,
  subject,
  coverImageUrl,
  className,
}: InterviewHeroProps) => {
  const resolved = resolveSubject(subject);
  const kickerParts = buildKickerParts(resolved);

  return (
    <header
      className={cn(
        "max-w-inner-lg mx-auto w-full px-6 pt-10 md:pt-16",
        className,
      )}
      data-testid="interview-hero"
    >
      <div className="max-w-[65ch]">
        <p
          className={cn(
            "mb-6 flex flex-wrap items-center gap-x-3 gap-y-1",
            "text-kcvv-green-dark text-xs font-semibold tracking-[var(--letter-spacing-label)] uppercase",
            "before:bg-kcvv-green-bright before:mr-1 before:block before:h-[2px] before:w-16 before:content-['']",
          )}
          data-testid="interview-hero-kicker"
        >
          <span>{kickerParts.type}</span>
          {kickerParts.meta.length > 0 && (
            <>
              <span aria-hidden="true" className="text-kcvv-gray-light">
                |
              </span>
              {kickerParts.meta.map((meta, i) => (
                <span key={`${i}-${meta}`}>
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className="text-kcvv-gray-light mr-1"
                    >
                      ·
                    </span>
                  )}
                  {meta}
                </span>
              ))}
            </>
          )}
        </p>

        <h1
          className="font-title text-kcvv-gray-blue text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.05] font-bold"
          data-testid="interview-hero-title"
          aria-describedby={
            resolved?.name ? "interview-hero-subject" : undefined
          }
        >
          {title}
        </h1>

        {resolved?.name && (
          <p
            id="interview-hero-subject"
            className="font-title text-kcvv-gray-dark mt-4 text-2xl font-normal"
            data-testid="interview-hero-subtitle"
          >
            {resolved.name}
          </p>
        )}
      </div>

      {coverImageUrl && (
        <div
          className="bg-kcvv-gray-light/30 relative mx-auto mt-10 aspect-[4/5] w-full max-w-[40rem] overflow-hidden rounded-[4px]"
          data-testid="interview-hero-image"
        >
          <Image
            src={coverImageUrl}
            // The h1 already carries the title and the subtitle carries the
            // subject name; repeating `title` here made screen readers
            // announce the same string twice. When a subject is resolvable
            // we describe the portrait explicitly (adds "Portret van …" —
            // info not in the h1/subtitle), otherwise the image is purely
            // decorative relative to the adjacent text and alt="" lets AT
            // skip it.
            alt={resolved?.name ? `Portret van ${resolved.name}` : ""}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 640px"
            className="object-cover object-center"
          />
        </div>
      )}
    </header>
  );
};

/**
 * Kicker composition per design §5.2: the article-type label is always
 * rendered, then a `|` separates it from the player-meta cluster (jersey
 * number · position). Empty meta segments are filtered so a player with
 * only a jersey or only a position still renders cleanly.
 */
interface KickerParts {
  type: string;
  meta: string[];
}

function buildKickerParts(
  resolved: ReturnType<typeof resolveSubject>,
): KickerParts {
  const meta: string[] = [];
  if (resolved?.jerseyNumber != null) meta.push(`#${resolved.jerseyNumber}`);
  if (resolved?.position) meta.push(resolved.position.toUpperCase());
  return { type: "Interview", meta };
}
