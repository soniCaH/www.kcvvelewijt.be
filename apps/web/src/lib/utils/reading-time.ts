const WORDS_PER_MINUTE = 200;
const MIN_WORDS_TO_ESTIMATE = 20;

interface AnyPortableChild {
  text?: string;
}

/**
 * One respondent inside a `qaPair`. The answer lives here, per respondent —
 * NOT on the pair. Two respondents on one pair is two people answering the
 * same question (`packages/sanity-schemas/src/qaBlock.ts` → `qaPairRespondent`).
 */
interface AnyQaRespondent {
  answer?: AnyBlockItem[];
}

/**
 * One question and everyone who answered it. Mirrors the `qaPair` schema.
 *
 * This shape is load-bearing. Until #2521 it declared `answer?: AnyBlockItem[]`
 * directly on the pair — a field the CMS has never produced. The traversal read
 * it, always got `undefined`, and silently counted questions only, so a
 * 1,190-word interview advertised "1 min lezen". Neither type-checker could see
 * it: the type described the bug rather than the data.
 */
interface AnyQaPair {
  question?: string;
  respondents?: AnyQaRespondent[];
}

interface AnyBlockItem {
  _type?: string;
  children?: AnyPortableChild[];
  pairs?: AnyQaPair[];
  /** `pullQuote` only (#2517) — its own Portable Text body. */
  body?: AnyBlockItem[];
}

/**
 * Recursively collect visible text from a Sanity article body — handles the
 * standard `block` type, the custom `qaBlock` (whose pairs nest their
 * answers one level deeper, inside each respondent), and `pullQuote` (whose
 * own `body` is itself a small Portable Text array). Returns a single
 * whitespace-joined string.
 *
 * The estimate is over **authored** text, not rendered text, and deliberately
 * so — it is a reading estimate, not a layout measurement. Two known gaps, both
 * small and both in `QaBlock.tsx`: a `key`/`quote`-tagged pair renders only
 * `respondents[0]` (`:210`), and a pair whose `respondentKey` resolves to no
 * subject is dropped entirely (`:249`). Both cases count text the page does not
 * show. Chasing exact parity would mean duplicating the renderer's subject
 * resolution here, which costs more than the minute it could shift.
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
            const answers = (pair.respondents ?? [])
              .map((respondent) => extractBodyText(respondent.answer))
              .join(" ");
            return `${q} ${answers}`;
          })
          .join(" ");
      }
      if (item._type === "pullQuote" && Array.isArray(item.body)) {
        return extractBodyText(item.body);
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
