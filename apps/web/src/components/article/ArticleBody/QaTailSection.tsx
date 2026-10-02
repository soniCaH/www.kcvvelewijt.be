import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { QaBlock } from "@/components/article/blocks/QaBlock";
import type { IndexedSubject } from "@/components/article/SubjectAttribution";
import type { QaBlockBlock } from "./qaBlocksToTailSection";

export interface QaTailSectionProps {
  /** `groupAtTail` qaBlocks hoisted out of the body by `qaBlocksToTailSection`. */
  blocks: QaBlockBlock[];
  subjects?: IndexedSubject[] | null;
}

/**
 * The Q&A section that closes an interview after `<EndMark>`
 * (`tail-qa-header-locked.md`, 5.d-tail-qa-header lock). Mirrors
 * `<ArticleBody>`'s shell pattern so the cream continues edge-to-edge:
 * outer = `bg-cream w-full`, inner = prose container at `--container-prose`.
 *
 * Owns the gap below it (#2531): `pb-8`, one 32px gap above the credits or
 * the related row. `<QaBlock>` ships its own `my-12`; the last block's bottom
 * margin would stack on that `pb-8`, so the list cancels it with
 * `[&>:last-child]:mb-0`. A selector rather than an index check on purpose:
 * `<QaBlock>` renders `null` for a block without pairs, and `:last-child`
 * targets the last block that actually rendered.
 */
export function QaTailSection({ blocks, subjects = null }: QaTailSectionProps) {
  return (
    <section
      data-qa-tail-section="true"
      aria-label="Q&A"
      className="bg-cream w-full px-4 pt-12 pb-8 sm:pt-16 lg:px-0"
    >
      <div
        className="mx-auto w-full"
        style={{ maxWidth: "var(--container-prose)" }}
      >
        <header className="mb-8 text-center">
          <EditorialHeading
            level={2}
            size="display-xl"
            emphasis={{ text: "Q&A", highlight: true }}
          >
            Q&amp;A.
          </EditorialHeading>
        </header>
        <div className="flex flex-col gap-12 [&>:last-child]:mb-0">
          {blocks.map((block) => (
            <QaBlock key={block._key} value={block} subjects={subjects} />
          ))}
        </div>
      </div>
    </section>
  );
}
