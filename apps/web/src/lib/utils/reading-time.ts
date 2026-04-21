const WORDS_PER_MINUTE = 200;
const MIN_WORDS_TO_ESTIMATE = 20;

interface AnyPortableChild {
  text?: string;
}

interface AnyBlockItem {
  _type?: string;
  children?: AnyPortableChild[];
  pairs?: {
    question?: string;
    answer?: AnyBlockItem[];
  }[];
}

/**
 * Recursively collect visible text from a Sanity article body — handles the
 * standard `block` type and the custom `qaBlock` (whose pairs nest their own
 * `answer` block array). Returns a single whitespace-joined string.
 */
function extractBodyText(body: AnyBlockItem[] | null | undefined): string {
  if (!Array.isArray(body)) return "";
  return body
    .map((item) => {
      if (item._type === "block" && Array.isArray(item.children)) {
        return item.children
          .map((child) => (typeof child.text === "string" ? child.text : ""))
          .join("");
      }
      if (item._type === "qaBlock" && Array.isArray(item.pairs)) {
        return item.pairs
          .map((pair) => {
            const q = pair.question ?? "";
            const a = extractBodyText(pair.answer);
            return `${q} ${a}`;
          })
          .join(" ");
      }
      return "";
    })
    .join(" ");
}

/**
 * Estimate reading time from a Sanity article body, rendered as Dutch copy
 * (`"N min lezen"`). Returns `undefined` when the body is shorter than
 * {@link MIN_WORDS_TO_ESTIMATE} words — too short for a useful estimate
 * and metadata-bar clutter otherwise.
 *
 * Uses a fixed {@link WORDS_PER_MINUTE} of 200, a common reading-speed
 * baseline that matches most editorial sites.
 */
export function computeReadingTime(
  body: AnyBlockItem[] | null | undefined,
): string | undefined {
  const text = extractBodyText(body);
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words < MIN_WORDS_TO_ESTIMATE) return undefined;
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} min lezen`;
}
