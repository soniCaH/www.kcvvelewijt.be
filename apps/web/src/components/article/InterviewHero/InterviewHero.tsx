import Image from "next/image";
import {
  resolveSubject,
  type IndexedSubject,
  type ResolvedSubject,
} from "@/components/article/SubjectAttribution";
import { cn } from "@/lib/utils/cn";

export interface InterviewHeroProps {
  title: string;
  /**
   * Article-level subjects (1–4). Drives the hero layout:
   *   N=1: single 4:5 portrait beneath the title (kicker meta populated
   *        when the subject is a player with jersey/position).
   *   N=2: side-by-side portrait pair (gap-x-6, container max-w-[40rem]).
   *   N=3: 3-column grid at desktop (container max-w-[48rem]).
   *   N=4: 2×2 grid (container max-w-[40rem]).
   * Empty array / undefined: title-only rendering (defensive — schema
   *   forbids this on interview articles but the runtime does not crash).
   */
  subjects: IndexedSubject[] | null | undefined;
  /** Used only when N=1 — for N≥2 the per-subject photos come from each
   *  subject's own `transparentImage`/`psdImage` URLs. */
  coverImageUrl?: string | null;
  className?: string;
}

/**
 * Design §5.2 + #1358 — multi-subject interview hero.
 *
 * Kicker rule (post-#1358):
 *   - N=1 with a player subject: `INTERVIEW | #9 · MIDDENVELDER`
 *     (falls through to bare `INTERVIEW` if jersey/position missing)
 *   - N=1 with staff or custom subject: `INTERVIEW`
 *   - N≥2 (any mix): `INTERVIEW` — the subtitle row (Dutch-Oxford-joined
 *     subject names) carries the duo/panel character on its own.
 *
 * Subtitle Dutch Oxford join:
 *   - N=1: sole subject's name ("Maxim Breugelmans")
 *   - N=2: "A & B" ("Maxim Breugelmans & Jeroen Van den Berghe")
 *   - N=3+: "A, B, … en Z" ("Max, Jeroen en Thomas")
 *
 * Portrait layout uses each subject's own resolved `photoUrl` — preferring
 * `transparentImage` when available and falling back to `psdImage` (see
 * `feedback_subject_photo_fallback`: ~90% of players only have psdImage).
 */
export const InterviewHero = ({
  title,
  subjects,
  coverImageUrl,
  className,
}: InterviewHeroProps) => {
  const arr = Array.isArray(subjects) ? subjects : [];
  const resolved = arr
    .map((s) => ({ item: s, resolved: resolveSubject(s) }))
    .filter(
      (x): x is { item: IndexedSubject; resolved: ResolvedSubject } =>
        x.resolved !== null,
    );
  const count = resolved.length;
  const kickerParts = buildKickerParts(count, resolved[0]?.resolved);
  const subtitle = joinNamesDutch(resolved.map((r) => r.resolved.name));

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
          aria-describedby={subtitle ? "interview-hero-subject" : undefined}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            id="interview-hero-subject"
            className="font-title text-kcvv-gray-dark mt-4 text-2xl font-normal"
            data-testid="interview-hero-subtitle"
          >
            {subtitle}
          </p>
        )}
      </div>

      {count === 1 && coverImageUrl && (
        <SinglePortrait
          coverImageUrl={coverImageUrl}
          subjectName={resolved[0].resolved.name}
        />
      )}

      {count >= 2 && <PortraitGrid subjects={resolved} />}
    </header>
  );
};

// ─── Kicker ───────────────────────────────────────────────────────────────

interface KickerParts {
  type: string;
  meta: string[];
}

/**
 * Post-#1358 kicker rule: meta slot populated only when N=1 and the sole
 * subject is a player. All other cases render bare `INTERVIEW`. The
 * subtitle row (joined subject names) carries the duo/panel character.
 */
function buildKickerParts(
  count: number,
  soleSubject: ResolvedSubject | undefined,
): KickerParts {
  if (count !== 1 || !soleSubject) return { type: "Interview", meta: [] };
  const meta: string[] = [];
  if (soleSubject.jerseyNumber != null)
    meta.push(`#${soleSubject.jerseyNumber}`);
  if (soleSubject.position) meta.push(soleSubject.position.toUpperCase());
  return { type: "Interview", meta };
}

// ─── Subtitle ─────────────────────────────────────────────────────────────

/**
 * Dutch Oxford-style name join:
 *   1 →  "A"
 *   2 →  "A & B"
 *   3+ → "A, B, … en Z"
 *
 * Empty or single-name arrays fall through to the obvious values. Empty
 * input returns an empty string so the subtitle row is simply not
 * rendered (InterviewHero guards on truthiness).
 */
function joinNamesDutch(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  const head = names.slice(0, -1).join(", ");
  return `${head} en ${names[names.length - 1]}`;
}

// ─── Portrait renderers ──────────────────────────────────────────────────

function SinglePortrait({
  coverImageUrl,
  subjectName,
}: {
  coverImageUrl: string;
  subjectName: string;
}) {
  return (
    <div
      className="bg-kcvv-gray-light/30 relative mx-auto mt-10 aspect-[4/5] w-full max-w-[40rem] overflow-hidden rounded-[4px]"
      data-testid="interview-hero-image"
    >
      <Image
        src={coverImageUrl}
        alt={subjectName ? `Portret van ${subjectName}` : ""}
        fill
        priority
        sizes="(max-width: 768px) 100vw, 640px"
        className="object-cover object-center"
      />
    </div>
  );
}

interface ResolvedEntry {
  item: IndexedSubject;
  resolved: ResolvedSubject;
}

function PortraitGrid({ subjects }: { subjects: ResolvedEntry[] }) {
  const count = subjects.length;
  // Grid columns + container width per N. N=4 uses a 2×2 grid at desktop
  // (two columns); N=3 uses three columns; N=2 uses two columns with a
  // tighter container to keep portraits readable.
  const gridClass =
    count === 2
      ? "grid-cols-2 max-w-[40rem]"
      : count === 3
        ? "grid-cols-3 max-w-[48rem]"
        : "grid-cols-2 max-w-[40rem]"; // N=4

  return (
    <div
      className={cn("mx-auto mt-10 grid gap-x-6 gap-y-6", gridClass)}
      data-testid="interview-hero-portrait-grid"
      data-subject-count={count}
    >
      {subjects.map(({ item, resolved }, i) => {
        const portraitUrl = resolved.photoUrl;
        return (
          <div
            key={item._key ?? `subject-${i}`}
            className="bg-kcvv-gray-light/30 relative aspect-[4/5] w-full overflow-hidden rounded-[4px]"
            data-testid="interview-hero-portrait"
          >
            {portraitUrl && (
              <Image
                src={portraitUrl}
                alt={resolved.name ? `Portret van ${resolved.name}` : ""}
                fill
                priority={i < 2}
                sizes="(max-width: 768px) 50vw, 320px"
                className="object-cover object-center"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
