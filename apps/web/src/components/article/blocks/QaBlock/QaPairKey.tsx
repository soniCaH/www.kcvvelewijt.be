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

/**
 * Design §6.2 — the `key` treatment promotes an answer to display copy on
 * a full-bleed cream band. When the article carries a resolvable subject
 * (≥90% of interviews), the portrait photo + caption float in a cutout
 * column alongside the display answer. When the subject cannot be resolved
 * (no ref, or ref not dereferenced yet), the whole pair collapses to a
 * single-column layout so we never render an orphan caption above an empty
 * photo slot.
 *
 * Portrait cropping: `SubjectPhoto` uses a bounded `aspect-[4/5]` frame
 * with `object-cover`, so psdImage (90% case) renders as a clean portrait
 * and transparentImage (10% case) still composes against the cream band.
 */
export const QaPairKey = ({ question, answer, subject }: QaPairKeyProps) => {
  const resolvedSubject = resolveSubject(subject);
  const showSubjectColumn = resolvedSubject !== null;

  return (
    <section
      data-testid="qa-pair-key"
      className="full-bleed bg-[var(--color-foundation-gray-light)] py-16 md:py-32"
    >
      <div
        className={cn(
          "max-w-inner-lg mx-auto px-6 grid gap-10 md:gap-16 md:items-start",
          showSubjectColumn && "md:grid-cols-[minmax(0,35%)_1fr]",
        )}
      >
        {showSubjectColumn && (
          <div className="mx-auto w-full max-w-[70vw] md:max-w-[380px]">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[var(--letter-spacing-label)] text-kcvv-green-dark">
              {question}
            </p>
            <SubjectPhoto subject={subject} />
          </div>
        )}

        <div className="md:self-center">
          {!showSubjectColumn && (
            <p className="mb-6 text-xs font-semibold uppercase tracking-[var(--letter-spacing-label)] text-kcvv-green-dark">
              {question}
            </p>
          )}
          <div className="border-y border-kcvv-gray-light py-8 max-w-[40rem]">
            <div className="font-title font-normal text-kcvv-gray-blue leading-[1.25] text-[clamp(1.75rem,3.5vw,2.5rem)]">
              <PortableText value={answer} />
            </div>
          </div>
          {showSubjectColumn && (
            <div className="mt-6">
              <SubjectAttribution subject={subject} variant="key" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
