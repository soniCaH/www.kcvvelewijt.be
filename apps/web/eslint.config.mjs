import { fileURLToPath } from "url";
import path from "path";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import storybook from "eslint-plugin-storybook";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The `apps/web/CLAUDE.md` rule "Import the module under test at module scope",
// in a form that fails the build instead of being re-litigated per file.
//
// Requiring an `it`/`test` ancestor is what makes this precise: module-scope
// `await import()` blocks (canonical-urls.test.ts, legacy-redirects.test.ts)
// must not trip, and neither must hook bodies — those are charged against
// `hookTimeout`, and CLAUDE.md scopes the convention to `it()` bodies.
//
// Vitest composes modifiers into chains (`it.skip`, `test.concurrent.skip`,
// `it.each(table)(…)`, `test.concurrent.for(table)(…)`), and esquery cannot
// express an unbounded `.object` walk — so the two call forms are crossed with
// each chain depth. Three modifiers is past anything Vitest's API composes.
const TEST_CALL_FORMS = ["callee", "callee.callee"]; // `it(…)` and `it.each(t)(…)`
const MODIFIER_DEPTHS = [
  "",
  ".object",
  ".object.object",
  ".object.object.object",
];

const TEST_CALLS = TEST_CALL_FORMS.flatMap((form) =>
  MODIFIER_DEPTHS.map(
    (depth) => `CallExpression[${form}${depth}.name=/^(it|test)$/]`,
  ),
).join(", ");

// Assembled without newlines on purpose: esquery does not parse a selector
// containing them, and it fails *silently* — the rule keeps loading, `lint`
// keeps exiting 0, and nothing is checked ever again.
const IN_BODY_ROUTE_IMPORT = `:matches(${TEST_CALLS}) ImportExpression > Literal[value=/\\/(page|layout|route|robots|sitemap|opengraph-image)$/]`;

// A test may not bind a fixed TCP port (#3109). Every Vitest process computes
// the same number, so parallel worktrees in a wave collide on `EADDRINUSE`.
// `.listen(0)` asks the OS for a free port and stays allowed; so does a socket
// path. A port is caught by its numeric value (`value>0`), so `0x22ba` counts
// and a string path does not. Shapes: `8890`, `8890 + n`, `{ port: 8890 }`,
// `{ port: 8890 + n }`, as the first `.listen()` argument.
// ponytail: an AST rule only sees the `.listen()` call site. A port read from a
// const, or handed to a child process through argv/env (the #3109 fixture's
// own shape), slips past — the fixture's comment carries that half.
// `8890`, or either side of `8890 + n`, at the node `prefix` points into.
const fixedPort = (prefix = "") =>
  `[${prefix}value>0], [${prefix}left.value>0], [${prefix}right.value>0]`;
const FIXED_PORT_LISTEN = `CallExpression[callee.property.name='listen'] > :first-child:matches(${fixedPort()}, ObjectExpression:has(> Property[key.name='port']:matches(${fixedPort("value.")})))`;

// A test may not write innerWidth/innerHeight (#3142): Vitest's window shim
// swallows the write. Covers `=`, `+=` and `++`/`--` on `window.innerWidth`,
// `window["innerWidth"]` or a bare `innerWidth`, and any call naming the key —
// `defineProperty`, `vi.stubGlobal`, `vi.spyOn`. See apps/web/CLAUDE.md.
const WINDOW_SIZE_KEY = "/^inner(Width|Height)$/";
const WRITE_TARGET =
  "AssignmentExpression > .left, UpdateExpression > .argument";
const WINDOW_SIZE_WRITE = `MemberExpression:matches(${WRITE_TARGET})[object.name=/^(window|globalThis|self|global)$/]:matches([property.name=${WINDOW_SIZE_KEY}], [property.value=${WINDOW_SIZE_KEY}]), Identifier:matches(${WRITE_TARGET})[name=${WINDOW_SIZE_KEY}], CallExpression > Literal.arguments[value=${WINDOW_SIZE_KEY}]`;

// Motion Vocabulary bans — DESIGN.md → Motion (#2658). #2650's `@theme`
// resets (`--ease-*: initial`, `--animate-*: initial`) already make most of
// Tailwind's motion utilities compile to nothing, but four gaps survive a
// namespace reset: `duration-<n>` is a bare-value utility that accepts any
// number regardless of theme, bracket syntax (`duration-[…]`, `ease-[…]`,
// `animate-[…]`) bypasses the theme entirely, and an `animate-` loop utility
// with no `motion-safe:`/`motion-reduce:` guard ignores
// `prefers-reduced-motion`. These three selectors close those gaps.
//
// Same newline trap as IN_BODY_ROUTE_IMPORT above: each pattern is built as
// a one-line string. Class strings are assembled through `cn()` and template
// literals as often as plain string literals, so every selector matches both
// `Literal` and `TemplateElement`.
// `duration-0` and `animate-none` are both legitimate "off" values — a
// zero-length transition and Tailwind's static `animation: none` utility,
// neither drawn from a theme scale — so both are excluded from their
// respective bans below. Flagging them would tell an author the opposite of
// what's true.
const OFF_SCALE_DURATION_PATTERN =
  "duration-(?!0(?:[^0-9]|$))(?!150(?:[^0-9]|$))(?!300(?:[^0-9]|$))(?!500(?:[^0-9]|$))[0-9]+";
const ARBITRARY_MOTION_VALUE_PATTERN = "(?:duration|ease|animate)-\\[";
const UNGUARDED_LOOP_PATTERN =
  "(?<!motion-safe:)(?<!motion-reduce:)animate-(?!none\\b)";

// Token-Only Colour Rule (DESIGN.md → Colors → Named Rules, #2433). This
// system has one paper, one ink, one green and a small set of named status
// tones — a bare Tailwind palette class is always a colour the page-set
// doesn't have. The prefix group is every utility that takes a colour value,
// including the three compound v4 utilities (`ring-offset-`, `inset-ring-`,
// `text-shadow-`) whose family name doesn't sit immediately after `ring-`/
// `text-` — `ring-offset-gray-200` has no bare `ring-<family>` or `offset-
// <family>` substring to fall back on, so it needs its own alternative
// (`inset-ring-*` and `text-shadow-*` already matched via the embedded
// `ring-*`/`shadow-*` substring, but are listed explicitly so the coverage
// is stated, not accidental). The family group is Tailwind's 22 default
// palette families (the 5 grays plus the 17 hues); the step is 2-3 digits
// not immediately followed by more digits, which is `[0-9]{2,3}(?![0-9])`
// rather than `\b` — avoids doubling a second backslash on top of the ones
// this string already needs. Same single-line/no-newline requirement as the
// three patterns above.
const RAW_PALETTE_CLASS_PATTERN =
  "(?:text-shadow|text|bg|border|from|to|via|ring-offset|inset-ring|ring|divide|outline|decoration|shadow|fill|stroke|accent|caret|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}(?![0-9])";

// Two-Tier Text Rule (DESIGN.md → Colors → Named Rules, #2551/#2568). Text
// has two tiers: `text-ink`/`text-ink-muted` on cream, `text-cream`/
// `text-cream-quiet` on dark. `text-ink-soft` is not a tier (1.20:1 from ink),
// and every `text-cream/NN` is either the rejected `/85` or a hand-rolled copy
// of the `cream-quiet` token — arbitrary (`/[0.85]`) and re-alpha'd
// (`text-cream-quiet/80`) forms included. The `ink-soft` token itself stays for surfaces,
// so only the `text-` utility is banned. `\\x2F` is `/`: esquery ends a regex
// at the first slash, escaped or not.
const TEXT_INK_SOFT_PATTERN = "(?<![\\w-])text-ink-soft(?![\\w-])";
const TEXT_CREAM_ALPHA_PATTERN =
  "(?<![\\w-])text-cream(?:-quiet)?\\x2F(?:[0-9]|\\[)";

// Section-Heading Margin Rule (#2552 rule 4 / #2554). Bottom axis only —
// `mb-*`/`my-*` (including the negative form, `-mb-*`/`-my-*`) at any
// responsive prefix (the `:` alternate in the anchor covers `sm:`/`md:`/
// `lg:`/`desk:`/`xl:`/`2xl:` without enumerating them) — `mt-*` carries
// kicker-to-heading air inside a page opening and is deliberately
// untouched. Only a bare `mb-0`/`my-0` (the value ending there, not
// `mb-0.5`) is excluded by the lookahead, so this rule doesn't fight the
// inert-spacing cleanup for the same lines (#2553) while still catching a
// fractional value.
const EDITORIAL_HEADING_MARGIN_PATTERN = "(^|\\s|:)-?(mb|my)-(?!0!?(\\s|$))";

// Type Ramp Freeze (DESIGN.md → Typography, #2418). Twelve token steps
// (`text-display-2xl` … `text-label-sm`) already cover the ramp — an
// arbitrary `text-[9px]`/`text-[10.5px]`/`text-[1.05rem]`/`text-[0.4em]`
// bypasses it outright, and `text-[length:var(--text-*)]` bypasses it while
// *looking* token-driven: the arbitrary-value form sets font-size alone and
// silently drops the step's line-height and tracking, which is exactly what
// DESIGN.md → Typography already tells authors never to write. Font-size
// literals only — `leading-[…]` belongs to #2666, not this rule.
// Strategy is freeze-and-drain, not big-bang: the 300+ literals that already
// exist are frozen via `eslint-suppressions.json` (`--suppress-all`), not
// fixed here, so this rule only stops the count from growing. Same
// single-line/no-newline requirement as the patterns above.
const OFF_RAMP_FONT_SIZE_PATTERN =
  "text-\\[(?:[0-9]+(?:\\.[0-9]+)?(?:px|r?em)\\]|length:)";

const matchesClassString = (pattern) =>
  `:matches(Literal[value=/${pattern}/], TemplateElement[value.raw=/${pattern}/])`;

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  ...storybook.configs["flat/recommended"],
  {
    settings: {
      next: {
        rootDir: __dirname,
      },
      // ponytail: pinned instead of "detect" — eslint-plugin-react's version
      // sniffer calls the `context.getFilename()` API that ESLint 10 removed.
      // Bump this when React majors; drop it when the plugin supports v10.
      react: {
        version: "19.2",
      },
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "storybook-static/**",
      "coverage/**",
      // `scripts/**` only matches when eslint's cwd is `apps/web`. lint-staged
      // runs from the repository root, where this path reads
      // `apps/web/scripts/…` — so without the second entry the pre-commit hook
      // lints a file `pnpm lint` deliberately skips, and can block a commit on
      // a rule CI never runs (#3013). A blanket `**/scripts/**` would be wrong:
      // it would also swallow `test/scripts/*.test.ts`, which IS linted today.
      // The gitignored entries above need no such pair — nothing under them can
      // ever be staged, so lint-staged never hands them to eslint.
      "scripts/**",
      "apps/web/scripts/**",
      "next-env.d.ts",
      // Fully generated by `sanity typegen generate`, never hand-edited —
      // same reason `next-env.d.ts` is here. Regenerating this file (wired
      // into `@kcvv/web#build` via `turbo.json`'s `dependsOn`) rewrites it
      // from scratch, so an in-file eslint-disable comment cannot survive a
      // regen; ignoring the whole file here does (#2858 PR review finding 1).
      // Leading `**/` so this still matches when eslint is invoked (and its
      // ignore basePath resolved) from the repo root, e.g. via lint-staged
      // in `.husky/pre-commit` — not just via the `@kcvv/web`-scoped script.
      "**/src/lib/sanity/sanity.types.ts",
    ],
  },
  {
    // Allow unused variables that start with underscore (common convention)
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // Motion Vocabulary bans (DESIGN.md → Motion, #2658). Test/spec files
    // are exempt — #2507 established the bare `animate-pulse` token as the
    // correct thing to write in a test selector (e.g.
    // `MatchLineup.test.tsx`, `MatchEvents.test.tsx`, both
    // `[class*="animate-pulse"]`), so guarding it there would be wrong, not
    // just unnecessary.
    // Leading `**/` for the same reason as the `ignores` entry above:
    // ESLint resolves these globs against the **cwd**, not the config
    // file. `lint-staged` in `.husky/pre-commit` invokes ESLint from the
    // repository root, where these paths start `apps/web/src` — a bare
    // `src/**` never matched there, so every rule below was inert at
    // commit time and ESLint deleted the valid disable comments that
    // reference them as unused directives (#3013).
    files: ["**/src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: matchesClassString(OFF_SCALE_DURATION_PATTERN),
          message:
            "Off-scale duration — the Three Speeds Rule allows only duration-150, duration-300 or duration-500 (apps/web/DESIGN.md → Motion). A duration outside those three is not a speed.",
        },
        {
          selector: matchesClassString(ARBITRARY_MOTION_VALUE_PATTERN),
          message:
            "Arbitrary motion value — bracket syntax bypasses the `@theme` namespace reset entirely (apps/web/DESIGN.md → Motion, the Namespace Rule). Use a sanctioned duration/curve/loop token instead.",
        },
        {
          selector: matchesClassString(UNGUARDED_LOOP_PATTERN),
          message:
            "Unguarded loop — an animate- utility needs a motion-safe: (or motion-reduce: to remove it) guard so prefers-reduced-motion can stop it (apps/web/DESIGN.md → Motion, the Reduced-Motion Rule).",
        },
        {
          selector: matchesClassString(RAW_PALETTE_CLASS_PATTERN),
          message:
            "Raw Tailwind palette class — every colour comes from a design token, never a bare palette class (apps/web/DESIGN.md → Colors, the Token-Only Colour Rule).",
        },
        {
          selector: matchesClassString(TEXT_INK_SOFT_PATTERN),
          message:
            "text-ink-soft is not a text tier — body voice is text-ink, metadata is text-ink-muted (apps/web/DESIGN.md → Colors, the Two-Tier Text Rule). bg-ink-soft stays allowed.",
        },
        {
          selector: matchesClassString(TEXT_CREAM_ALPHA_PATTERN),
          message:
            "Fractional cream text — on dark, body voice is text-cream and metadata is text-cream-quiet, never on jersey-deep (apps/web/DESIGN.md → Colors, the Two-Tier Text Rule and the Whole-Cream Rule).",
        },
        {
          selector: `JSXOpeningElement[name.name="EditorialHeading"] > JSXAttribute[name.name="className"] ${matchesClassString(EDITORIAL_HEADING_MARGIN_PATTERN)}`,
          message:
            "A section heading's bottom margin belongs to <SectionHeader> (mb-8 sm:mb-10, #2552 rule 5). <EditorialHeading> carries no margin of its own (#2552 rule 4). Whether this heading should be a <SectionHeader> is a judgement this rule does not make.",
        },
        {
          selector: matchesClassString(OFF_RAMP_FONT_SIZE_PATTERN),
          message:
            "Off-ramp literal font size — the type ramp has a token for every step (apps/web/DESIGN.md → Typography). A text-[…px]/[…rem]/[…em] or text-[length:…] bypasses it and silently drops the step's line-height and tracking. Existing call sites are frozen in eslint-suppressions.json; new code must use a text-* token.",
        },
      ],
    },
  },
  {
    // Test-file rules: img rules off (we mock Next.js Image), plus the
    // module-scope import guard, the window-size ban and the fixed-port ban above.
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    rules: {
      "@next/next/no-img-element": "off",
      "jsx-a11y/alt-text": "off",
      "no-restricted-syntax": [
        "error",
        {
          selector: IN_BODY_ROUTE_IMPORT,
          message:
            "Hoist this page/route module import to module scope — Vitest charges an in-body dynamic import against testTimeout, which breaks under CI contention (apps/web/CLAUDE.md).",
        },
        {
          selector: WINDOW_SIZE_WRITE,
          message:
            "Do not write innerWidth/innerHeight in a test — Vitest's shim keeps the value and happy-dom never sees it, so matchMedia and resize stay on the old viewport (#3142). Use window.happyDOM.setViewport({ width, height }).",
        },
        {
          selector: FIXED_PORT_LISTEN,
          message:
            "A test may not bind a fixed TCP port — parallel worktrees collide on it (#3109). Listen on port 0 and read the port the OS assigned.",
        },
      ],
    },
  },
];

export default eslintConfig;
