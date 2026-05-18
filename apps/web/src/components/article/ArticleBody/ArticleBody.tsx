import { PortableText } from "@portabletext/react";
import type {
  PortableTextBlock,
  PortableTextComponents,
} from "@portabletext/react";
import type { ReactNode } from "react";
import { DropCapParagraph } from "@/components/design-system/DropCapParagraph";
import { EndMark } from "@/components/design-system/EndMark";
import {
  PullQuote,
  type PullQuoteTone,
} from "@/components/design-system/PullQuote";
import { QASectionDivider } from "@/components/design-system/QASectionDivider";
import { SubjectAvatar } from "@/components/design-system/SubjectAvatar";
import {
  resolvePairRespondent,
  resolveSubject,
  type IndexedSubject,
} from "@/components/article/SubjectAttribution";
import { cn } from "@/lib/utils/cn";

/**
 * <ArticleBody> — shared article-body container for every articleType.
 *
 * Renders the Sanity Portable Text body at `--container-prose` width on a
 * cream surface and emits Phase 1 + Phase 5 primitives in PT-block order:
 *
 *   - First normal paragraph wraps in <DropCapParagraph tone="ink">.
 *   - `accent` mark renders italic + jersey-deep (5.A.1).
 *   - `h2` block delegates to <QASectionDivider> for the section-break
 *     treatment (5.d3 lock).
 *   - `pullQuote` block renders <PullQuote> with a <SubjectAvatar
 *     scale="attribution"> in the attribution slot (5.A.2 + 5.d2 lock).
 *     The serializer resolves `respondentKey` against the supplied
 *     `subjects[]` array. Falls back to inline-mono-caps attribution
 *     when the quote is external (no resolvable subject).
 *   - `<EndMark>` closes the body when any content was rendered.
 *
 * Variant-specific PT block types (qaBlock, transferFact, eventFact, ...)
 * wire in subsequent sub-issues (5.B.*). Unknown block types fall through
 * to PortableText's default behaviour (silent no-op).
 *
 * The expected `pullQuote` PT block shape (renderer-side, schema follow-up
 * tracked in PRD §11):
 *
 * ```ts
 * type PullQuoteBlock = {
 *   _type: "pullQuote";
 *   _key: string;
 *   body: string;
 *   tone?: "cream" | "ink" | "jersey";   // default "cream"
 *   respondentKey?: string;              // matches subjects[]._key
 *   emphasis?: string;                   // optional substring for HighlighterStroke
 *   externalName?: string;               // fallback name when no respondent
 *   externalRole?: string;
 *   externalSource?: string;
 * };
 * ```
 */
export interface ArticleBodyProps {
  content: PortableTextBlock[];
  /**
   * Article-level subjects passed through to the `pullQuote` serializer
   * so a `respondentKey` can resolve back to a `SubjectValue` and render
   * the `<SubjectAvatar>` + display name. On non-interview articles
   * (transfer / event / announcement) this is typically `null` and every
   * pull-quote falls back to the external-attribution path.
   */
  subjects?: IndexedSubject[] | null;
  className?: string;
}

interface PullQuoteBlock {
  _type: "pullQuote";
  _key?: string;
  body?: string;
  tone?: PullQuoteTone;
  respondentKey?: string;
  emphasis?: string;
  externalName?: string;
  externalRole?: string;
  externalSource?: string;
}

type PortableTextSpanLike = {
  _type?: string;
  text?: string;
  marks?: string[];
};

type PortableTextBlockLike = {
  _type?: string;
  style?: string;
  children?: PortableTextSpanLike[];
};

function isNormalParagraph(block: PortableTextBlock): boolean {
  if (block._type !== "block") return false;
  const style = (block as PortableTextBlockLike).style;
  return style === undefined || style === "normal";
}

function extractBlockText(block: PortableTextBlock): string {
  const children = (block as PortableTextBlockLike).children;
  if (!Array.isArray(children)) return "";
  return children
    .map((span) => span.text ?? "")
    .join("")
    .trim();
}

/**
 * Does the block actually render something? Used to decide whether
 * `<EndMark />` should appear at the bottom of the body — an article
 * whose `content` is non-empty but contains only empty paragraphs or an
 * empty `pullQuote` block shouldn't get an orphan closer below blank
 * space.
 *
 * Known block types: `block` (paragraph / heading — empty = no text),
 * `pullQuote` (empty = no `body`). Unknown types are assumed to render
 * (forward-compat for future serializers like qaBlock / transferFact).
 */
function blockHasRenderableOutput(block: PortableTextBlock): boolean {
  if (block._type === "block") {
    return extractBlockText(block).length > 0;
  }
  if (block._type === "pullQuote") {
    return ((block as PullQuoteBlock).body ?? "").trim().length > 0;
  }
  return true;
}

function renderPullQuote(
  value: PullQuoteBlock,
  subjects: IndexedSubject[] | null,
): ReactNode {
  const body = value.body?.trim();
  if (!body) return null;

  const respondent = resolvePairRespondent(value.respondentKey, subjects);
  const resolved = resolveSubject(respondent);

  // Wrap every pull-quote in a vertical spacer so consecutive body
  // paragraphs don't collide with the card edges. Matches the rhythm
  // <QASectionDivider> (also `my-10`) establishes for body inserts.
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <div data-pullquote-spacer="true" className="my-10">
      {children}
    </div>
  );

  if (resolved && respondent) {
    // KCVV subject path — render the avatar slot with the resolved
    // subject's first letter + photo (when present).
    const firstNameFromRef =
      (respondent.kind === "player" && respondent.playerRef?.firstName) ||
      (respondent.kind === "staff" && respondent.staffRef?.firstName) ||
      (respondent.kind === "custom" && respondent.customName) ||
      resolved.name;
    return (
      <Wrapper>
        <PullQuote
          tone={value.tone ?? "cream"}
          attribution={{
            name: resolved.name,
            role: resolved.role || undefined,
          }}
          emphasis={value.emphasis ? { text: value.emphasis } : undefined}
          avatarSlot={
            <SubjectAvatar
              firstName={firstNameFromRef || resolved.name}
              fullName={resolved.name}
              photoUrl={resolved.photoUrl}
              scale="attribution"
            />
          }
        >
          {body}
        </PullQuote>
      </Wrapper>
    );
  }

  // External-source path — no KCVV subject reference; render the inline
  // mono-caps attribution row with whatever external fields the block
  // carries. Skip the row entirely if no attribution was authored.
  const externalName = value.externalName?.trim();
  if (!externalName) {
    return (
      <Wrapper>
        <PullQuote
          tone={value.tone ?? "cream"}
          attribution={{ name: "" }}
          emphasis={value.emphasis ? { text: value.emphasis } : undefined}
        >
          {body}
        </PullQuote>
      </Wrapper>
    );
  }
  return (
    <Wrapper>
      <PullQuote
        tone={value.tone ?? "cream"}
        attribution={{
          name: externalName,
          role: value.externalRole?.trim() || undefined,
          source: value.externalSource?.trim() || undefined,
        }}
        emphasis={value.emphasis ? { text: value.emphasis } : undefined}
      >
        {body}
      </PullQuote>
    </Wrapper>
  );
}

function buildComponents(
  subjects: IndexedSubject[] | null,
): PortableTextComponents {
  return {
    block: {
      // h2 body headings delegate to <QASectionDivider> per the 5.d3 lock:
      // "<QASectionDivider title> is the Phase 3-b lock and ships verbatim."
      // The body h2 is the section-break treatment; QASectionDivider already
      // emits the italic centered title flanked by rules + ✦ glyphs, with
      // `accent` decorator support inside the title. We hand it the raw PT
      // block as its single-block title so any inline `accent` marks ride
      // through to the divider's accent renderer.
      h2: ({ value }: { value?: PortableTextBlock }) => {
        if (!value) return null;
        return <QASectionDivider title={[value]} />;
      },
    },
    types: {
      pullQuote: ({ value }: { value: PullQuoteBlock }) =>
        renderPullQuote(value, subjects),
    },
    marks: {
      // accent — italic + jersey-deep inline emphasis. The schema decorator
      // is not exposed on `article.body` today; the serializer ships ahead
      // of the schema migration so the renderer is forward-compatible. See
      // PRD §11 (Open follow-ups).
      accent: ({ children }: { children?: ReactNode }) => (
        <em className="text-jersey-deep font-black italic">{children}</em>
      ),
    },
  };
}

export function ArticleBody({
  content,
  subjects = null,
  className,
}: ArticleBodyProps) {
  const dropCapIdx = content.findIndex(isNormalParagraph);
  const hasDropCap = dropCapIdx >= 0;
  const dropCapBlock = hasDropCap ? content[dropCapIdx] : null;
  const dropCapText = dropCapBlock ? extractBlockText(dropCapBlock) : "";
  const beforeDropCap = hasDropCap ? content.slice(0, dropCapIdx) : content;
  const afterDropCap = hasDropCap ? content.slice(dropCapIdx + 1) : [];

  const components = buildComponents(subjects);
  // EndMark closes the body — only when at least one block in `content`
  // actually emits output. An article with only empty paragraphs or an
  // empty pullQuote block should NOT get an orphan closer at the bottom.
  const hasRenderableBody = content.some(blockHasRenderableOutput);

  return (
    <div
      data-article-body="true"
      className={cn("bg-cream w-full px-4 py-12 lg:px-0 lg:py-16", className)}
    >
      <div
        className="mx-auto w-full"
        style={{ maxWidth: "var(--container-prose)" }}
      >
        {beforeDropCap.length > 0 ? (
          <PortableText value={beforeDropCap} components={components} />
        ) : null}
        {hasDropCap && dropCapText.length > 0 ? (
          <DropCapParagraph tone="ink">{dropCapText}</DropCapParagraph>
        ) : null}
        {afterDropCap.length > 0 ? (
          <PortableText value={afterDropCap} components={components} />
        ) : null}
        {hasRenderableBody ? <EndMark /> : null}
      </div>
    </div>
  );
}
