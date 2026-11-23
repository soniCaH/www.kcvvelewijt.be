/**
 * What one gallery photo says when it cannot be seen (#2559 / #2548 rule 5).
 *
 * A gallery photo is the site's one genuinely alone image: nothing else on the
 * page names it. So it says its **position and extent** — never the collection,
 * which the page's own `<h1>` already names in the same section. The shipped
 * fallback was `Foto 1` … `Foto 55`, which located the reader nowhere.
 *
 * An authored alt always wins; there is no caption fallback, because a caption
 * renders visibly and rule 2 makes a captioned figure silent.
 */
export const galleryImageAlt = (
  image: { alt?: string | null },
  index: number,
  total: number,
): string => image.alt?.trim() || `Foto ${index + 1} van ${total}`;
