import { PortableText, type PortableTextBlock } from "@portabletext/react";
import {
  resolveSubject,
  SubjectAttribution,
  SubjectPhoto,
  type SubjectValue,
} from "@/components/article/SubjectAttribution";
import { cn } from "@/lib/utils/cn";

export interface QaPairKeyProps {
  question: string;
  answer: PortableTextBlock[];
  subject: SubjectValue | null | undefined;
}

const QuestionLabel = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <p
    className={cn(
      "text-kcvv-green-dark text-xs font-semibold tracking-[var(--letter-spacing-label)] uppercase",
      className,
    )}
  >
    {children}
  </p>
);

/**
 * Design §6.2 — the `key` treatment promotes an answer to display copy on
 * a full-bleed cream band.
 *
 * Layout decision matrix:
 *   - resolvable subject WITH photo → two-column: cutout + caption on one
 *     side, answer + attribution on the other.
 *   - resolvable subject WITHOUT photo (legacy custom missing photo, or
 *     unresolvable reference) → single-column: caption above answer, text
 *     attribution below. We never render an orphan caption above an empty
 *     photo slot.
 *   - unresolvable subject → single-column without attribution.
 *
 * Portrait cropping: `SubjectPhoto` uses a bounded `aspect-[4/5]` frame
 * with `object-cover`, so psdImage (90% case) renders as a clean portrait
 * and transparentImage (10% case) still composes against the cream band.
 */
export const QaPairKey = ({ question, answer, subject }: QaPairKeyProps) => {
  const resolvedSubject = resolveSubject(subject);
  const hasPhoto =
    resolvedSubject !== null && resolvedSubject.photoUrl !== null;
  const hasAttribution = resolvedSubject !== null;

  return (
    <section
      data-testid="qa-pair-key"
      // `my-10` gives the full-bleed cream band an explicit, symmetric
      // breathing zone against the surrounding standard pairs — matches the
      // 40 px rhythm between consecutive standards (hr my-10) so that the
      // top and bottom margins of breakout blocks are visibly equal.
      className="full-bleed my-10 bg-[var(--color-foundation-gray-light)] py-16 md:py-32"
    >
      <div
        className={cn(
          "max-w-inner-lg mx-auto grid gap-10 px-6 md:items-center md:gap-16",
          hasPhoto && "md:grid-cols-[minmax(0,35%)_1fr]",
        )}
      >
        {hasPhoto && (
          <div className="mx-auto w-full max-w-[70vw] md:max-w-[380px]">
            <QuestionLabel className="mb-4">{question}</QuestionLabel>
            <SubjectPhoto subject={subject} />
          </div>
        )}

        <div>
          {!hasPhoto && (
            <QuestionLabel className="mb-6">{question}</QuestionLabel>
          )}
          <div className="border-kcvv-gray-light max-w-[40rem] border-y py-8">
            <div className="font-title text-kcvv-gray-blue text-[clamp(1.75rem,3.5vw,2.5rem)] leading-[1.25] font-normal">
              <PortableText value={answer} />
            </div>
          </div>
          {hasAttribution && (
            <div className="mt-6">
              <SubjectAttribution subject={subject} variant="key" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
