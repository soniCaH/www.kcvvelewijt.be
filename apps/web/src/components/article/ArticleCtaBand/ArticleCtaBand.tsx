import { CtaBand } from "@/components/design-system";
import {
  resolveInternalLinkHref,
  type InternalLinkReference,
} from "@/lib/utils/resolve-internal-link-href";

export interface ArticleCtaBandProps {
  question?: string | null;
  emphasis?: string | null;
  lead?: string | null;
  buttonLabel?: string | null;
  href?: string | null;
  reference?: InternalLinkReference | null;
}

/**
 * Resolves `href` / `reference` to a single destination, or `null` when
 * neither works — an archived team's reference (#3000: retired PSD teams
 * have no page any more, mirroring `<ArticleBody>`'s own internalLink
 * guard) or a reference `resolveInternalLinkHref` can't turn into a route.
 */
function resolveHref({
  href,
  reference,
}: Pick<ArticleCtaBandProps, "href" | "reference">): string | null {
  if (reference) {
    if (reference._type === "team" && reference.archived === true) {
      return null;
    }
    const resolved = resolveInternalLinkHref(reference);
    return resolved === "#" ? null : resolved;
  }
  const trimmedHref = href?.trim();
  return trimmedHref ? trimmedHref : null;
}

/**
 * <ArticleCtaBand> — the optional, editor-filled call-to-action closing an
 * article (`article.callToAction`). Maps the view-model field onto the
 * shared `<CtaBand>` and returns `null` whenever the field is empty or
 * incomplete — the schema keeps the object either fully empty or fully
 * valid, but a draft, a legacy document, or an unresolvable reference can
 * still reach here, so the component re-checks rather than trusting the
 * schema at render time.
 */
export function ArticleCtaBand({
  question,
  emphasis,
  lead,
  buttonLabel,
  href,
  reference,
}: ArticleCtaBandProps) {
  const trimmedQuestion = question?.trim();
  const trimmedLead = lead?.trim();
  const trimmedButtonLabel = buttonLabel?.trim();
  const resolvedHref = resolveHref({ href, reference });

  if (
    !trimmedQuestion ||
    !trimmedLead ||
    !trimmedButtonLabel ||
    !resolvedHref
  ) {
    return null;
  }

  const trimmedEmphasis = emphasis?.trim();

  return (
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
  );
}
