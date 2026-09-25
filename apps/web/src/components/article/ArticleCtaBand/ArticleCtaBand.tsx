import { CtaBand } from "@/components/design-system";
import { ArticleCtaAnalytics } from "@/components/article/ArticleCtaAnalytics";
import {
  resolveInternalLinkHref,
  type InternalLinkReference,
} from "@/lib/utils/resolve-internal-link-href";

export interface ArticleCallToAction {
  question?: string | null;
  emphasis?: string | null;
  lead?: string | null;
  buttonLabel?: string | null;
  href?: string | null;
  reference?: InternalLinkReference | null;
}

export interface ArticleCtaBandProps {
  articleId: string;
  articleType: string | null | undefined;
  callToAction?: ArticleCallToAction | null;
}

/**
 * Resolves `href` / `reference` to a single destination, or `null` when
 * neither works — `resolveInternalLinkHref` already folds in the archived-
 * team guard (#3000) and the missing-identifier case.
 */
function resolveHref({
  href,
  reference,
}: Pick<ArticleCallToAction, "href" | "reference">): string | null {
  if (reference) {
    return resolveInternalLinkHref(reference);
  }
  const trimmedHref = href?.trim();
  return trimmedHref ? trimmedHref : null;
}

/**
 * <ArticleCtaBand> — the optional, editor-filled call-to-action closing an
 * article (`article.callToAction`). Maps the view-model field onto the
 * shared `<CtaBand>` and renders nothing — no band, no analytics listener —
 * whenever the field is empty or incomplete. The schema keeps the object
 * either fully empty or fully valid, but a draft, a legacy document, or an
 * unresolvable reference can still reach here, so the component re-checks
 * rather than trusting the schema at render time. Owns mounting
 * `<ArticleCtaAnalytics>` itself so the click-delegation listener only
 * exists on the pages that actually have a button to delegate for.
 */
export function ArticleCtaBand({
  articleId,
  articleType,
  callToAction,
}: ArticleCtaBandProps) {
  const trimmedQuestion = callToAction?.question?.trim();
  const trimmedLead = callToAction?.lead?.trim();
  const trimmedButtonLabel = callToAction?.buttonLabel?.trim();
  const resolvedHref = resolveHref({
    href: callToAction?.href,
    reference: callToAction?.reference,
  });

  if (
    !trimmedQuestion ||
    !trimmedLead ||
    !trimmedButtonLabel ||
    !resolvedHref
  ) {
    return null;
  }

  const trimmedEmphasis = callToAction?.emphasis?.trim();

  return (
    <ArticleCtaAnalytics articleId={articleId} articleType={articleType}>
      <CtaBand
        ariaLabel={trimmedQuestion}
        heading={trimmedQuestion}
        emphasis={
          trimmedEmphasis ? { text: trimmedEmphasis, tone: "warm" } : undefined
        }
        lead={trimmedLead}
        buttonLabel={trimmedButtonLabel}
        href={resolvedHref}
        buttonData={{ "data-article-cta": "true" }}
      />
    </ArticleCtaAnalytics>
  );
}
