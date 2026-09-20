/**
 * Detail-tokens consistency guard (#2610, Y4 superseded by #2579)
 *
 * #2610 shipped four "free tier" CSS-discipline rules (decision-sheet §8 D0
 * — C6, S8, M6, Y4): a jersey-deep `::selection` inverted inside ink/jersey
 * bands, a hover that adds a border always reserving the width at rest, a
 * hovered underline thickening rather than jumping, and — Y4, as it stood
 * then — scores/tables pairing `tabular-nums` with `lining-nums` or a mono
 * face, since the kit ships no `tnum` feature and `tabular-nums` alone does
 * nothing.
 *
 * **Y4 is rewritten by #2579, not merely satisfied.** #2516 (the decision
 * #2579 builds) measured `lining-nums` itself: on the two display faces it
 * changes digit widths but never equalises them (spread 47.4 → 37.4 on
 * `freight-big-pro`), so it was never a working alignment switch either —
 * only true monospace is, by construction. The rule is now zero-tolerance:
 * no `font-variant-numeric` utility ships anywhere. A number is either the
 * *subject* of its surface (keeps its display face, no figure class — the
 * family's default figure set is already oldstyle) or a *tag* on something
 * else (moves to `font-mono`, which aligns by construction, not by class).
 * `tabular-nums` was already banned solo by the old Y4; this version bans
 * `lining-nums` and the rest of the `font-variant-numeric` value set too,
 * with no "unless paired with X" escape hatch.
 *
 * This file is intentionally separate from `cross-page-consistency.test.ts`:
 * #2578 owns that file this wave, and every later ticket that wants a
 * detail-token rule should append here rather than open a third file.
 *
 * @see https://github.com/soniCaH/www.kcvvelewijt.be/issues/2610
 * @see https://github.com/soniCaH/www.kcvvelewijt.be/issues/2579
 * @see https://github.com/soniCaH/www.kcvvelewijt.be/issues/2516
 */

import { describe, it, expect } from "vitest";
import { globSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const srcDir = resolve(__dirname, "../..");
const globalsCss = readFileSync(resolve(srcDir, "app/globals.css"), "utf8");

const SELF = "app/__tests__/detail-tokens-consistency.test.ts";

/**
 * Every first-party `.ts`/`.tsx` source file, minus this guard. `.ts`
 * matters as much as `.tsx` here — `fieldChrome.ts`, `button-styles.ts` and
 * `press-down.ts` are dedicated class-string modules (no JSX at all) that a
 * `**\/*.tsx`-only glob would silently never scan, `fieldChrome.ts` being
 * the exact file globals.css's own S8 comment names as an audited site
 * (#2610 review, round 1).
 *
 * `components/team/` used to be excluded here while #2637 owned it for a
 * separate wave — that ticket shipped (closed), so the tree is back in
 * scope: it is exactly where `StandingsTable`, `PlayerCard`, `TeamAgendaRow`
 * and `YouthDirectory` live, four of #2579's thirteen files.
 */
const sourceFiles = globSync(["**/*.tsx", "**/*.ts"], { cwd: srcDir })
  .sort()
  .filter((relPath) => relPath !== SELF);

/** Shipped behaviour only — no tests, no stories. */
const productionSources = sourceFiles.filter(
  (relPath) => !/\.(test|stories)\.tsx?$/.test(relPath),
);

/**
 * Split a string of source text into class-name tokens: every whitespace-
 * run inside a `"…"` / `'…'` string, or inside the STATIC portions of a
 * `` `…` `` template literal, becomes a token boundary. Comments (`//…`,
 * `/* … *‍/`) are skipped. A single character-by-character scan, not a
 * regex — regex string-matching (this file's round-1 fix) gets comments
 * right but cannot get backtick interpolation right: `` `${cond ? "a" :
 * "b"}` `` is not "one opaque string", because `"a"` and `"b"` are
 * themselves ordinary string literals nested inside the `${}` CODE region,
 * not template text. Treating the whole backtick span as one blob and
 * whitespace-splitting it (round 1's approach) glues a stray quote onto
 * whichever word sits at a nested string's own edge — reproduced on
 * SharePage's exact shape, where the ternary's second branch ends
 * `…bg-cream"}` with no whitespace between the closing quote and the `}`,
 * so no edge-trim regex can recover the clean `bg-cream` token (#2610
 * review, round 2). This scanner instead walks the STATIC template text
 * and each `${…}` interpolation separately: static text is tokenised
 * directly; a `${…}` region is scanned as ordinary code, whose own nested
 * strings (and, in principle, nested backticks) are found and tokenised
 * the same recursive way, while a nested `{`/`}` (an object literal, a
 * block) inside the interpolation is depth-tracked rather than mistaken
 * for the interpolation's own closing brace.
 */
function classTokens(source: string): Set<string> {
  const tokens = new Set<string>();
  let buf = "";

  const flush = () => {
    if (!buf) return;
    for (const token of buf.split(/\s+/)) {
      if (token) tokens.add(token);
    }
    buf = "";
  };

  // Stack of active contexts, innermost last: a quote char (content is
  // being buffered), "${" (template interpolation — ordinary code rules,
  // buffering suspended), or "{" (a nested code brace inside "${", e.g. an
  // object literal — depth-tracked so it doesn't close the interpolation).
  const stack: Array<'"' | "'" | "`" | "${" | "{"> = [];

  for (let i = 0; i < source.length; i++) {
    const ch = source[i]!;
    const top = stack[stack.length - 1];

    if (top === '"' || top === "'") {
      if (ch === "\\") {
        i++;
        continue; // escape sequence — not a token boundary either way
      }
      if (ch === top) {
        flush();
        stack.pop();
        continue;
      }
      buf += ch;
      continue;
    }

    if (top === "`") {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === "`") {
        flush();
        stack.pop();
        continue;
      }
      if (ch === "$" && source[i + 1] === "{") {
        flush(); // static text collected so far in this template
        stack.push("${");
        i++;
        continue;
      }
      buf += ch;
      continue;
    }

    if (top === "${" || top === "{") {
      // Ordinary code, not template text — no tokens buffered here
      // directly; nested strings/backticks recurse through the same
      // machine above. `{` nests (object literal, block); `}` closes
      // whichever of "{" / "${" is innermost.
      if (ch === "/" && source[i + 1] === "/") {
        const nl = source.indexOf("\n", i);
        i = nl === -1 ? source.length : nl;
        continue;
      }
      if (ch === "/" && source[i + 1] === "*") {
        const end = source.indexOf("*/", i + 2);
        i = end === -1 ? source.length : end + 1;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        stack.push(ch);
        continue;
      }
      if (ch === "{") {
        stack.push("{");
        continue;
      }
      if (ch === "}") {
        stack.pop();
        continue;
      }
      continue;
    }

    // Top level — no active string/template/interpolation.
    if (ch === "/" && source[i + 1] === "/") {
      const nl = source.indexOf("\n", i);
      i = nl === -1 ? source.length : nl;
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      i = end === -1 ? source.length : end + 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      stack.push(ch);
      continue;
    }
    // Any other top-level character (code) carries no class names.
  }
  flush();

  return tokens;
}

/**
 * Extract the source span from `openIndex` (pointing at `open`) to its
 * matching `close`, honouring nested string/template literals — including
 * `${}` interpolation inside a backtick, which can itself contain further
 * nested strings and braces — and `//` / `/* *‍/` comments, so a bracket-
 * shaped character inside any of those never closes the scan early. This
 * is bracket/string/comment-aware, not a full parser: it has no notion of
 * JSX, TypeScript types, or regex literals, but every pattern this project
 * actually writes a class list in — a `className={…}` JSX expression, a
 * bare `className="…"`, a `cn(…)` call, an array `.join(" ")` — resolves
 * correctly under it. Verified against all 615 production `.ts`/`.tsx`
 * files during #2610's review round 2: every hover-border-colour and
 * `tabular-nums` token found by a whole-file scan also showed up inside at
 * least one bag `findBagSpans` found for that file — zero orphans, zero
 * silently-uncovered tokens.
 */
function extractBalanced(
  source: string,
  openIndex: number,
  open: string,
  close: string,
): string | null {
  let depth = 0;
  const stack: string[] = [];

  for (let i = openIndex; i < source.length; i++) {
    const ch = source[i]!;

    if (stack.length > 0) {
      const top = stack[stack.length - 1];
      if (top === "`") {
        if (ch === "\\") {
          i++;
          continue;
        }
        if (ch === "`") {
          stack.pop();
          continue;
        }
        if (ch === "$" && source[i + 1] === "{") {
          stack.push("${");
          i++;
          continue;
        }
        continue;
      }
      // "${" (a template interpolation) and "{" (a code brace nested inside
      // one) follow the same rules: ordinary code, where a `{` nests and a
      // `}` closes the innermost one. `classTokens` below already models
      // this; `extractBalanced` did not (CodeRabbit round 3).
      //
      // Honest scope: this is a PARITY fix, not a proven bug fix. Without the
      // nesting push the state machine really does pop "${" on an object
      // literal's own `}` — but the span still comes out identical, because
      // the enclosing backtick re-absorbs the mis-parsed run and the depth
      // counter (which only advances while the stack is empty) does the real
      // work. Probed old-vs-new across five shapes — object literal in an
      // interpolation, a block brace, a nested template, a `}` inside a
      // string, and no template at all — and every span matched byte for
      // byte, so no fixture here can fail without it. Kept anyway: two
      // scanners reading the same syntax by different rules is the exact
      // trap that silently exempted 10 files in round 1.
      if (top === "${" || top === "{") {
        if (ch === "{") {
          stack.push("{");
          continue;
        }
        if (ch === "}") {
          stack.pop();
          continue;
        }
        if (ch === '"' || ch === "'" || ch === "`") {
          stack.push(ch);
          continue;
        }
        if (ch === "\\") {
          i++;
          continue;
        }
        continue;
      }
      // top is a plain quote character (" or ')
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === top) {
        stack.pop();
        continue;
      }
      continue;
    }

    // Not inside any string/template — normal code scanning.
    if (ch === "/" && source[i + 1] === "/") {
      const nl = source.indexOf("\n", i);
      i = nl === -1 ? source.length : nl;
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      i = end === -1 ? source.length : end + 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      stack.push(ch);
      continue;
    }
    if (ch === open) {
      depth++;
      continue;
    }
    if (ch === close) {
      depth--;
      if (depth === 0) return source.slice(openIndex, i + 1);
      continue;
    }
  }
  return null; // unterminated — caller discards
}

/**
 * The class-list "expressions" `classTokens` scoping needs (#2610 review,
 * round 2): each `className={…}` JSX attribute, each bare `className="…"`,
 * each `cn(…)` call (inside or outside JSX — `button-styles.ts` and
 * `press-down.ts` build a class string with no JSX at all), and each array
 * literal immediately `.join(…)`'d (`fieldChrome.ts`'s `[…].join(" ")`
 * state machine). Every one of these becomes ONE bag of tokens — a `cn()`
 * call's several string-literal arguments, ternary branches included, read
 * together rather than one string at a time, which is what makes
 * `OrganigramExplorer.tsx`'s resting `border` (one branch) plus
 * `hover:border-cream` (another branch) of the same call correctly count
 * as reserved. A `className={cn(…)}` produces two overlapping bags (the
 * outer JSX-expression span and the inner call span) — harmless
 * redundancy, not a correctness problem, since a duplicate bag can only
 * ever agree with itself.
 */
function findBagSpans(source: string): string[] {
  const spans: string[] = [];

  for (const m of source.matchAll(/className=\{/g)) {
    const openIdx = m.index + m[0].length - 1;
    const span = extractBalanced(source, openIdx, "{", "}");
    if (span) spans.push(span);
  }

  for (const m of source.matchAll(/className="(?:\\[\s\S]|[^"\\])*"/g)) {
    spans.push(m[0].slice("className=".length));
  }

  for (const m of source.matchAll(/\bcn\(/g)) {
    const openIdx = m.index + m[0].length - 1;
    const span = extractBalanced(source, openIdx, "(", ")");
    if (span) spans.push(span);
  }

  for (const m of source.matchAll(/\[/g)) {
    const span = extractBalanced(source, m.index, "[", "]");
    if (!span) continue;
    // Skip whatever whitespace separates `]` from `.join(` rather than
    // peeking a fixed number of characters: an 8-char window leaves room for
    // `.join(` plus only two spaces, so a formatted array whose `.join(" ")`
    // sits on the next line at any normal indent was silently not a bag
    // (CodeRabbit round 3). Walking the run is exact and stays linear.
    let after = m.index + span.length;
    while (after < source.length && /\s/.test(source[after]!)) after++;
    if (source.startsWith(".join(", after)) spans.push(span);
  }

  return spans;
}

/** One bag of tokens per class-list expression found in a file. */
const bagsByFile = new Map(
  productionSources.map((relPath) => {
    const source = readFileSync(resolve(srcDir, relPath), "utf8");
    return [relPath, findBagSpans(source).map(classTokens)] as const;
  }),
);

describe("classTokens — comment/string regression fixtures (#2610 review, round 1)", () => {
  it("a `//` inside a string literal does not corrupt the rest of the file", () => {
    const source = [
      '<a href="https://kcvvelewijt.be/x">link</a>',
      'const cls = "border border-ink hover:border-jersey-deep tabular-nums";',
    ].join("\n");

    const tokens = classTokens(source);

    expect(tokens.has("https://kcvvelewijt.be/x")).toBe(true);
    expect(tokens.has("border")).toBe(true);
    expect(tokens.has("hover:border-jersey-deep")).toBe(true);
    expect(tokens.has("tabular-nums")).toBe(true);
  });

  it("still strips a real `//` line comment", () => {
    const source = [
      "// hover:border-should-not-count",
      'const cls = "border-2";',
    ].join("\n");

    const tokens = classTokens(source);

    expect(tokens.has("hover:border-should-not-count")).toBe(false);
    expect(tokens.has("border-2")).toBe(true);
  });

  it("still strips a real block comment", () => {
    const source = [
      "/* hover:border-should-not-count */",
      'const cls = "border-2";',
    ].join("\n");

    const tokens = classTokens(source);

    expect(tokens.has("hover:border-should-not-count")).toBe(false);
    expect(tokens.has("border-2")).toBe(true);
  });

  it("does not leave a stray quote glued to a token at the edge of a ${ternary} inside a template literal", () => {
    const source =
      'const x = `border-2 px-4 ${cond ? "border-ink bg-jersey-deep" : "border-ink/30 hover:border-ink bg-cream"}`;';

    const tokens = classTokens(source);

    expect(tokens.has("border-2")).toBe(true);
    expect(tokens.has("border-ink")).toBe(true);
    expect(tokens.has("bg-jersey-deep")).toBe(true);
    expect(tokens.has("hover:border-ink")).toBe(true);
    expect(tokens.has("bg-cream")).toBe(true);
    // No leftover quote-glued garbage tokens.
    expect([...tokens].some((t) => t.includes('"'))).toBe(false);
  });
});

describe("findBagSpans / extractBalanced — expression-scoping fixtures (#2610 review, round 2)", () => {
  it("keeps a cn() call's ternary branches in one bag (OrganigramExplorer's shape)", () => {
    const source = `
      <button
        className={cn(
          "border px-1.5 py-0.5",
          scaleStep === step
            ? "border-warm bg-warm text-ink"
            : "border-cream/40 text-cream hover:border-cream",
        )}
      />
    `;
    const bags = findBagSpans(source).map(classTokens);
    const bag = bags.find(
      (b) => b.has("border") && b.has("hover:border-cream"),
    );
    expect(bag).toBeDefined();
  });

  it("keeps a template literal's static prefix and its ${ternary} branches in one bag (SharePage's shape)", () => {
    const source = [
      "<button",
      "  className={`flex-1 rounded-none border-2 px-4 ${",
      "    aspect === opt.value",
      '      ? "border-ink bg-jersey-deep text-cream"',
      '      : "border-ink/30 text-ink-soft hover:border-ink bg-cream"',
      "  }`}",
      "/>",
    ].join("\n");
    const bags = findBagSpans(source).map(classTokens);
    const bag = bags.find(
      (b) => b.has("border-2") && b.has("hover:border-ink"),
    );
    expect(bag).toBeDefined();
  });

  it("keeps an array literal's entries in one bag when immediately .join()'d (fieldChrome.ts's shape)", () => {
    const source = `
      export const fieldChromeIdle = [
        "border-2 bg-white",
        "border-ink/30",
        "hover:border-ink/40",
      ].join(" ");
    `;
    const bags = findBagSpans(source).map(classTokens);
    const bag = bags.find(
      (b) => b.has("border-2") && b.has("hover:border-ink/40"),
    );
    expect(bag).toBeDefined();
  });

  it("does NOT bag two separate elements' className attributes together — a hover border on one element is not reserved by an unrelated width on another", () => {
    const source = `
      <span className="hover:border-ink text-ink" />
      <div className="border-2 bg-cream" />
    `;
    const bags = findBagSpans(source).map(classTokens);
    expect(bags).toHaveLength(2);
    const hoverBag = bags.find((b) => b.has("hover:border-ink"))!;
    const widthBag = bags.find((b) => b.has("border-2"))!;
    expect(hoverBag).not.toBe(widthBag);
    expect(hoverBag.has("border-2")).toBe(false);
    expect(hoverBag.has("border")).toBe(false);
  });
});

describe("findBagSpans / extractBalanced — round 3 fixtures (CodeRabbit)", () => {
  it('an array `.join(" ")` is a bag however much whitespace precedes it', () => {
    // The old fixed 8-character lookahead fit `.join(` plus two spaces, so a
    // prettier-formatted array whose `.join()` lands on the next line at any
    // normal indent was silently not a bag at all.
    const source = [
      "const cls = [",
      '  "border-2",',
      '  "hover:border-ink",',
      "]",
      '          .join(" ");',
    ].join("\n");
    const spans = findBagSpans(source);
    const bag = spans.find((sp) => sp.includes("hover:border-ink"));
    expect(bag).toBeDefined();
    expect(bag).toContain("border-2");
  });

  it("an array NOT followed by .join() is still not a bag", () => {
    const source = 'const notClasses = ["border-2", "hover:border-ink"];';
    expect(
      findBagSpans(source).some((sp) => sp.includes("hover:border-ink")),
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// C6 — selection is inverted inside ink / jersey-deep(-dark) bands, and
// re-reverted inside a light surface nested inside one of those bands
// ---------------------------------------------------------------------------

describe("::selection is jersey-deep-on-cream, inverted on dark bands (C6)", () => {
  it("globals.css declares the base mark", () => {
    expect(globalsCss).toMatch(
      /::selection\s*{[^}]*background-color:\s*var\(--color-jersey-deep\)[^}]*color:\s*var\(--color-cream\)/,
    );
  });

  it("globals.css inverts the mark under .bg-ink / .bg-jersey-deep / .bg-jersey-deep-dark, both as the band's own text and as a descendant's", () => {
    for (const band of ["bg-ink", "bg-jersey-deep", "bg-jersey-deep-dark"]) {
      expect(globalsCss).toContain(`.${band}::selection,`);
      // Last selector in the group has no trailing comma (it's followed by
      // `{`), so this checks the substring without one.
      expect(globalsCss).toContain(`.${band} ::selection`);
    }
    expect(globalsCss).toMatch(
      /\.bg-ink::selection,\s*\n\s*\.bg-ink ::selection,[\s\S]*?{[^}]*background-color:\s*var\(--color-cream\)[^}]*color:\s*var\(--color-jersey-deep\)/,
    );
  });

  it("globals.css reverts the mark under a light surface (.bg-cream / .bg-cream-soft / .bg-cream-deep), both as the surface's own text and as a descendant's", () => {
    for (const surface of ["bg-cream", "bg-cream-soft", "bg-cream-deep"]) {
      expect(globalsCss).toContain(`.${surface}::selection,`);
      expect(globalsCss).toContain(`.${surface} ::selection`);
    }
    expect(globalsCss).toMatch(
      /\.bg-cream::selection,\s*\n\s*\.bg-cream ::selection,[\s\S]*?{[^}]*background-color:\s*var\(--color-jersey-deep\)[^}]*color:\s*var\(--color-cream\)/,
    );
  });

  it("the light-surface revert is declared after the dark-band inversion, so it wins the cascade for a light card nested inside a dark band", () => {
    const darkBandIndex = globalsCss.indexOf(".bg-ink::selection,");
    const lightSurfaceIndex = globalsCss.indexOf(".bg-cream::selection,");
    expect(darkBandIndex).toBeGreaterThan(-1);
    expect(lightSurfaceIndex).toBeGreaterThan(darkBandIndex);
  });
});

// ---------------------------------------------------------------------------
// S8 — a hover that adds a border reserves the width, on the SAME side, in
// the SAME class-list expression, at rest. Side-aware (an axis utility like
// `border-x` normalises to its two concrete sides before comparing) and
// expression-scoped (a resting width on an unrelated element in the same
// file no longer counts), matching what the globals.css S8 comment claims.
// ---------------------------------------------------------------------------

type BorderSide = "all" | "t" | "r" | "b" | "l" | "x" | "y";
type ConcreteSide = "t" | "r" | "b" | "l";

/** Zero or more generic variant prefixes, then one of the variants the S8
 *  comment in globals.css actually claims: hover, group-hover,
 *  focus-visible, or `has-[:hover]`. Matches `hover:`, `md:hover:`,
 *  `sm:group-hover:`, and `has-[:hover]:` alike. */
const HOVER_VARIANT_PREFIX =
  /^(?:[a-z][a-z0-9-]*:)*(?:hover|group-hover|focus-visible|has-\[:hover\]):/;

/** A bare (unvaried) Tailwind border utility — `border`, `border-2`,
 *  `border-t`, `border-ink/30`, `border-t-jersey-deep`, `border-[1.5px]`. */
const BORDER_UTILITY = /^border(?:-(t|r|b|l|x|y))?(?:-(.+))?$/;

function parseBorderUtility(
  token: string,
): { side: BorderSide; kind: "width" | "color" } | null {
  const m = token.match(BORDER_UTILITY);
  if (!m) return null;
  const side = (m[1] as BorderSide | undefined) ?? "all";
  const value = m[2];
  if (value === undefined) return { side, kind: "width" };
  // A width is a bare number (`border-2`) or an arbitrary value
  // (`border-[1.5px]`); anything else (`border-ink`, `border-jersey-deep`,
  // `border-ink/30`, `border-dashed`) is treated as not-a-width — correct
  // for colours, and harmlessly conservative for the rare style keyword
  // (`border-dashed`), which never by itself reserves a width either.
  const kind = /^(?:\d|\[)/.test(value) ? "width" : "color";
  return { side, kind };
}

/** Normalise an axis/all side onto the concrete edges it actually covers:
 *  `x` → left + right, `y` → top + bottom, `all` → all four. A single side
 *  maps to itself. Both the hover side and the resting side must go
 *  through this before comparing — `border-x` at rest and `hover:border-l`
 *  share no side name in common (`x` ≠ `l`) but DO cover each other once
 *  expanded, and `border-x` must NOT be credited with covering
 *  `hover:border-t` even though both mention no matching literal side
 *  (#2610 review, round 2). */
function expandSide(side: BorderSide): ConcreteSide[] {
  switch (side) {
    case "all":
      return ["t", "r", "b", "l"];
    case "x":
      return ["l", "r"];
    case "y":
      return ["t", "b"];
    default:
      return [side];
  }
}

function hoverBorderConcreteSides(bag: Set<string>): Set<ConcreteSide> {
  const sides = new Set<ConcreteSide>();
  for (const token of bag) {
    if (!HOVER_VARIANT_PREFIX.test(token)) continue;
    const rest = token.replace(HOVER_VARIANT_PREFIX, "");
    const parsed = parseBorderUtility(rest);
    if (parsed?.kind === "color") {
      for (const s of expandSide(parsed.side)) sides.add(s);
    }
  }
  return sides;
}

function restingBorderWidthConcreteSides(bag: Set<string>): Set<ConcreteSide> {
  const sides = new Set<ConcreteSide>();
  for (const token of bag) {
    if (HOVER_VARIANT_PREFIX.test(token)) continue;
    const parsed = parseBorderUtility(token);
    if (parsed?.kind === "width") {
      for (const s of expandSide(parsed.side)) sides.add(s);
    }
  }
  return sides;
}

describe("parseBorderUtility / expandSide (#2610 review — side-aware fixtures)", () => {
  it.each<[string, BorderSide, "width" | "color"]>([
    ["border", "all", "width"],
    ["border-2", "all", "width"],
    ["border-[1.5px]", "all", "width"],
    ["border-t", "t", "width"],
    ["border-t-2", "t", "width"],
    ["border-ink", "all", "color"],
    ["border-ink/30", "all", "color"],
    ["border-jersey-deep", "all", "color"],
    ["border-t-jersey-deep", "t", "color"],
    ["border-b", "b", "width"],
  ])("%s → side %s, kind %s", (token, side, kind) => {
    expect(parseBorderUtility(token)).toEqual({ side, kind });
  });

  it("rejects a non-border token", () => {
    expect(parseBorderUtility("bg-ink")).toBeNull();
  });

  it("a resting border-x covers a hover:border-l (round 2, finding 1)", () => {
    const resting = restingBorderWidthConcreteSides(new Set(["border-x"]));
    const hover = hoverBorderConcreteSides(new Set(["hover:border-l-ink"]));
    for (const side of hover) expect(resting.has(side)).toBe(true);
  });

  it("a resting border-l + border-r together cover a hover:border-x (round 2, finding 1)", () => {
    const resting = restingBorderWidthConcreteSides(
      new Set(["border-l", "border-r"]),
    );
    const hover = hoverBorderConcreteSides(new Set(["hover:border-x-ink"]));
    for (const side of hover) expect(resting.has(side)).toBe(true);
  });

  it("a resting border-x does NOT cover a hover:border-t (round 2, finding 1)", () => {
    const resting = restingBorderWidthConcreteSides(new Set(["border-x"]));
    const hover = hoverBorderConcreteSides(new Set(["hover:border-t-ink"]));
    const covered = [...hover].every((side) => resting.has(side));
    expect(covered).toBe(false);
  });

  it("fixture: an all-sides hover colour is NOT reserved by a single-side resting width", () => {
    const bag = new Set(["border-b", "hover:border-ink"]);
    const hover = hoverBorderConcreteSides(bag);
    const resting = restingBorderWidthConcreteSides(bag);
    expect(hover).toEqual(new Set(["t", "r", "b", "l"]));
    const covered = [...hover].every((side) => resting.has(side));
    expect(covered).toBe(false);
  });
});

describe("a hover-added border reserves its width, on the same side, in the same expression, at rest (S8)", () => {
  it.each(productionSources)(
    "%s — every hover/focus-visible/has-[:hover] border colour has a matching resting border-width token in its own class-list expression",
    (relPath) => {
      const bags = bagsByFile.get(relPath)!;
      for (const bag of bags) {
        const hoverSides = hoverBorderConcreteSides(bag);
        if (hoverSides.size === 0) continue;
        const restingSides = restingBorderWidthConcreteSides(bag);
        for (const side of hoverSides) {
          expect(restingSides.has(side)).toBe(true);
        }
      }
    },
  );
});

// ---------------------------------------------------------------------------
// M6 — a hovered underline thickens, and the gesture is absent under
// prefers-reduced-motion (the transition, not the end state)
// ---------------------------------------------------------------------------

describe("hover-underline-thicken exists, is layered, and respects reduced motion (M6)", () => {
  it("globals.css declares the thickness transition on the Chrome speed, as transition longhands", () => {
    expect(globalsCss).toMatch(
      /\.hover-underline-thicken\s*{[^}]*text-decoration-thickness:\s*1px[^}]*transition-property:\s*text-decoration-thickness;[^}]*transition-duration:\s*150ms;[^}]*transition-timing-function:\s*var\(--ease-out\)/,
    );
  });

  it("globals.css thickens on hover and focus-visible", () => {
    expect(globalsCss).toMatch(
      /\.hover-underline-thicken:hover,\s*\n\s*\.hover-underline-thicken:focus-visible\s*{[^}]*text-decoration-thickness:\s*2px/,
    );
  });

  it("globals.css makes the transition absent (not shortened) under reduced motion", () => {
    const reducedMotionBlocks = globalsCss.match(
      /@media \(prefers-reduced-motion: reduce\) {[\s\S]*?\n {2}}/g,
    );
    const ownsHoverUnderline = reducedMotionBlocks?.some(
      (block) =>
        block.includes(".hover-underline-thicken") &&
        block.includes("transition-property: none"),
    );
    expect(ownsHoverUnderline).toBe(true);
  });

  it("is declared inside @layer components, not unlayered, so a later utility (no-underline, decoration-2, transition-colors) can still win", () => {
    const layerMatch = globalsCss.match(/@layer components\s*{([\s\S]*?)\n}\n/);
    expect(layerMatch).not.toBeNull();
    expect(layerMatch![1]).toContain(".hover-underline-thicken {");
  });
});

// ---------------------------------------------------------------------------
// Y4 (rewritten by #2579) — zero figure-style utilities anywhere. Every
// `font-variant-numeric` value — `tabular-nums`, `lining-nums`,
// `oldstyle-nums`, `proportional-nums`, `slashed-zero`, `diagonal-fractions`,
// `stacked-fractions` — is banned outright, full stop. No pairing excuses it
// (that was the old Y4's rule, and #2516 measured that `lining-nums` doesn't
// even deliver a working tabular set on either display face — see the file
// header). Alignment for a column of figures comes from choosing a mono
// face, which is monospaced by construction, never from a class. A number
// that is the *subject* of its surface keeps its display face and inherits
// that family's default figure set (already oldstyle, measured identical to
// `oldstyle-nums` on every Freight face — no class needed to get it).
// ---------------------------------------------------------------------------

/** The complete `font-variant-numeric` figure-style value set Tailwind v4
 *  generates a utility for. `normal-nums` (the reset value) and `ordinal`
 *  (a glyph-shape feature unrelated to digit width/spacing) are deliberately
 *  excluded — this rule bans figure-STYLE utilities, not the whole
 *  namespace. */
const FIGURE_STYLE_UTILITIES = [
  "tabular-nums",
  "lining-nums",
  "oldstyle-nums",
  "proportional-nums",
  "slashed-zero",
  "diagonal-fractions",
  "stacked-fractions",
] as const;

describe("zero figure-style utilities anywhere — alignment comes from the face, not a class (Y4)", () => {
  it.each(productionSources)(
    "%s — no class-list expression carries a font-variant-numeric figure-style utility",
    (relPath) => {
      const bags = bagsByFile.get(relPath)!;
      for (const bag of bags) {
        for (const utility of FIGURE_STYLE_UTILITIES) {
          expect(bag.has(utility)).toBe(false);
        }
      }
    },
  );

  // Bisected against two deliberately-broken fixtures — one direct class
  // literal, one nested inside a cn(...) conditional — to prove the rule
  // actually goes red before trusting it goes green on the real tree.

  it("fixture: catches a direct class literal", () => {
    const source = `<span className="font-display-big tabular-nums" />`;
    const bags = findBagSpans(source).map(classTokens);
    const violated = bags.some((bag) =>
      FIGURE_STYLE_UTILITIES.some((utility) => bag.has(utility)),
    );
    expect(violated).toBe(true);
  });

  it("fixture: catches a figure-style utility nested inside a cn(...) conditional branch", () => {
    const source = `
      <span
        className={cn(
          "font-display-big font-black",
          isScore ? "lining-nums" : "text-ink-muted",
        )}
      />
    `;
    const bags = findBagSpans(source).map(classTokens);
    const violated = bags.some((bag) =>
      FIGURE_STYLE_UTILITIES.some((utility) => bag.has(utility)),
    );
    expect(violated).toBe(true);
  });

  it("fixture: a clean mono tag and a clean display-face subject both pass", () => {
    const source = `
      <span className="font-mono text-mono-sm" />
      <span className="font-display-big font-black" />
    `;
    const bags = findBagSpans(source).map(classTokens);
    const violated = bags.some((bag) =>
      FIGURE_STYLE_UTILITIES.some((utility) => bag.has(utility)),
    );
    expect(violated).toBe(false);
  });
});
