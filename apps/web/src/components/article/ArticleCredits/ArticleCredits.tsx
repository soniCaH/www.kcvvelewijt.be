import {
  resolveSubject,
  type IndexedSubject,
} from "@/components/article/SubjectAttribution";
import { formatArticleDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

/**
 * <ArticleCredits> — net-new Phase 5 closing credits block (5.d-int
 * Round 2 lock, renamed from `<InterviewCredits>` for variant-agnostic
 * reuse).
 *
 * Centered framed block sitting between `<EndMark>` and `<VerderLezenRow>`
 * in the article footer. Composes four optional rows in fixed order:
 *
 *   ─────────────────────────────────
 *   Door            {author}
 *   Met             {subjects[]}
 *   Beeld           {photographer}
 *   Gepubliceerd    {publishedAt}
 *   ─────────────────────────────────
 *
 * Every row is conditional: drop the row when its source field is blank.
 * The interview variant renders at minimum `Met` + `Gepubliceerd` (the
 * subjects[] validator guarantees subjects on interviews; publishedAt is
 * populated on any published doc). Other variants only render when at
 * least one of `author`, `photographer`, or `subjects[]` is populated;
 * the page-level wrapper is responsible for skipping the block entirely
 * when nothing would render — the component itself returns `null` in
 * that case as a defensive fallback.
 *
 * Typography (locked):
 *   - Key: mono caps `--font-mono`, 10px, letter-spacing 0.16em,
 *     ink-muted colour.
 *   - Name/date: italic Freight Display 700, 17px, ink colour.
 *
 * Container: prose width (`--container-prose: 680px`), centered, with
 * 1px ink rules top + bottom and no side rules.
 */
export interface ArticleCreditsProps {
  /**
   * `article.author` — rendered after `Door`. Omit the row when blank.
   */
  author?: string | null;
  /**
   * `article.photographer` — rendered after `Beeld`. Omit when blank.
   */
  photographer?: string | null;
  /**
   * `article.subjects[]` — joined into a comma-separated name list
   * after `Met`. Omit the row when the resolved list is empty.
   * Subjects that don't resolve (missing references, empty custom name)
   * are silently dropped from the list.
   */
  subjects?: IndexedSubject[] | null;
  /**
   * `article.publishedAt` ISO string. Rendered after `Gepubliceerd` as
   * `d MMMM yyyy` (per `formatArticleDate`). Omit the row when blank.
   */
  publishedAt?: string | null;
  className?: string;
}

interface CreditRow {
  key: string;
  label: string;
  value: string;
}

function resolveSubjectNames(
  subjects: IndexedSubject[] | null | undefined,
): string[] {
  if (!Array.isArray(subjects)) return [];
  return subjects
    .map((s) => resolveSubject(s)?.name)
    .filter((n): n is string => typeof n === "string" && n.length > 0);
}

function buildRows({
  author,
  photographer,
  subjects,
  publishedAt,
}: ArticleCreditsProps): CreditRow[] {
  const rows: CreditRow[] = [];
  const trimmedAuthor = author?.trim();
  if (trimmedAuthor) {
    rows.push({ key: "door", label: "Door", value: trimmedAuthor });
  }
  const subjectNames = resolveSubjectNames(subjects);
  if (subjectNames.length > 0) {
    rows.push({ key: "met", label: "Met", value: subjectNames.join(", ") });
  }
  const trimmedPhotographer = photographer?.trim();
  if (trimmedPhotographer) {
    rows.push({ key: "beeld", label: "Beeld", value: trimmedPhotographer });
  }
  const trimmedDate = publishedAt?.trim();
  if (trimmedDate) {
    rows.push({
      key: "gepubliceerd",
      label: "Gepubliceerd",
      value: formatArticleDate(trimmedDate),
    });
  }
  return rows;
}

export function ArticleCredits(props: ArticleCreditsProps) {
  const rows = buildRows(props);
  if (rows.length === 0) return null;

  return (
    <aside
      data-article-credits="true"
      aria-label="Credits"
      className={cn(
        "border-ink mx-auto my-12 w-full border-t border-b px-7 py-6 text-center",
        props.className,
      )}
      style={{ maxWidth: "var(--container-prose)" }}
    >
      <dl className="m-0 flex flex-col gap-2">
        {rows.map((row) => (
          <div
            key={row.key}
            data-article-credits-row={row.key}
            className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1"
          >
            <dt
              data-article-credits="label"
              className="text-ink-muted m-0 font-mono text-[10px] leading-none tracking-[0.16em] uppercase"
            >
              {row.label}
            </dt>
            <dd
              data-article-credits="value"
              className="text-ink font-display m-0 text-[17px] leading-tight font-bold italic"
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
