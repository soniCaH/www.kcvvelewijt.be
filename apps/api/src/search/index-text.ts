export function buildResponsibilityIndexText(doc: {
  title: string;
  question: string;
  keywords: readonly string[];
  summary: string;
}): string {
  return [doc.title, doc.question, doc.keywords.join(" "), doc.summary]
    .filter(Boolean)
    .join(". ");
}

export function buildArticleIndexText(doc: {
  title: string;
  tags: readonly string[];
  bodyText: string | null;
}): string {
  return [doc.title, doc.tags.join(" "), doc.bodyText ?? ""]
    .filter(Boolean)
    .join(". ");
}

export function buildPageIndexText(doc: {
  title: string;
  bodyText: string | null;
}): string {
  return [doc.title, doc.bodyText ?? ""].filter(Boolean).join(". ");
}
