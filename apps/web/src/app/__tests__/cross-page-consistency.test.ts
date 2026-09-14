/**
 * Cross-page consistency guard
 *
 * The spec cut from #2425 decides thirty-four things that repeat across the
 * site's 31 public routes. A decision that lives only in a merged PR is a
 * decision the next route quietly re-invents, so each one that can be checked
 * statically lands here as a rule, and every later ticket sliced from #2556
 * appends to this file rather than starting a guard of its own.
 *
 * Shape, matching the two guards already in this directory: glob the tree,
 * assert one rule per file, and let an empty case list fail the run on its own
 * — vitest rejects an `it.each` with no cases, which is the property that makes
 * a guard trustworthy. A rule that silently matches nothing is worse than no
 * rule, because it reads like coverage.
 *
 * **Boundary:** the glob is `apps/web/src`. The BFF Worker (`apps/api`) is a
 * separate deploy with its own zone literal and its own `toLocale*` call, and
 * nothing here sees them — "site-wide" means this app, not this repo.
 *
 * @see https://github.com/soniCaH/www.kcvvelewijt.be/issues/2561
 */

import { describe, it, expect } from "vitest";
import { globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const srcDir = resolve(__dirname, "../..");

/** Every first-party source file, tests and stories included. */
const sourceFiles = globSync(["**/*.ts", "**/*.tsx"], { cwd: srcDir }).sort();

/**
 * Rules match code, not prose. Every banned pattern here is also the natural
 * way to *explain* the ban, so a docblock saying "replaces the raw
 * `toLocaleDateString`" would otherwise fail the file it documents — and the
 * fix a reader would reach for is deleting the explanation.
 *
 * One ordered alternation, not two passes. String literals come first, so a
 * comment-shaped substring inside one — this repo writes Storybook titles
 * ending in a slash-star wildcard — is consumed as a string before it can open
 * a phantom comment that swallows every declaration up to the next closing
 * delimiter. Literals are then re-emitted **verbatim**, because a rule may need
 * to read one: the zone below *is* a string.
 */
const COMMENT_OR_STRING =
  /"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`|\/\/[^\n]*|\/\*[\s\S]*?\*\//g;

/**
 * This file is the one no rule can read. It states every banned pattern twice —
 * once in prose and once as a regex literal — and a regex literal is quote-dense
 * enough (`["']`) that any tokenizer segments it as a string, which throws the
 * rest of the scan out of step. Excluded explicitly rather than left to luck.
 */
const SELF = "app/__tests__/cross-page-consistency.test.ts";

/** Read and strip once per file — every rule below scans the same tree. */
const code = new Map(
  sourceFiles
    .filter((relPath) => relPath !== SELF)
    .map((relPath) => [
      relPath,
      readFileSync(resolve(srcDir, relPath), "utf8").replace(
        COMMENT_OR_STRING,
        (token) => (token.startsWith("/") ? "" : token),
      ),
    ]),
);

/** Every file a rule may scan — the tree minus this file. */
const scannableSources = sourceFiles.filter((relPath) => relPath !== SELF);

// ---------------------------------------------------------------------------
// Rule 1 (#2430) — dates format through Luxon's `toFormat`, never `toLocale*`
// ---------------------------------------------------------------------------

/**
 * `toLocale*` resolves month and weekday names from whatever ICU data the
 * runtime happens to ship, which differs between Node, the browser and CI — so
 * the same date renders differently depending on where it is rendered, and
 * surfaces as visual-regression drift. `@/lib/utils/dates` states the rule; this
 * holds it site-wide. There is no allowlist: the shared date module itself
 * complies, so nothing needs an exemption.
 *
 * `toLocaleDateString` / `toLocaleTimeString` / `Intl.DateTimeFormat` are
 * unambiguously dates. Bare `.toLocaleString(` is not — it is also how a number
 * is formatted — so it counts only in a file that imports Luxon, which is the
 * only way a `DateTime.toLocaleString` call can be reached.
 */
const ALWAYS_BANNED =
  /\.toLocaleDateString\s*\(|\.toLocaleTimeString\s*\(|\bIntl\.DateTimeFormat\b/;
const LUXON_IMPORT = /from\s+["']luxon["']/;
const BARE_TO_LOCALE_STRING = /\.toLocaleString\s*\(/;

describe("dates format through Luxon `toFormat` (#2430)", () => {
  it.each(scannableSources)(
    "%s — no `toLocale*` date formatting",
    (relPath) => {
      const source = code.get(relPath)!;
      expect(ALWAYS_BANNED.test(source)).toBe(false);

      if (LUXON_IMPORT.test(source)) {
        expect(BARE_TO_LOCALE_STRING.test(source)).toBe(false);
      }
    },
  );
});

// ---------------------------------------------------------------------------
// Rule 2 (#2430) — the club timezone has one home
// ---------------------------------------------------------------------------

/**
 * A second zone literal is how the site ended up with four date homes and half
 * of them unpinned: each new one looked local and harmless. The zone is
 * `CLUB_TIMEZONE` in `@/lib/utils/dates`, and it is club-scoped rather than
 * event-scoped precisely because the narrow name is why non-event formatters
 * kept assuming it did not apply to them.
 *
 * Scoped to production source: a test or story may legitimately hold the zone
 * as data — `ical.test.ts` asserts the `TZID:` line of rendered iCal output,
 * which is the literal string, not a pin. The exemption for the home itself is
 * applied at this rule's own `it.each`, not baked into `productionSources` —
 * `dates.ts` is the file later rules will most want to check hardest, and it
 * must not inherit a blanket pass it never asked for.
 */
const CLUB_TIMEZONE_HOME = "lib/utils/dates.ts";
const ZONE_LITERAL = /["']Europe\/Brussels["']/;

/** Everything a rule about shipped behaviour should hold — no tests, no stories. */
const productionSources = scannableSources.filter(
  (relPath) => !/\.(test|stories)\.tsx?$/.test(relPath),
);

describe("the club timezone has one home (#2430)", () => {
  it.each(productionSources.filter((f) => f !== CLUB_TIMEZONE_HOME))(
    "%s — no second zone literal",
    (relPath) => {
      expect(ZONE_LITERAL.test(code.get(relPath)!)).toBe(false);
    },
  );
});

// ---------------------------------------------------------------------------
// Rule 3 (#2601) — no date is parsed in whatever zone the code happens to run in
// ---------------------------------------------------------------------------

/**
 * This is the rule that makes rule 2 load-bearing. Pinning the zone to one
 * constant achieves nothing while half the site's parses never name a zone at
 * all: those take the *runtime's*, which is UTC on Vercel, the visitor's in the
 * browser, and the machine's in CI. On a client component that is a hydration
 * mismatch rather than merely a wrong time, and it shipped as one — a fixture
 * without a kickoff time printed 15:00 on the server and 17:00 in a Belgian
 * browser (#2601).
 *
 * The two banned shapes:
 *
 * - **A parse with no options object.** A `DateTime.from…(value)` call whose
 *   only argument is the value has no `{ zone }`, so it lands in the runtime
 *   zone. The site's two parses — `toDisplayZone` for a stored instant,
 *   `toMatchDisplayZone` for a BFF match date's wall clock — both live in
 *   `dates.ts`, and a caller reaching past them is the drift this catches.
 * - **`DateTime.now()` / `DateTime.local(…)`** unless immediately re-zoned.
 *
 * **A later `.setZone` rescues some of these and not others**, which is why the
 * constructors are split into two lists rather than one.
 *
 * - `fromJSDate` / `fromMillis` / `fromSeconds` take an **instant**. The
 *   parse-time zone cannot change which moment they denote, so
 *   `fromJSDate(d).setZone(z)` really is zone-correct — it is `toDisplayZone`'s
 *   own body. Flagging it would make the rule fail a correct helper, and the
 *   cheap fix for that is deleting the rule.
 * - `fromISO` / `fromSQL` / `fromHTTP` / `fromRFC2822` / `fromFormat` /
 *   `fromObject` take **text or parts**. An offset-less input has already been
 *   read in the runtime zone by the time `setZone` runs, so no later call can
 *   recover it and there is no escape hatch.
 * - `now()` / `local(…)` have no input to misread, so `.setZone` settles them.
 *
 * **Arguments are split by a balanced scan, not by a regex.** The first version
 * of this rule matched the argument list with `[^,()]*`, which cannot span a
 * nested call — so `fromISO(value.trim())` and `fromJSDate(getDate())` were
 * silently unreachable, and `fromFormat`'s arm could never fire at all because
 * its format argument is mandatory. Widening the character class instead would
 * have flagged `fromISO(iso.trim(), { zone })`, a false positive on correct
 * code, which is the failure mode that gets a guard deleted. Counting *real*
 * arguments is the only version that gets both right, and it is a dozen lines.
 *
 * The scan skips string and template literals, so a comma inside a format
 * string (`fromFormat(psd, "dd, MM yyyy")`) does not read as an extra argument
 * and hide an unzoned call.
 *
 * An options argument that is an **object literal** must actually mention
 * `zone`: `fromISO(iso, { locale: "nl" })` names an option but not a zone, and
 * parses in the runtime zone exactly like the bare call. An options argument
 * passed as an identifier is accepted — the rule cannot see inside it, and
 * guessing would be the false positive again.
 *
 * Which zone is named is not checked: `{ zone: "utc" }` is a legitimate answer
 * for stored data, and rule 2 already holds the club zone to one home.
 *
 * **What it cannot see:** a parse that names a zone and names the wrong one.
 * The worst defect #2601 fixed was of that kind — the ICS feed converted a
 * match date it should have read, so it was zoned, pinned, and two hours late.
 * Nor can it see a date read without Luxon at all (`date.getHours()`, which is
 * how `lib/utils/match-time.ts` drifted). Choosing between the two parses stays
 * a reading decision, held by `toMatchDisplayZone`'s docblock and by tests.
 */

/** Every Luxon entry point that can land a value in the runtime zone. */
const PARSE_CALL =
  /\bDateTime\.(fromJSDate|fromISO|fromMillis|fromSeconds|fromFormat|fromObject|fromHTTP|fromRFC2822|fromSQL|now|local)\s*\(/g;

/**
 * Instant input: the parse-time zone cannot change which moment these denote,
 * so a later `.setZone` is a genuine fix — `fromJSDate(d).setZone(z)` is
 * `toDisplayZone`'s own body. Text and parts input get no such hatch, because
 * an offset-less value has already been read in the runtime zone by then.
 */
const RE_ZONABLE = new Set([
  "fromJSDate",
  "fromMillis",
  "fromSeconds",
  "now",
  "local",
]);

/** `fromFormat(text, format, opts?)` — its options sit one place further along. */
const OPTIONS_INDEX: Record<string, number> = { fromFormat: 2 };

/**
 * `now()` and `local(y, m, d, …)` read the clock rather than an input, and take
 * their options *last* rather than at a fixed slot — so their options argument
 * is found by looking for a trailing object literal, not by counting.
 */
const CLOCK_READS = new Set(["now", "local"]);

function optionsArg(method: string, args: string[]): string | undefined {
  if (!CLOCK_READS.has(method)) return args[OPTIONS_INDEX[method] ?? 1];
  const last = args.at(-1)?.trim();
  return last?.startsWith("{") ? last : undefined;
}

/**
 * Split a call's arguments at depth 0, honouring nesting and string literals.
 * `open` is the index of the call's `(`. Returns `null` for an unterminated
 * call, which a truncated or unparseable file can produce — treated as "not a
 * finding" rather than crashing the run.
 */
function topLevelArgs(source: string, open: number): string[] | null {
  const args: string[] = [];
  let depth = 0;
  let start = open + 1;
  let quote: string | null = null;

  for (let i = open; i < source.length; i++) {
    const ch = source[i]!;
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") {
      if (--depth > 0) continue;
      args.push(source.slice(start, i));
      // A zero-argument call reads as one empty argument; report none.
      return args.length === 1 && args[0]!.trim() === "" ? [] : args;
    } else if (ch === "," && depth === 1) {
      args.push(source.slice(start, i));
      start = i + 1;
    }
  }
  return null;
}

/** An options argument counts only if it could carry a zone. */
function namesZone(arg: string | undefined): boolean {
  if (arg === undefined) return false;
  const trimmed = arg.trim();
  // An object literal is readable, so read it. Anything else — an identifier, a
  // spread, a call — is opaque, and accepted rather than guessed at.
  return trimmed.startsWith("{") ? /\bzone\b/.test(trimmed) : true;
}

/** Every unzoned parse in one file, as the source text that produced it. */
function findRuntimeZoneParses(source: string): string[] {
  const found: string[] = [];
  for (const match of source.matchAll(PARSE_CALL)) {
    const method = match[1]!;
    const open = match.index + match[0].length - 1;
    const args = topLevelArgs(source, open);
    if (args === null) continue;

    if (namesZone(optionsArg(method, args))) continue;
    if (
      RE_ZONABLE.has(method) &&
      /^\s*\.setZone\s*\(/.test(source.slice(open + rest(source, open)))
    ) {
      continue;
    }
    found.push(match[0]);
  }
  return found;
}

/** Offset from a call's `(` to just past its matching `)`. */
function rest(source: string, open: number): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = open; i < source.length; i++) {
    const ch = source[i]!;
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if (ch === "(" || ch === "[" || ch === "{") depth++;
    else if (ch === ")" || ch === "]" || ch === "}") {
      if (--depth === 0) return i - open + 1;
    }
  }
  return source.length - open;
}

/** The two parses' home, and the only file allowed to reach for either shape. */
const DATE_PARSE_HOME = "lib/utils/dates.ts";

describe("no date is parsed in the runtime zone (#2601)", () => {
  it.each(productionSources.filter((f) => f !== DATE_PARSE_HOME))(
    "%s — every Luxon parse names a zone",
    (relPath) => {
      expect(findRuntimeZoneParses(code.get(relPath)!)).toEqual([]);
    },
  );
});

/**
 * The rule's own coverage, asserted against the shapes it exists to catch and
 * the near-misses it must leave alone. Without this the detector is a claim
 * nothing checks — and two of its arms silently matched nothing when first
 * written, which reads like coverage while providing none.
 */
describe("rule 3 catches what it claims to (#2601)", () => {
  it.each([
    ["DateTime.fromJSDate(date)"],
    ["DateTime.fromISO(iso)"],
    ["DateTime.fromISO(cursor).plus({ months: 1 })"],
    ["DateTime.now()"],
    ["DateTime.local(2026, 8, 3)"],
    ["DateTime.fromObject({ year, month, day: 1 })"],
    ["DateTime.fromObject({ year: 2026 })"],
    ['DateTime.fromFormat(psd, "yyyy-MM-dd HH:mm")'],
    ["DateTime.fromSQL(row.kickoff)"],
    ["DateTime.fromMillis(ms)"],
    // Nested calls — unreachable under the original `[^,()]*` argument match.
    ["DateTime.fromISO(value.trim())"],
    ["DateTime.fromJSDate(getDate())"],
    ['DateTime.fromFormat(value.trim(), "yyyy-MM-dd")'],
    ["DateTime.fromISO(build(a, b))"],
    // A comma inside the format string must not read as an options argument.
    ['DateTime.fromFormat(psd, "dd, MM yyyy")'],
    // Options present, but not a zone among them.
    ['DateTime.fromISO(iso, { locale: "nl" })'],
    // A parse's zone must be named at read time; `.setZone` comes too late.
    ["DateTime.fromISO(iso).setZone(CLUB_TIMEZONE)"],
  ])("flags %s", (snippet) => {
    expect(findRuntimeZoneParses(snippet)).toHaveLength(1);
  });

  it.each([
    ['DateTime.fromISO(iso, { zone: "utc" })'],
    ['DateTime.fromISO(iso.trim(), { zone: "utc" })'],
    ["DateTime.fromJSDate(d, { zone: CLUB_TIMEZONE })"],
    // Instant input: a later re-zone is a real fix, so it must not be flagged.
    ["DateTime.fromJSDate(d).setZone(CLUB_TIMEZONE)"],
    ["DateTime.fromMillis(ms).setZone(CLUB_TIMEZONE)"],
    ["DateTime.now().setZone(CLUB_TIMEZONE)"],
    ["DateTime.fromJSDate(getDate()).setZone(CLUB_TIMEZONE)"],
    ['DateTime.local(2026, 8, 3, { zone: "utc" })'],
    ["DateTime.fromObject({ year, month }, { zone: CLUB_TIMEZONE })"],
    ['DateTime.fromFormat(psd, "yyyy-MM-dd", { zone: CLUB_TIMEZONE })'],
    // Opaque options are accepted rather than guessed at.
    ["DateTime.fromISO(iso, opts)"],
    ["DateTime.utc(2026, 8, 3)"],
  ])("leaves %s alone", (snippet) => {
    expect(findRuntimeZoneParses(snippet)).toEqual([]);
  });

  it("reports every offender in a file, not just the first", () => {
    expect(
      findRuntimeZoneParses(
        "DateTime.fromISO(a); DateTime.fromJSDate(b); DateTime.now();",
      ),
    ).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// Rule 4 (#2555) — exactly one visible page headline, and the opening owns it
// ---------------------------------------------------------------------------

/**
 * #2426 rule 3: every public route announces itself with exactly one visible
 * `<h1>`, and the page's opening owns it. Two halves of that are decidable from
 * one file each, and both are the shapes #2555 actually removed:
 *
 * - **No route ships an `sr-only` `<h1>`.** `/nieuws` had one as its *only*
 *   announcement — the news index did not announce itself at all to anyone
 *   looking at it — and `/wedstrijd/[matchId]` had one duplicating a scoreline
 *   that was already on screen. An invisible heading is what a page writes
 *   instead of an opening, which is why banning it is a design rule and not
 *   only an accessibility one.
 * - **A route file does not announce the page itself.** `page.tsx` composes; a
 *   heading in it is a route re-inventing an opening it should have delegated,
 *   which is exactly how the site ended up with thirteen of them. The rule
 *   covers `level={1}` as well as `<h1>` — `<EditorialHeading level={1}>`
 *   renders the tag, and a literal-`<h1>` grep is what undercounted the
 *   openings by seven in the first place (#2426).
 *
 * **Three things it cannot see, named so nobody reads it as more than it is:**
 *
 * - **The same route announcing itself twice across two files.**
 *   `(main)/club/loading.tsx` renders an opening for *all six* `/club/*`
 *   children, so their streamed HTML carries two `<h1>`s and a loading board
 *   page announces itself as the `/club` index. Reaching that needs the import
 *   graph; the fix is #2432's (moving segment `loading.tsx` files into route
 *   groups), not a regex's.
 * - **A route with no opening at all.** The second arm is satisfied by absence,
 *   so deleting a route's `<PageHero>` leaves it green — which is `/nieuws`'
 *   original defect exactly. Twelve route files legitimately hold no heading
 *   because they delegate, and nothing here tells the two apart.
 * - **An opening hand-rolled in a colocated file.** Seven of the eight routes
 *   #2555 collapsed did it inside `page.tsx` and would have been caught; the
 *   other one, plus `<BoardHero>` and `<JeugdHero>`, lived a file away and
 *   would not have been.
 *
 * The positive form — every route reaches exactly one opening from a named
 * allowlist — is the rule worth having, and it needs the render tree rather
 * than a regex. Filed as the next candidate on the map's parked enforcement
 * patch rather than approximated here.
 */

/**
 * The homepage. Out of scope for #2555 and owned by #2402, and its two `<h1>`s
 * sit in mutually exclusive branches — an empty-state early return, and an
 * `sr-only` fallback emitted only when no featured article gives
 * `<EditorialHero>` a heading to render. A regex sees two headings; the browser
 * never receives more than one. Exempted deliberately rather than by a rule
 * loose enough to let a real second heading through.
 */
const HOMEPAGE = "app/(landing)/page.tsx";

/** Every opening tag of a level-1 heading, with its attributes. */
const H1_TAG = /<h1\b[^>]*>/g;

/** `<EditorialHeading level={1}>` renders an `<h1>`; a tag grep misses it. */
const RENDERS_LEVEL_ONE = /<h1\b|\blevel=\{1\}/;

/** Everything either arm may scan — the homepage is exempted for both. */
const openingSources = productionSources.filter((f) => f !== HOMEPAGE);

/** Route files — the ones that should compose an opening, not be one. */
const routeFiles = openingSources.filter((relPath) =>
  /(^|\/)page\.tsx$/.test(relPath),
);

describe("no page announces itself invisibly (#2555)", () => {
  it.each(openingSources)("%s — no `sr-only` level-1 heading", (relPath) => {
    const srOnly = [...code.get(relPath)!.matchAll(H1_TAG)].filter((tag) =>
      tag[0].includes("sr-only"),
    );
    expect(srOnly.map((tag) => tag[0])).toEqual([]);
  });
});

describe("the opening owns the headline, not the route (#2555)", () => {
  it.each(routeFiles)(
    "%s — no page-level heading in the route file",
    (relPath) => {
      expect(RENDERS_LEVEL_ONE.test(code.get(relPath)!)).toBe(false);
    },
  );
});

/**
 * Both rules asserted against the shapes they exist to catch and the near-misses
 * they must leave alone — the same coverage check rule 3 carries, for the same
 * reason: an arm that silently matches nothing reads like coverage.
 */
describe("rule 4 catches what it claims to (#2555)", () => {
  it.each([
    ['<h1 className="sr-only">Nieuwsarchief</h1>'],
    ['<h1 className="sr-only">{matchLabel}</h1>'],
    ['<h1 className={cn("sr-only", extra)}>x</h1>'],
  ])("flags %s", (snippet) => {
    expect(
      [...snippet.matchAll(H1_TAG)].filter((t) => t[0].includes("sr-only")),
    ).toHaveLength(1);
  });

  it.each([
    ['<h1 className="grid grid-cols-[1fr_auto_1fr]">'],
    ["<h1>"],
    ['<p className="sr-only">Laden…</p>'],
  ])("leaves %s alone", (snippet) => {
    expect(
      [...snippet.matchAll(H1_TAG)].filter((t) => t[0].includes("sr-only")),
    ).toEqual([]);
  });

  it.each([["<h1>Wedstrijden</h1>"], ["<EditorialHeading level={1}>x"]])(
    "sees %s as a page-level heading",
    (snippet) => {
      expect(RENDERS_LEVEL_ONE.test(snippet)).toBe(true);
    },
  );

  it.each([["<EditorialHeading level={2}>x"], ["<h2>Uitgelicht</h2>"]])(
    "does not read %s as a page-level heading",
    (snippet) => {
      expect(RENDERS_LEVEL_ONE.test(snippet)).toBe(false);
    },
  );
});

// ---------------------------------------------------------------------------
// Rule 5 (#2563) — a BFF-fed route may not cache a failure for longer than 900s
// ---------------------------------------------------------------------------

/**
 * #2433 rule 5: a section that failed to load keeps the page, and that render
 * *succeeds* — so it is written into the ISR cache like any other, and the
 * revalidate window is how long the site repeats it. A degraded render
 * self-heals at the next window; at 86400 it outlives the blip that wrote it by
 * a day. The cap is **900s**, which is what `/ploegen/[slug]` already runs.
 * (The notice such a section is meant to carry is #2576's; today every degrade
 * is silent, which makes the window the only thing bounding it.)
 *
 * Scoped to the BFF because the BFF is the read that fails: Sanity is
 * webhook-fresh, and #2433 left long windows on Sanity-only routes deliberately
 * — `/staf/[slug]` is the one route that degrades a Sanity section and keeps
 * 86400, flagged there rather than silently capped here.
 *
 * **A route is BFF-fed if it or any layout above it reaches the BFF.** Scoping
 * this to "the page file names `BffService`" is what let #2433 count 8 BFF
 * routes: `(landing)/layout.tsx` mounts `<MatchStripSlot>` for the whole group,
 * so `/sponsors` and `/jeugd` inherit a BFF read without naming one, and
 * `/spelers/[slug]` mounts the same slot inline. Its read goes through a
 * per-render `cache()`, not a TTL, so it lands in each page's ISR entry. The
 * layout chain is walked here because it is the mechanism; the component graph
 * below the page is not, so a *new* BFF-reading component would need its name
 * added to `BFF_SIGNAL`.
 *
 * **Two deliberate imprecisions.** The `code` map strips comments but re-emits
 * string literals, so an import path alone counts as a signal — over-inclusive,
 * which is the safe direction for a cap. And a BFF-fed page that declares no
 * window at all is skipped: today those are `force-dynamic` or await
 * `searchParams` and cache nothing, and inferring the difference statically
 * costs more than it catches.
 */
const REVALIDATE_CAP_SECONDS = 900;
const BFF_SIGNAL =
  /\b(BffService|MatchStripSlot|getTeamMatches|getFirstTeamStripData)\b/;
const REVALIDATE_WINDOW = /\bexport const revalidate\s*=\s*(\d+)/;

/** Every `layout.tsx` that wraps this route, root first. */
const layoutChain = (relPath: string): string[] => {
  const dirs = relPath.split("/").slice(0, -1);
  return dirs
    .map((_, i) => `${dirs.slice(0, i + 1).join("/")}/layout.tsx`)
    .filter((layoutPath) => code.has(layoutPath));
};

/** The page's own source plus every layout it renders inside. */
const reachesTheBff = (relPath: string): boolean =>
  [relPath, ...layoutChain(relPath)].some((f) => BFF_SIGNAL.test(code.get(f)!));

/** BFF-fed route files that declare a window — 9 today, never 0. */
const bffFedRouteFiles = productionSources.filter(
  (relPath) =>
    /(^|\/)page\.tsx$/.test(relPath) &&
    reachesTheBff(relPath) &&
    REVALIDATE_WINDOW.test(code.get(relPath)!),
);

describe("a BFF-fed route caps its cache window (#2563)", () => {
  it.each(bffFedRouteFiles)(
    `%s — revalidate stays at or under ${REVALIDATE_CAP_SECONDS}s`,
    (relPath) => {
      const seconds = Number(REVALIDATE_WINDOW.exec(code.get(relPath)!)![1]);
      expect(seconds).toBeLessThanOrEqual(REVALIDATE_CAP_SECONDS);
    },
  );
});

/**
 * The list is derived, so an edit that empties it would read as a pass on every
 * route. Pinned by name, and the layout-chain detector is asserted against the
 * two routes that motivated it — one that inherits the strip and one that looks
 * like it should but does not.
 */
describe("rule 5 checks the routes it claims to (#2563)", () => {
  it.each([
    ["app/(landing)/page.tsx"],
    ["app/(landing)/jeugd/page.tsx"],
    ["app/(landing)/sponsors/page.tsx"],
    ["app/(main)/nieuws/[slug]/page.tsx"],
    ["app/(main)/ploegen/[slug]/page.tsx"],
    ["app/(main)/spelers/[slug]/page.tsx"],
    ["app/(main)/wedstrijd/[matchId]/page.tsx"],
  ])("covers %s", (relPath) => {
    expect(bffFedRouteFiles).toContain(relPath);
  });

  it("sees a route that inherits the strip from its layout", () => {
    const sponsors = "app/(landing)/sponsors/page.tsx";
    expect(BFF_SIGNAL.test(code.get(sponsors)!)).toBe(false);
    expect(layoutChain(sponsors)).toContain("app/(landing)/layout.tsx");
    expect(reachesTheBff(sponsors)).toBe(true);
  });

  it("leaves a Sanity-only route alone", () => {
    expect(reachesTheBff("app/(main)/staf/[slug]/page.tsx")).toBe(false);
    expect(bffFedRouteFiles).not.toContain("app/(main)/staf/[slug]/page.tsx");
  });
});

// Rule 6 (#2691) — "a filtered EmptyState's undo is wired to analytics" — is
// deleted as of #2719. It was a regex-on-source guard checking that a host
// mounted `<EmptyStateUndoAnalytics>`, needed only because wiring analytics
// to a filtered `<EmptyState>`'s undo was a convention, not a compile-time
// requirement. `analyticsSource`/`analyticsFacet` are now required props on
// `EmptyStateAction` (`EmptyState.tsx`) — a host that skips them fails
// `tsgo --noEmit`. Numbering is left as a gap, not renumbered, per this
// file's own convention (rules are referenced by issue number in comments
// elsewhere in the repo).

// ---------------------------------------------------------------------------
// Rule 7 (#2719) — the empty-state-undo global listener stays mounted
// ---------------------------------------------------------------------------

/**
 * The type system guarantees a filtered `<EmptyState>` carries its analytics
 * payload; it says nothing about whether anything ever reads it. Delete the
 * `<EmptyStateUndoTracker />` line from the root layout and every one of
 * rule 6's old five surfaces goes silent — lint, `tsgo`, and the component's
 * own tests (which mount it directly) all stay green, because none of them
 * exercise the layout. This is that missing half.
 */
describe("the empty-state-undo global listener stays mounted (#2719)", () => {
  it("app/layout.tsx mounts <EmptyStateUndoTracker>", () => {
    expect(/<EmptyStateUndoTracker\b/.test(code.get("app/layout.tsx")!)).toBe(
      true,
    );
  });
});

// ---------------------------------------------------------------------------
// Rule 8 (#2645) — no bare `ch` reading measure without a named exemption
// ---------------------------------------------------------------------------

/**
 * DESIGN.md's "The Reading-Measure Exemption Rule" (#2436, #2645): `ch`
 * resolves against the current font's zero-glyph advance, so the same value
 * renders at a different pixel width depending on font and size — drift
 * invisible in review. A reading paragraph takes `var(--container-prose)`
 * instead; a bare `ch` max-width survives only where DESIGN.md names an
 * exemption, and only with an inline comment pointing back at it.
 *
 * This is the rule that failed inside its own branch before it existed:
 * `EditorialHeroShell.stories.tsx` carried a live, hand-copied `max-w-[52ch]`
 * from #2645's first commit until code review caught it by hand. A guard
 * here would have failed that run — which is why this one scans every
 * first-party source file, stories included, with no file-class exemption.
 * `COMMENT_OR_STRING` already does the narrower job a stories-wide carve-out
 * used to stand in for: the one legitimate doc-comment mention of `ch`
 * (`SiteHeader.stories.tsx`, explaining the truncation cap in prose) is
 * stripped as a comment before this pattern ever sees it.
 *
 * **The exemption is pinned by declaration, not by file.** An earlier draft
 * of this rule skipped `VolledigOrganigram.tsx` and `SiteHeader.tsx`
 * entirely once each was known to hold an approved `ch`, which means a
 * second, undocumented `ch` landing anywhere else in either file — a real
 * reading measure this time — would pass silently. Each exempt file below
 * is instead required to match the pattern exactly as many times as it has
 * pinned declarations, and to still contain both the exact approved text and
 * the exemption comment DESIGN.md promises. A file drifting past its pinned
 * count, or losing the declaration or the comment, fails.
 */
const BARE_CH_MAX_WIDTH = /max-w-\[\d*\.?\d+ch\]/;

/** Global twin of `BARE_CH_MAX_WIDTH`, for counting rather than testing. */
const BARE_CH_MAX_WIDTH_G = /max-w-\[\d*\.?\d+ch\]/g;

/** Every match of `BARE_CH_MAX_WIDTH` in an already-stripped source. */
function chOccurrences(strippedSource: string): number {
  return [...strippedSource.matchAll(BARE_CH_MAX_WIDTH_G)].length;
}

/**
 * Strip-then-scan, exactly as the shared `code` map already does for every
 * file below — exposed separately so the self-test can run it against raw
 * snippets that were never loaded into that map.
 */
function hasBareChMaxWidth(source: string): boolean {
  const stripped = source.replace(COMMENT_OR_STRING, (token) =>
    token.startsWith("/") ? "" : token,
  );
  return BARE_CH_MAX_WIDTH.test(stripped);
}

/**
 * The exact declaration text DESIGN.md's Reading-Measure Exemption Rule
 * names, one entry per file: helper copy sharing a row with controls
 * (`VolledigOrganigram`'s toolbar caption), and a single-line truncating
 * label (`SiteHeader`'s nav-label cap). Pinning the literal line — not just
 * "this file has a `ch` somewhere" — is what makes a *different* `ch` added
 * later in the same file a failure rather than noise the count-check
 * absorbs.
 */
const CH_EXEMPT_DECLARATIONS: Record<string, readonly string[]> = {
  "components/organigram/OrganigramExplorer/VolledigOrganigram.tsx": [
    '<p className="text-ink-soft max-w-[60ch] text-sm leading-relaxed">',
  ],
  "components/layout/SiteHeader/SiteHeader.tsx": [
    'const NAV_LABEL_TRUNCATE = "block max-w-[14ch] truncate";',
  ],
};

const CH_EXEMPT_FILES = new Set(Object.keys(CH_EXEMPT_DECLARATIONS));

/** The rule's own name — every exempt file must still cite it inline. */
const EXEMPTION_MARKER = "Reading-Measure Exemption Rule";

describe("no bare `ch` reading measure without a named exemption (#2645)", () => {
  it.each(scannableSources.filter((f) => !CH_EXEMPT_FILES.has(f)))(
    "%s — no bare `ch` max-width",
    (relPath) => {
      expect(BARE_CH_MAX_WIDTH.test(code.get(relPath)!)).toBe(false);
    },
  );
});

/**
 * The exemption-comment check needs the file as written, not `code`'s
 * comment-stripped copy — the marker string it looks for lives inside the
 * very comment that map strips. Read once per exempt file, outside the
 * shared pipeline the rest of this suite scans. Whitespace (including the
 * docblock's own `\n *` continuation) is collapsed before matching, because
 * prettier is free to re-wrap a long comment line and split the marker
 * phrase across two — exactly what it did to `SiteHeader.tsx`'s.
 */
const rawExemptSource = new Map(
  Object.keys(CH_EXEMPT_DECLARATIONS).map((relPath) => [
    relPath,
    readFileSync(resolve(srcDir, relPath), "utf8")
      // JSDoc line-continuation (`\n * `) first, or its leading ` * ` reads
      // as a literal asterisk sitting between two collapsed words instead of
      // the space it visually is.
      .replace(/\n\s*\*\s?/g, " ")
      .replace(/\s+/g, " "),
  ]),
);

/**
 * Each exempt file is held to exactly its pinned declarations — no fewer
 * (the exemption going stale, DESIGN.md's promise) and no more (a second,
 * undocumented `ch` the count-only version of this rule could not see).
 */
describe("rule 8's exemptions are pinned to their exact declarations (#2645)", () => {
  it.each(Object.entries(CH_EXEMPT_DECLARATIONS))(
    "%s — matches only its pinned declaration(s)",
    (relPath, declarations) => {
      const source = code.get(relPath)!;
      expect(chOccurrences(source)).toBe(declarations.length);
      for (const declaration of declarations) {
        expect(source).toContain(declaration);
      }
      expect(rawExemptSource.get(relPath)!).toContain(EXEMPTION_MARKER);
    },
  );
});

/**
 * The rule's own coverage — the same convention rules 3 and 4 carry. The
 * near-miss that matters most here is the comment-only mention: without
 * `COMMENT_OR_STRING` stripping, `SiteHeader.stories.tsx`'s doc comment
 * explaining `max-w-[14ch] truncate]` in prose would itself trip the rule.
 * `chOccurrences` gets its own cases too, since it is what makes a *second*
 * `ch` in an exempt file a failure rather than something the boolean check
 * would wave through as "still true".
 */
describe("rule 8 catches what it claims to (#2645)", () => {
  it.each([
    ['<p className="max-w-[52ch] text-xl">'],
    ['className={cn("text-ink-soft max-w-[46ch] mt-2")}'],
    ['const NAV_LABEL_TRUNCATE = "block max-w-[14ch] truncate";'],
    // Fractional and leading-dot forms are valid Tailwind arbitrary values
    // (and valid CSS) — `\d+` alone walked straight past them.
    ['<p className="max-w-[52.5ch] text-xl">'],
    ['<p className="max-w-[.5ch] text-xl">'],
  ])("flags %s", (snippet) => {
    expect(hasBareChMaxWidth(snippet)).toBe(true);
  });

  it.each([
    ['<p className="max-w-[var(--container-prose)] text-xl">'],
    ['<div className="mx-auto flex max-w-[40rem] flex-col">'],
    ['<div className="max-w-3xl">'],
    // A doc comment explaining the pattern in prose, not using it in a class.
    ["// scales like `max-w-[14ch] truncate` today"],
    ["/** bounds the row at `max-w-[52ch]` (retired) */"],
  ])("leaves %s alone", (snippet) => {
    expect(hasBareChMaxWidth(snippet)).toBe(false);
  });

  it("counts every occurrence, not just whether one exists", () => {
    expect(chOccurrences('max-w-[60ch]" ... "max-w-[14ch]')).toBe(2);
  });

  it("counts a fractional `ch` value too", () => {
    expect(chOccurrences('max-w-[52.5ch]" ... "max-w-[60ch]')).toBe(2);
  });

  it("a second, undocumented `ch` in an exempt file changes the count the pinned check relies on", () => {
    const oneApproved =
      '<p className="text-ink-soft max-w-[60ch] text-sm leading-relaxed">';
    const withASecondOne = `${oneApproved}\n<span className="max-w-[30ch]">`;
    expect(chOccurrences(oneApproved)).toBe(1);
    expect(chOccurrences(withASecondOne)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Rule 9 (#2570) — a route's up-link matches its own breadcrumb trail
// ---------------------------------------------------------------------------

/**
 * #2428 §2 picked the trail-depth rule *because* it is "machine-checkable,
 * and needs no per-route judgement" — every route already builds its own
 * `buildBreadcrumbJsonLd([...])` array, so the trail's own length says
 * whether the route gets an up-link, and its own second-to-last entry says
 * where that up-link points. None of that was ever checked: #2570 shipped
 * 17 routes by hand, and #2428 §4's whole justification for not centralising
 * a parent map — "drift stays visible inside one file" — only holds where
 * the trail and the chip live in the same file. Six of the 17 do not
 * (`/club/contact`, `/club/geschiedenis`, and the three board routes split
 * the trail-authoring `page.tsx` from the component that renders the chip),
 * so "visible" needed a reader, not just proximity.
 *
 * Two arms, on every route (a `page.tsx` plus what it imports, see
 * `routeBundleSources` below):
 *
 * - **`Home → self` (2 entries) renders no up-link.** #2428's own rule — an
 *   up-link "exactly when" the trail is deeper than that.
 * - **A deeper trail renders one, pointed at the trail's own parent.** The
 *   up-link's `href` — a page-owned `<UpLink href=…>` or a
 *   `upLink={{ href: … }}` passed to `<PageHero>` / `<UltrasHero>` — must
 *   equal the trail's second-to-last `url`, `SITE_CONFIG.siteUrl` stripped.
 *
 * **Two hops, not a full import graph.** A route's `page.tsx` reaches its
 * up-link through at most two local imports today — `createBoardPage.tsx`
 * (hop 1) → `BestuurPage.tsx` (hop 2) is the deepest of the three splits —
 * so `routeBundleSources` follows same-package specifiers (`@/…` and
 * relative) two hops from the route file and stops. Barrel re-exports
 * (`@/components/design-system`, `@/components/layout` — anything resolving
 * to an `index.ts`) are dropped rather than followed: nearly every route
 * imports one, and walking into it would pull unrelated components' own
 * `<UpLink>` usage into every route's bundle, which is over-inclusive in the
 * direction that hides a real miss rather than flags a false one.
 *
 * **What this cannot see**, named so nobody reads it as more: a route whose
 * trail and up-link both point at the wrong place, *consistently* — the
 * rule checks the two agree with each other, not that either is correct
 * against the site's real structure. And a route with no
 * `buildBreadcrumbJsonLd` call reachable within two hops is invisible to it
 * entirely (`/jeugd/[slug]`'s 308 resolver, which renders no UI to carry
 * either).
 */
const BREADCRUMB_CALL = /buildBreadcrumbJsonLd\(\s*\[([\s\S]*?)\]\s*\)/;
// The template-literal alternative comes first — `[^,}]+` alone stops at the
// first `}`, which for `` `${SITE_CONFIG.siteUrl}/kalender` `` is the one
// closing the *interpolation*, truncating the value before its own closing
// backtick.
const BREADCRUMB_URL = /\burl:\s*(`(?:\\.|[^`\\])*`|[^,}]+)/g;
const UP_LINK_TAG_HREF = /<UpLink\b[^>]*\bhref=([^\s>]+)/g;
const UP_LINK_PROP_HREF = /\bupLink=\{\{\s*href:\s*([^,]+),/g;
const IMPORT_SPECIFIER = /\bfrom\s+["']([^"']+)["']/g;

/**
 * Strip the wrapping quote/backtick and the site-origin interpolation, so a
 * trail's literal `` `${SITE_CONFIG.siteUrl}/kalender` `` and an up-link's
 * `"/kalender"` — or both sides' `` `/ploegen/${slug}` `` — compare equal.
 */
function normalizeHref(raw: string): string {
  return raw
    .trim()
    .replace(/^[`"']|[`"']$/g, "")
    .replace(/\$\{SITE_CONFIG\.siteUrl\}/g, "");
}

/** Every `url:` value in a route's first `buildBreadcrumbJsonLd([...])` call,
 *  in trail order — `undefined` when the source makes no such call. */
function breadcrumbUrls(source: string): string[] | undefined {
  const call = BREADCRUMB_CALL.exec(source);
  if (!call) return undefined;
  return [...call[1]!.matchAll(BREADCRUMB_URL)].map((m) => m[1]!.trim());
}

/**
 * A matched href is a route-owned literal — a quoted string or a template
 * literal — only when it starts with a quote or a backtick. A bare
 * identifier (`upLink.href`) is the shape `<PageHero>` and `<UltrasHero>`
 * themselves use to *forward* a prop they received, not a route naming its
 * parent, and both components' own source is reachable in a route's bundle
 * (`<UltrasHero>` at hop 1 for `/club/ultras`, `<PageHero>` wherever its
 * directory import happens to resolve). Discriminating by value shape, not
 * by which pattern matched first, is what makes counting every match safe
 * (#2799 review round 3) — a naive collect-and-count over-counts on every
 * route whose bundle reaches either component's own pass-through line.
 */
function isLiteralHref(raw: string): boolean {
  return /^[`"']/.test(raw.trim());
}

/**
 * Every up-link href *literal* the bundle renders — real call sites only,
 * pass-through forwards filtered out — in the order they appear. Empty when
 * the source renders none.
 */
function upLinkHrefs(source: string): string[] {
  const propHrefs = [...source.matchAll(UP_LINK_PROP_HREF)].map((m) => m[1]!);
  const tagHrefs = [...source.matchAll(UP_LINK_TAG_HREF)].map((m) => m[1]!);
  return [...propHrefs, ...tagHrefs].filter(isLiteralHref);
}

/** Resolve one `import … from "SPECIFIER"` to a repo-relative source path —
 *  `@/x` → `x`, `./x` / `../x` → resolved against `fromPath`'s own
 *  directory — or `undefined` for a package specifier (`next/…`, `effect`,
 *  …) or a target this tree doesn't have (an asset, a type-only `.json`).
 *  Barrel `index.ts` targets resolve to `undefined` too — see the docblock
 *  above. */
function resolveImport(
  fromPath: string,
  specifier: string,
): string | undefined {
  let target: string | undefined;
  if (specifier.startsWith("@/")) {
    target = specifier.slice(2);
  } else if (specifier.startsWith(".")) {
    const dir = fromPath.split("/").slice(0, -1).join("/");
    target = new URL(specifier, `file:///${dir}/`).pathname.slice(1);
  }
  if (target === undefined) return undefined;
  for (const ext of [".tsx", ".ts"]) {
    if (code.has(`${target}${ext}`)) return `${target}${ext}`;
  }
  return undefined;
}

/** Every source a route file imports directly — package specifiers and
 *  barrels dropped, per `resolveImport`. */
function importedSources(relPath: string): string[] {
  const specifiers = [
    ...(code.get(relPath) ?? "").matchAll(IMPORT_SPECIFIER),
  ].map((m) => m[1]!);
  const resolved = specifiers
    .map((spec) => resolveImport(relPath, spec))
    .filter((f): f is string => f !== undefined);
  return [...new Set(resolved)];
}

/** The route file's own source, plus everything it imports (hop 1) and
 *  everything *those* import (hop 2) — see the docblock above for why two
 *  hops and why barrels are excluded rather than walked. */
function routeBundleSources(relPath: string): string[] {
  const hop1 = importedSources(relPath);
  const hop2 = hop1.flatMap((f) => importedSources(f));
  return [relPath, ...hop1, ...hop2];
}

/** A route's own source concatenated with its two-hop import bundle. */
function bundleCode(relPath: string): string {
  return routeBundleSources(relPath)
    .map((f) => code.get(f))
    .filter((s): s is string => s !== undefined)
    .join("\n");
}

/** Route files whose bundle reaches a `buildBreadcrumbJsonLd` call — the
 *  ones this rule can hold to anything. */
const breadcrumbRouteFiles = routeFiles.filter(
  (relPath) => breadcrumbUrls(bundleCode(relPath)) !== undefined,
);

describe("the up-link matches the route's own breadcrumb trail (#2570)", () => {
  it.each(breadcrumbRouteFiles)(
    "%s — exactly one up-link, present and targeted exactly when the trail depth calls for it",
    (relPath) => {
      const source = bundleCode(relPath);
      const urls = breadcrumbUrls(source)!;
      const hrefs = upLinkHrefs(source);

      if (urls.length <= 2) {
        // #2428's own rule: "Home -> self" renders none — not zero-or-more,
        // exactly zero. A stray one here is the trail-depth exception this
        // whole rule exists to hold routes to.
        expect(hrefs).toHaveLength(0);
        return;
      }

      // The AC's "One up-link ... exactly when" — not "at least one": a
      // route that accidentally rendered two would have had only the first
      // validated before this counted every match.
      expect(hrefs).toHaveLength(1);
      const parent = normalizeHref(urls[urls.length - 2]!);
      expect(normalizeHref(hrefs[0]!)).toBe(parent);
    },
  );
});

/**
 * The list is derived, so an edit that emptied it would read as a pass on
 * every route — the same coverage pin rule 5 carries. Named here are the
 * routes that motivated the two-hop bundle in the first place: without it,
 * every one of these five is invisible to the rule (`club/bestuur/page.tsx`
 * does not even contain the string `buildBreadcrumbJsonLd`).
 */
describe("rule 9 catches what it claims to (#2570)", () => {
  it.each([
    ["app/(main)/club/contact/page.tsx"],
    ["app/(main)/club/geschiedenis/page.tsx"],
    ["app/(main)/club/bestuur/page.tsx"],
    ["app/(main)/club/jeugdbestuur/page.tsx"],
    ["app/(main)/club/angels/page.tsx"],
    ["app/(main)/club/[slug]/page.tsx"],
    ["app/(main)/nieuws/[slug]/page.tsx"],
    ["app/(main)/tegenstander/[clubId]/page.tsx"],
  ])("covers %s", (relPath) => {
    expect(breadcrumbRouteFiles).toContain(relPath);
  });

  it("reaches BestuurPage.tsx from a board route two hops away", () => {
    const bundle = routeBundleSources("app/(main)/club/bestuur/page.tsx");
    expect(bundle).toContain("components/club/BestuurPage/BestuurPage.tsx");
  });

  it("does not walk into a barrel it imports", () => {
    expect(importedSources("app/(main)/club/word-lid/page.tsx")).not.toContain(
      "components/design-system/index.ts",
    );
  });

  it("extracts url: values in trail order", () => {
    const source = `buildBreadcrumbJsonLd([
      { name: "Home", url: SITE_CONFIG.siteUrl },
      { name: "Kalender", url: \`\${SITE_CONFIG.siteUrl}/kalender\` },
      { name: opponentName, url: pageUrl },
    ])`;
    expect(breadcrumbUrls(source)).toEqual([
      "SITE_CONFIG.siteUrl",
      "`${SITE_CONFIG.siteUrl}/kalender`",
      "pageUrl",
    ]);
  });

  it("reads both up-link shapes", () => {
    expect(upLinkHrefs('<UpLink href="/nieuws" label="Nieuws" />')).toEqual([
      '"/nieuws"',
    ]);
    expect(upLinkHrefs('upLink={{ href: "/club", label: "De club" }}')).toEqual(
      ['"/club"'],
    );
    expect(
      upLinkHrefs("upLink={{ href: `/ploegen/${slug}`, label: displayName }}"),
    ).toEqual(["`/ploegen/${slug}`"]);
    expect(upLinkHrefs("<PageHero headline={x} />")).toEqual([]);
  });

  it("filters a pass-through <UpLink> forwarding a prop it received", () => {
    // The exact shape <PageHero> and <UltrasHero> render internally.
    expect(
      upLinkHrefs(
        '<UpLink href={upLink.href} label={upLink.label} tone="cream" />',
      ),
    ).toEqual([]);
  });

  it("counts every real up-link literal, not just the first", () => {
    const source = `
      <UpLink href="/kalender" label="Kalender" />
      <UpLink href="/ploegen" label="Ploegen" />
    `;
    expect(upLinkHrefs(source)).toEqual(['"/kalender"', '"/ploegen"']);
  });

  it("counts a route-owned literal alongside a pass-through it reaches via a hop", () => {
    // /club/ultras's own shape: the page's real upLink prop, plus
    // <UltrasHero>'s own pass-through line, both in the same bundle.
    const source = `
      upLink={{ href: "/club", label: "De club" }}
      <UpLink href={upLink.href} label={upLink.label} tone="cream" className="self-start" />
    `;
    expect(upLinkHrefs(source)).toEqual(['"/club"']);
  });

  it("normalizes a template-literal trail URL and a plain href to the same string", () => {
    expect(normalizeHref("`${SITE_CONFIG.siteUrl}/kalender`")).toBe(
      "/kalender",
    );
    expect(normalizeHref('"/kalender"')).toBe("/kalender");
  });

  it("normalizes a dynamic trail segment and a dynamic href to the same string", () => {
    expect(normalizeHref("`${SITE_CONFIG.siteUrl}/ploegen/${slug}`")).toBe(
      "/ploegen/${slug}",
    );
    expect(normalizeHref("`/ploegen/${slug}`")).toBe("/ploegen/${slug}");
  });

  it("flags a 2-entry trail that renders an up-link anyway", () => {
    const source = `
      buildBreadcrumbJsonLd([
        { name: "Home", url: SITE_CONFIG.siteUrl },
        { name: "Ploegen", url: \`\${SITE_CONFIG.siteUrl}/ploegen\` },
      ])
      <UpLink href="/ploegen" label="Ploegen" />
    `;
    const urls = breadcrumbUrls(source)!;
    expect(urls).toHaveLength(2);
    expect(upLinkHrefs(source)).toHaveLength(1);
  });

  it("flags a deeper trail whose up-link targets the wrong parent", () => {
    const source = `
      buildBreadcrumbJsonLd([
        { name: "Home", url: SITE_CONFIG.siteUrl },
        { name: "Kalender", url: \`\${SITE_CONFIG.siteUrl}/kalender\` },
        { name: opponentName, url: pageUrl },
      ])
      <UpLink href="/ploegen" label="Kalender" />
    `;
    const urls = breadcrumbUrls(source)!;
    const parent = normalizeHref(urls[urls.length - 2]!);
    expect(normalizeHref(upLinkHrefs(source)[0]!)).not.toBe(parent);
  });

  it("flags a deeper trail that renders two up-links", () => {
    const source = `
      buildBreadcrumbJsonLd([
        { name: "Home", url: SITE_CONFIG.siteUrl },
        { name: "Kalender", url: \`\${SITE_CONFIG.siteUrl}/kalender\` },
        { name: opponentName, url: pageUrl },
      ])
      <UpLink href="/kalender" label="Kalender" />
      <UpLink href="/kalender" label="Kalender" />
    `;
    expect(upLinkHrefs(source)).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Rule 10 (#2505) — a repository method with no caller renders nothing, silently
// ---------------------------------------------------------------------------

/**
 * The exact bug #2505's own round 1 shipped, generalised: `getPlaceholder()`
 * was declared on `HomepageRepositoryInterface`, implemented against real
 * GROQ, and exercised three times by its own `homepage.repository.test.ts` —
 * so `pnpm test:coverage` reported it fully covered while its only intended
 * caller, `(landing)/page.tsx`, had not been written yet. Coverage measures
 * that a line ran, not that anything outside the test file depends on it
 * running; a repository method invoked only by its own unit test is
 * structurally indistinguishable, to that number, from one wired into a
 * live page.
 *
 * Same silent-failure shape `ArticleBody.serializer-completeness.test.tsx`'s
 * docblock already names for a schema type declared but missing from the
 * serializer map (#2275's `qaSectionDivider`): declared, never wired,
 * nothing catches it. That guard holds one surface (Portable Text body
 * blocks) to "every declared type resolves to a handler." This one holds
 * every repository to the mirror rule: every declared method resolves to a
 * caller.
 *
 * `failed-read-boundaries.test.ts` calls itself a pin for the specific
 * routes #2563 touched and names rule 5 in this file as "the rule that
 * scales." This is that rule for the repository layer: it covers all 11
 * repositories under `lib/repositories/`, forever, the way rules 1-9 above
 * cover their own bug class site-wide rather than one ticket's routes.
 *
 * **Two independent signals, not one.** `findAll` and `findBySlug` are not
 * unique to one repository — `ArticleRepository`, `TeamRepository` and
 * others all declare a `findAll`. A file counts as a caller of
 * `Repo.method` only when it contains BOTH the repository's own Context.Tag
 * identifier (`ArticleRepository`, say) AND a `.method(` call —
 * `referencesCaller` below — the same two-part shape every real call site
 * in this codebase already has (`const repo = yield* ArticleRepository;`
 * paired with `repo.findAll()`, `articleRepo.findAll()`, …: the variable
 * name varies, the tag reference and the dotted call don't).
 *
 * **What this cannot see**, named so nobody reads it as more: a caller that
 * destructures the yielded service (`const { findAll } = yield* X`) instead
 * of binding it to a variable and dotting off it — no call site in this
 * codebase does that today, but a future one that did would read as an
 * orphan. And a method called only from a Storybook story or another
 * repository's `.test.ts` file reads as covered when it arguably still
 * lacks a production reader — this rule's bar is "outside the repository's
 * own test file," not "outside every test file," deliberately the
 * narrower, provable claim: a real orphan (#2505's own) has *zero* callers
 * anywhere outside its own repository's test, not merely zero *production*
 * callers.
 */
const REPOSITORY_FILE = /\.repository\.ts$/;
const repositoryFiles = scannableSources.filter((relPath) =>
  REPOSITORY_FILE.test(relPath),
);

const REPOSITORY_TAG = /export class (\w+) extends Context\.Tag/;
const INTERFACE_METHOD = /readonly (\w+):/g;

interface RepositoryDeclaration {
  file: string;
  tag: string;
  methods: string[];
}

/** One entry per `*.repository.ts` file — its own Context.Tag identifier and
 *  every method its own interface declares, in source order. */
const repositories: RepositoryDeclaration[] = repositoryFiles.map((file) => {
  const source = code.get(file)!;
  const tag = REPOSITORY_TAG.exec(source)?.[1];
  if (!tag) {
    throw new Error(
      `${file}: expected "export class X extends Context.Tag(...)" — the tag this rule keys callers off of.`,
    );
  }
  return {
    file,
    tag,
    methods: [...source.matchAll(INTERFACE_METHOD)].map((m) => m[1]!),
  };
});

/** True when a source file both references `tag` and calls `.method(` — see
 *  the docblock's "two independent signals" paragraph for why both are
 *  required together (a bare `.findAll(` match alone is not repository-
 *  specific enough to mean anything). */
function referencesCaller(
  source: string,
  tag: string,
  method: string,
): boolean {
  return (
    new RegExp(`\\b${tag}\\b`).test(source) &&
    new RegExp(`\\.${method}\\(`).test(source)
  );
}

/** Every scannable source that could plausibly call `repo`'s methods —
 *  everything except the repository's own declaration file and its own
 *  test file (see the docblock's "what this cannot see" for the boundary). */
function callerCandidates(repo: RepositoryDeclaration): string[] {
  const ownTest = repo.file.replace(/\.ts$/, ".test.ts");
  return scannableSources.filter(
    (relPath) => relPath !== repo.file && relPath !== ownTest,
  );
}

function hasCaller(repo: RepositoryDeclaration, method: string): boolean {
  return callerCandidates(repo).some((relPath) =>
    referencesCaller(code.get(relPath)!, repo.tag, method),
  );
}

/**
 * Pinned by declaration, not by file — rule 8's own convention (see that
 * rule's docblock for why a file-wide carve-out would hide a *second*,
 * undocumented orphan landing in the same file). Each entry here is a real
 * orphan this rule found, deliberately not fixed inside the PR that added
 * the rule, with a follow-up issue tracking its resolution.
 */
const ORPHAN_EXEMPTIONS: Record<string, readonly string[]> = {};

function isExempt(file: string, method: string): boolean {
  return (ORPHAN_EXEMPTIONS[file] ?? []).includes(method);
}

describe("a repository method with no caller renders nothing, silently (#2505)", () => {
  const cases = repositories.flatMap((repo) =>
    repo.methods
      .filter((method) => !isExempt(repo.file, method))
      .map((method) => [repo.file, repo.tag, method] as const),
  );
  it.each(cases)(
    "%s — %s.%s has at least one caller outside its own test file",
    (file, _tag, method) => {
      const repo = repositories.find((r) => r.file === file)!;
      expect(hasCaller(repo, method)).toBe(true);
    },
  );

  // The exemption list is itself pinned: an orphan that gains a real caller
  // must have its exemption removed (rule 8's own "no fewer, no more" bar),
  // and this fails loudly the day that happens rather than quietly stop
  // testing a method that no longer needs the carve-out.
  //
  // Guarded on a non-empty list: `it.each([])` throws "No test found in
  // suite" under Vitest 4 rather than silently registering zero tests, so an
  // empty `ORPHAN_EXEMPTIONS` (the common case — every orphan found so far
  // has been fixed, not carved out) must not reach `describe` at all.
  const exempted = Object.entries(ORPHAN_EXEMPTIONS).flatMap(
    ([file, methods]) => methods.map((method) => [file, method] as const),
  );
  if (exempted.length > 0) {
    describe("exemptions stay pinned to a real, still-live orphan", () => {
      it.each(exempted)(
        "%s — %s is still actually orphaned",
        (file, method) => {
          const repo = repositories.find((r) => r.file === file)!;
          expect(hasCaller(repo, method)).toBe(false);
        },
      );
    });
  }
});

/**
 * The list is derived, so an edit that emptied it would read as a pass on
 * every repository — the same coverage pin rules 5 and 9 carry.
 * `referencesCaller` gets its own cases too, since it is what makes a
 * same-named method on an unrelated repository a non-match instead of a
 * false pass (mirrors rule 9's own `chOccurrences`/`upLinkHrefs` self-tests).
 */
describe("rule 10 catches what it claims to (#2505)", () => {
  it("covers every repository under lib/repositories/", () => {
    expect(repositoryFiles).toHaveLength(11);
    expect(repositoryFiles).toContain(
      "lib/repositories/homepage.repository.ts",
    );
  });

  it("extracts every readonly method off an interface, ignoring an unrelated `readonly` type annotation", () => {
    const source = `
      export interface FooRepositoryInterface {
        readonly findAll: () => Effect.Effect<Foo[]>;
        readonly findBySlug: (slug: string) => Effect.Effect<Foo | null>;
      }
      function widen(articles: readonly Foo[]) {}
    `;
    expect([...source.matchAll(INTERFACE_METHOD)].map((m) => m[1]!)).toEqual([
      "findAll",
      "findBySlug",
    ]);
  });

  it("matches a real call site regardless of the local variable name", () => {
    expect(
      referencesCaller(
        "const repo = yield* ArticleRepository; repo.findAll();",
        "ArticleRepository",
        "findAll",
      ),
    ).toBe(true);
    expect(
      referencesCaller(
        "const articleRepo = yield* ArticleRepository; return yield* articleRepo.findAll();",
        "ArticleRepository",
        "findAll",
      ),
    ).toBe(true);
  });

  it("refuses a same-named method whose only match is an unrelated repository's own tag", () => {
    // The false-pass this rule exists to refuse: this source calls
    // `.findAll(` and mentions a repository tag, but never ArticleRepository.
    const teamCallerOnly =
      "const repo = yield* TeamRepository; return yield* repo.findAll();";
    expect(
      referencesCaller(teamCallerOnly, "ArticleRepository", "findAll"),
    ).toBe(false);
  });

  it("refuses a bare `.method(` call with no repository tag anywhere in the file", () => {
    expect(
      referencesCaller(
        "someUnrelatedThing.findAll();",
        "ArticleRepository",
        "findAll",
      ),
    ).toBe(false);
  });

  it("does not count a repository's own test file as a caller", () => {
    const homepageRepo = repositories.find(
      (r) => r.file === "lib/repositories/homepage.repository.ts",
    )!;
    expect(callerCandidates(homepageRepo)).not.toContain(
      "lib/repositories/homepage.repository.test.ts",
    );
  });

  it("reproduces #2505's own regression: getPlaceholder had a caller only in its own test file, before this branch wired it in", () => {
    // Structural reproduction, not a live orphan: this is true today only
    // because `(landing)/page.tsx` (this branch's own fix) calls it. Asserts
    // the mechanism the rule runs on, the same way rule 9's self-tests
    // exercise `breadcrumbUrls`/`upLinkHrefs` against synthetic sources
    // rather than only the real tree.
    const testOnlySource = `
      describe("getPlaceholder", () => {
        it("maps the raw GROQ result", () => {
          expect(toPlaceholderVM(HomepageRepositoryLive)).toBeTruthy();
        });
      });
    `;
    expect(
      referencesCaller(testOnlySource, "HomepageRepository", "getPlaceholder"),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Rule 11 (#2578) — the external mark is <ExternalMark />, never a literal arrow
// ---------------------------------------------------------------------------

/**
 * #2547's decision: the mark that tells a visitor a link hands them to a
 * third party is `<ExternalMark />` — one primitive carrying the Phosphor
 * glyph and the Dutch `sr-only` announcement together — never a bare arrow
 * character typed into a span. Two arrows painted that role before this
 * ticket: `↗` and, on exactly two ticket-shop CTAs, `→`. The guard holds
 * two separate claims apart rather than banning either glyph outright,
 * because `→` is also — far more often — the internal "stay on the site"
 * glyph `<EditorialLink>`, `<Button>`, `<TicketStub>` and a dozen other
 * components render at rest; banning it site-wide would be rule 9's own
 * mistake in reverse, flagging correct code as a defect.
 *
 * - **`↗` never appears in shipped code.** Every production sighting of
 *   this glyph, before this ticket, was the external mark — #2547's own
 *   audit found no other user of it anywhere in the tree. Two sightings
 *   are pinned exemptions below, not violations: both are homepage-owned
 *   and both #2547 itself handed to #2402 rather than folding into this
 *   ticket's 9-file population — an *internal* link wearing the external
 *   arrow, which is the homepage critique map's defect to fix, not a swap
 *   this ticket makes.
 * - **An anchor-like element (`<a>`/`<Link>`) that wires a literal
 *   `target="_blank"` on its OWN opening tag may not also carry a literal
 *   `→` in its OWN body.** Element-scoped, not file-scoped — a first
 *   attempt at this rule was file-granular (like rule 5's `BFF_SIGNAL`/
 *   `REVALIDATE_WINDOW` co-occurrence), and review round 1 caught that it
 *   would fail correct code: `SiteFooter.tsx` already has `target="_blank"`
 *   socials, so an ordinary, unrelated internal `Alle nieuws →` CTA added
 *   anywhere else in that file would have failed a rule it never actually
 *   broke. `hasRelatedInternalArrow` below finds each anchor-like opening
 *   tag that itself carries `target="_blank"`, then reads only the text
 *   between that tag and its own matching closer — `<a>`/`<Link>` never
 *   self-nest in this codebase, so "the next `</a>` or `</Link>`" is
 *   unambiguously that element's own closer, not a sibling's.
 * - **No sr-only announcement is ever English again.** #2547 rule 4 — "the
 *   sentence goes where the box goes" — is a site-wide invariant now that
 *   `<ExternalMark>` exists, and review round 1 caught one surviving
 *   English announcement this ticket's own `it.each` list never named:
 *   `ArticleBody`'s social-link branch. `hasEnglishAnnouncement` below is
 *   the regression guard for that class of miss, not just that one line.
 *
 * **What this cannot see**, named so nobody reads it as more: a
 * `target="_blank"` built from a spread object
 * (`{...{ target: "_blank" }}`, `ClubshopBanner`'s own shape) rather than
 * the literal attribute string. Not chased on purpose — `ClubshopBanner`
 * is itself one of the two pinned `↗` exemptions below, and it is
 * #2402's file to fix, not this rule's to catch by a different door.
 *
 * **This file's own prose** uses `→` throughout (this docblock included)
 * to explain the rule it enforces — that is exactly why `SELF` is excluded
 * from `scannableSources`/`productionSources` upstream in this file, the
 * same exclusion every other rule here already relies on. No special
 * casing needed for rule 11.
 */
const EXTERNAL_ARROW_GLYPH = "↗";
const INTERNAL_ARROW_GLYPH = "→";
const ENGLISH_ANNOUNCEMENT = "opens in new tab";

/** True when `source` contains the retired external-mark glyph ↗ at all. */
function hasExternalArrowGlyph(source: string): boolean {
  return source.includes(EXTERNAL_ARROW_GLYPH);
}

/** True when `source` still carries the pre-#2578 English sr-only
 *  announcement anywhere — every announcement is Dutch now (rule 4). */
function hasEnglishAnnouncement(source: string): boolean {
  return source.includes(ENGLISH_ANNOUNCEMENT);
}

/** An anchor-like opening tag (`<a>` or `<Link>`) whose own attributes
 *  carry a literal `target="_blank"` — group 1 captures the tag name so
 *  the matching closer can be found. */
const ANCHOR_LIKE_OPEN_WITH_BLANK = /<(a|Link)\b[^>]*\btarget="_blank"[^>]*>/g;

/**
 * True when an anchor-like element that wires its OWN literal
 * `target="_blank"` also carries a literal `→` in its OWN body (the text
 * between its opening tag and its own matching closing tag) — never a
 * file-wide co-occurrence. `<a>`/`<Link>` don't self-nest in this
 * codebase, so the next matching closer after an opening tag is
 * unambiguously that element's own.
 */
function hasRelatedInternalArrow(source: string): boolean {
  for (const match of source.matchAll(ANCHOR_LIKE_OPEN_WITH_BLANK)) {
    const tagName = match[1]!;
    const bodyStart = match.index + match[0].length;
    const closeTag = `</${tagName}>`;
    const closeIdx = source.indexOf(closeTag, bodyStart);
    const body =
      closeIdx === -1
        ? source.slice(bodyStart)
        : source.slice(bodyStart, closeIdx);
    if (body.includes(INTERNAL_ARROW_GLYPH)) return true;
  }
  return false;
}

/**
 * Handed to #2402 by #2547's own resolution comment, not this ticket's
 * 9-file population — both render an *internal* link wearing the external
 * mark. Pinned by file, mirroring rule 8's and rule 10's exemption tables.
 */
const EXTERNAL_ARROW_EXEMPTIONS = new Set([
  // "Volledige kalender ↗" — an internal /kalender link. #2547: "under
  // rule 5 its ↗ is simply false." Not this ticket's to fix.
  "components/home/UpcomingMatches/UpcomingMatchesClient.tsx",
  // A literal ↗ inside an inverted <LinkButton> whose label already names
  // Brandsfit — rule 1 deletes it, but #2547 handed the whole file to
  // #2402 rather than this ticket.
  "components/home/ClubshopBanner/ClubshopBanner.tsx",
]);

const externalArrowSources = productionSources.filter(
  (relPath) => !EXTERNAL_ARROW_EXEMPTIONS.has(relPath),
);

describe("the external mark is <ExternalMark />, never a literal arrow (#2578)", () => {
  it.each(externalArrowSources)("%s — no literal ↗", (relPath) => {
    expect(hasExternalArrowGlyph(code.get(relPath)!)).toBe(false);
  });

  it.each(productionSources)(
    '%s — no target="_blank" element also carries a literal → in its own body',
    (relPath) => {
      expect(hasRelatedInternalArrow(code.get(relPath)!)).toBe(false);
    },
  );

  it.each(productionSources)(
    "%s — every sr-only announcement is Dutch, never English",
    (relPath) => {
      expect(hasEnglishAnnouncement(code.get(relPath)!)).toBe(false);
    },
  );
});

/**
 * The exemption list is itself pinned: an exemption that has genuinely lost
 * its ↗ must have the entry removed (rule 8's own "no fewer, no more" bar),
 * and this fails loudly the day that happens rather than quietly stop
 * testing a file that no longer needs the carve-out.
 */
describe("rule 11's exemptions stay pinned to a real, still-live ↗ (#2578)", () => {
  it.each([...EXTERNAL_ARROW_EXEMPTIONS])(
    "%s — still actually carries ↗",
    (relPath) => {
      expect(hasExternalArrowGlyph(code.get(relPath)!)).toBe(true);
    },
  );
});

/**
 * The lists are derived, so an edit that emptied either would read as a
 * pass on every route — the same coverage pin rules 5, 9 and 10 carry.
 * Every case below calls the actual detector functions the `it.each`
 * blocks above call — not a re-derived inline expression — so inverting or
 * deleting a detector's real behaviour fails these too, per review round 1
 * finding 5.
 */
describe("rule 11 catches what it claims to (#2578)", () => {
  it("covers every one of this ticket's 9 fixed files", () => {
    const fixed = [
      "components/article/ArticleBody/ArticleBody.tsx",
      "app/(main)/evenementen/[slug]/EventDetailCtas.tsx",
      "components/article/blocks/EventDetailBlock/EventDetailBlock.tsx",
      "components/article/blocks/EventFactInline/EventFactInline.tsx",
      "components/club/ContactPage/ContactPage.tsx",
      "app/(main)/club/ultras/UltrasHero.tsx",
      "app/(main)/club/ultras/page.tsx",
      "components/sponsors/FeaturedSponsorCard/FeaturedSponsorCard.tsx",
      "components/club/MembershipForm/MembershipForm.tsx",
    ];
    expect(fixed).toHaveLength(9);
    for (const file of fixed) {
      expect(externalArrowSources).toContain(file);
    }
  });

  it("does not flag the two files this ticket deliberately leaves for #2402", () => {
    expect(externalArrowSources).not.toContain(
      "components/home/UpcomingMatches/UpcomingMatchesClient.tsx",
    );
    expect(externalArrowSources).not.toContain(
      "components/home/ClubshopBanner/ClubshopBanner.tsx",
    );
  });

  it("flags a literal ↗ landing in an unexempted file", () => {
    expect(
      hasExternalArrowGlyph(
        "export const X = () => <a>Bezoek ons <span aria-hidden>↗</span></a>;",
      ),
    ).toBe(true);
  });

  it("leaves a file with no ↗ at all alone", () => {
    expect(
      hasExternalArrowGlyph("export const X = () => <a>Bezoek ons</a>;"),
    ).toBe(false);
  });

  it('flags a target="_blank" element that carries a bare → in its own body', () => {
    const offender = `<a href={x} target="_blank">Bestel <span aria-hidden>→</span></a>`;
    expect(hasRelatedInternalArrow(offender)).toBe(true);
  });

  it("flags the same defect on a next/link <Link>, not only a bare <a>", () => {
    const offender = `<Link href={x} target="_blank">Bestel <span aria-hidden>→</span></Link>`;
    expect(hasRelatedInternalArrow(offender)).toBe(true);
  });

  it('leaves an element alone that renders → with no target="_blank" on it', () => {
    const internal = `<a href="/kalender">Volledige kalender <span aria-hidden>→</span></a>`;
    expect(hasRelatedInternalArrow(internal)).toBe(false);
  });

  // The exact false positive review round 1 caught: SiteFooter's own shape
  // — a target="_blank" social link with no arrow in IT, and an unrelated
  // internal → CTA living in a DIFFERENT element in the same file. A
  // file-granular co-occurrence check would have flagged this; the
  // element-scoped one must not.
  it('does not flag an unrelated internal → CTA sharing a file with an unrelated target="_blank" social link', () => {
    const siteFooterShape = `
      <a href="https://facebook.com/KCVVElewijt" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
        <FacebookLogo aria-hidden="true" />
      </a>
      <Link href="/nieuws" className="prose-link">
        Alle nieuws <span aria-hidden="true">→</span>
      </Link>
    `;
    expect(hasRelatedInternalArrow(siteFooterShape)).toBe(false);
  });

  it('does not chase a target="_blank" built from a spread object', () => {
    // ClubshopBanner's own shape — `target: "_blank"` inside an object
    // literal never matches the attribute-string pattern this rule reads,
    // deliberately, since the file is already a pinned ↗ exemption above.
    const spread = `<LinkButton href={x} {...{ target: "_blank", rel: "noopener noreferrer" }}>Naar de shop <span>↗</span></LinkButton>`;
    expect(hasRelatedInternalArrow(spread)).toBe(false);
  });

  it("flags the retired English sr-only announcement", () => {
    expect(
      hasEnglishAnnouncement(
        '<span className="sr-only"> (Facebook, opens in new tab)</span>',
      ),
    ).toBe(true);
  });

  it("leaves the Dutch announcement alone", () => {
    expect(
      hasEnglishAnnouncement(
        '<span className="sr-only"> (opent in een nieuw tabblad)</span>',
      ),
    ).toBe(false);
  });
});
