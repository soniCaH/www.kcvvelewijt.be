import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
  resolveSubject,
  type SubjectValue,
  type ResolvedSubject,
} from "./resolveSubject";

export type SubjectAttributionVariant = "quote" | "key";

export interface SubjectAttributionProps {
  subject: SubjectValue | null | undefined;
  variant: SubjectAttributionVariant;
  className?: string;
}

/**
 * Shared attribution block used by the `key` and `quote` qaBlock
 * treatments (design §6.2 and §6.3).
 *
 * - `quote`: 2 rem × 2 px green rule prefix, Montserrat 500 small-caps name,
 *   optional role after a separator. No photo — the quote glyph carries the
 *   visual weight.
 * - `key`: IBM Plex Mono numeral (jersey number for players, plain dash for
 *   staff/custom) followed by the small-caps name and role. No photo — the
 *   surrounding `key` block renders the portrait cutout separately.
 *
 * Returns `null` if the subject cannot be resolved (missing reference, empty
 * custom name). Caller should guard the whole attribution row in that case.
 */
export const SubjectAttribution = ({
  subject,
  variant,
  className,
}: SubjectAttributionProps) => {
  const resolved = resolveSubject(subject);
  if (!resolved) return null;

  if (variant === "quote") {
    return <QuoteAttribution resolved={resolved} className={className} />;
  }
  return <KeyAttribution resolved={resolved} className={className} />;
};

const QuoteAttribution = ({
  resolved,
  className,
}: {
  resolved: ResolvedSubject;
  className?: string;
}) => (
  <div
    data-testid="subject-attribution-quote"
    className={cn(
      "flex items-center justify-center gap-4 text-sm uppercase tracking-[var(--letter-spacing-caps)] text-kcvv-gray-dark",
      className,
    )}
  >
    <span
      aria-hidden="true"
      className="inline-block h-0.5 w-8 bg-kcvv-green-bright"
    />
    <span className="font-body font-medium">
      {resolved.name}
      {resolved.role ? (
        <span className="text-kcvv-gray-dark/70">
          {" · "}
          {resolved.role}
        </span>
      ) : null}
    </span>
  </div>
);

const KeyAttribution = ({
  resolved,
  className,
}: {
  resolved: ResolvedSubject;
  className?: string;
}) => (
  <div
    data-testid="subject-attribution-key"
    className={cn(
      "flex items-baseline gap-3 text-sm uppercase tracking-[var(--letter-spacing-caps)] text-kcvv-gray-dark",
      className,
    )}
  >
    {resolved.jerseyNumber != null ? (
      <span aria-hidden="true" className="font-mono text-kcvv-green-dark">
        #{resolved.jerseyNumber}
      </span>
    ) : null}
    <span className="font-body font-medium">
      {resolved.name}
      {resolved.role && resolved.jerseyNumber == null ? (
        <span className="text-kcvv-gray-dark/70">
          {" · "}
          {resolved.role}
        </span>
      ) : null}
    </span>
  </div>
);

/**
 * Rectangular portrait frame for the subject photo — used by `QaPairKey`
 * and future templates. Intentionally a fixed aspect ratio + `object-cover`
 * so psdImage (90% case) renders as a portrait crop; transparent images
 * still compose against the parent surface colour. See
 * `feedback_subject_photo_fallback` memory.
 */
export interface SubjectPhotoProps {
  subject: SubjectValue | null | undefined;
  /** Tailwind class controlling the frame width (height follows aspect). */
  className?: string;
  priority?: boolean;
}

export const SubjectPhoto = ({
  subject,
  className,
  priority = false,
}: SubjectPhotoProps) => {
  const resolved = resolveSubject(subject);
  if (!resolved?.photoUrl) return null;
  return (
    <div
      data-testid="subject-photo"
      className={cn(
        "relative aspect-[4/5] w-full overflow-hidden rounded-md bg-kcvv-gray-light/30",
        className,
      )}
    >
      <Image
        src={resolved.photoUrl}
        alt={resolved.name}
        fill
        priority={priority}
        sizes="(max-width: 768px) 70vw, 380px"
        className="object-cover object-top"
      />
    </div>
  );
};
