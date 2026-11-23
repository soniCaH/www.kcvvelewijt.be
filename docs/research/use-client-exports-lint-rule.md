# A hand-written `kcvv/use-client-exports` rule: normal practice, or a weird thing to own?

> Research for the draft PR on [#3839](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3839)
> (branch `feat/issue-3839`, worktree `kcvv-issue-3839` at `9c7c366ba`). Written 2026-11-23.
> **Nothing in the repo was changed.** The experiment ran in a throwaway Next app in the session
> scratchpad, not in the repo or a worktree.
>
> Versions are the **installed** ones in the worktree: Next **16.4.5** (which vendors React
> `19.3.0-canary-278794d7-20261002`), React **19.3.0**, ESLint **10.15.0**, `eslint-config-next`
> **16.4.6**, `@next/eslint-plugin-next` **16.4.6**, `eslint-plugin-react-hooks` **7.1.1**,
> `eslint-plugin-react` **7.37.5**. Upstream source links are pinned to a tag or a commit SHA.
> The worktree's `node_modules` differs from `main`'s, which still has Next 16.3.8 and ESLint 10.12.0.

## The question

The owner thinks owning `apps/web/eslint-rules/use-client-exports.mjs` is a weird pattern. Four
sub-questions:

1. Is a hand-written, in-repo ESLint rule (a local plugin in flat config) common and endorsed?
2. Does an off-the-shelf rule already do this?
3. What do Next and React do on their own when a Server Component imports a non-component value from a
   `'use client'` module?
4. Which is the better fit: (a) keep the custom rule, (b) swap in an off-the-shelf rule, or (c) drop
   lint and rely on Next/React?

## Answer

**An in-repo rule is normal, documented practice, not a weird one.** ESLint's docs have a
"Configure a Virtual Plugin" section for exactly this. Next.js, React, ESLint and typescript-eslint
all keep their own local rules in their repos. **No off-the-shelf rule does this job.** The closest,
`eslint-plugin-react-refresh`'s `only-export-components`, has a different purpose (Fast Refresh). It
cannot be scoped to `'use client'` files, never looks at `.ts` files, and stays silent on a file that
exports no component. On `main` before the fix it caught 6 of the 17 offending files, and on the rest
of `src` it flags 36 files that are not client files. **Next and React give no build-time or dev-time
warning:** calling an imported client function throws at render, but reading a client-module constant
or object member gives a silently wrong value. That silent case is live on `main` today, in the
`/ploegen/[slug]/wedstrijden` loading skeleton. **Keep the custom rule (option a).**

## 1. Is an in-repo custom rule a common, endorsed practice?

### What ESLint's own docs say

- **Local and virtual plugins are a documented flat-config feature.**
  [Configure Plugins → Configure a Local Plugin](https://eslint.org/docs/latest/use/configure/plugins#configure-a-local-plugin):
  _"Plugins don't need to be published to npm for use with ESLint."_ The next section,
  [Configure a Virtual Plugin](https://eslint.org/docs/latest/use/configure/plugins#configure-a-virtual-plugin),
  says: _"Plugin definitions can be created virtually directly in your config."_ Its example imports a
  rule from `./rules/my-rule.js` and registers it as `local/my-rule`. That is exactly the shape of
  `kcvvPlugin` in `apps/web/eslint.config.mjs:237-246`.
- **ESLint presents project-specific rules as the use case.**
  [Custom Rules → Runtime Rules](https://eslint.org/docs/latest/extend/custom-rules): _"You can include
  custom rules directly in your configuration file. … This is perfect for rules that are specific to
  your project or company"_. The same page opens with: _"You might want to create a custom rule if the
  core rules do not cover your use case."_
- The docs ship a test harness for such rules (`RuleTester`, same page). The repo tests its rule
  through the `ESLint` Node API instead (`apps/web/test/lint/eslint-rule-harness.ts`), which is also
  how it tests its `no-restricted-syntax` aliases.

### Big projects that keep local rules

| Project               | Where the local rules live                                                                                                                                                                                                                                        | How they are wired                                                                                                                                                                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js**           | [`packages/eslint-plugin-internal/src/`](https://github.com/vercel/next.js/tree/v16.4.5/packages/eslint-plugin-internal/src): `no-ambiguous-jsx`, `typechecked-require` (private package `@next/eslint-plugin-internal`)                                          | [`eslint.config.mjs:11, 431-454`](https://github.com/vercel/next.js/blob/v16.4.5/eslint.config.mjs#L431-L454): `plugins: { '@next/internal': … }`, scoped with `files` to `packages/next/src/server/**`                                                     |
| **React**             | [`scripts/eslint-rules/`](https://github.com/facebook/react/tree/64e28797cdb008a2a20945f774063067d199db99/scripts/eslint-rules): `no-production-logging`, `prod-error-codes`, `safe-string-coercion`, `warning-args`, `no-primitive-constructors`                 | [`.eslintrc.js:301-317`](https://github.com/facebook/react/blob/64e28797cdb008a2a20945f774063067d199db99/.eslintrc.js#L301-L317). Its README: _"This is a dummy npm package that allows us to treat it as an `eslint-plugin`. It's not actually published"_ |
| **ESLint itself**     | [`tools/internal-rules/`](https://github.com/eslint/eslint/tree/v10.15.0/tools/internal-rules): `multiline-comment-style`, `no-debug-template-literals`, `no-invalid-meta`                                                                                        | [`eslint.config.js:13, 104-150`](https://github.com/eslint/eslint/blob/v10.15.0/eslint.config.js#L104-L150): `plugins: { "internal-rules": internalPlugin }`                                                                                                |
| **typescript-eslint** | [`packages/eslint-plugin-internal/src/rules/`](https://github.com/typescript-eslint/typescript-eslint/tree/5987e7c9768739cda34069ccd381be1d4e173119/packages/eslint-plugin-internal/src/rules): nine rules, e.g. `no-typescript-estree-import`, `debug-namespace` | a workspace package used by its own config                                                                                                                                                                                                                  |

Next.js's own React-boundary rule, `@next/internal/no-ambiguous-jsx`, is a hand-written local rule.

### Documented costs

- **ESLint majors can break a rule.** The
  [v10 migration guide](https://eslint.org/docs/latest/use/migrate-to-10.0.0), under "Breaking changes
  for plugin developers", removed `context.getFilename()`, `getSourceCode()`, `getCwd()`,
  `parserOptions` and four `SourceCode` methods. It also made `Program`'s range span the whole file.
  `use-client-exports.mjs` uses none of these. It reads only `program.body`, `node.directive`,
  `exportKind` and identifier names, and reports on export nodes, not on `Program`.
- **Third-party plugins break too, and then you wait for a fix.** The repo already carries a workaround
  for one: `apps/web/eslint.config.mjs:257-261` pins `settings.react.version` because
  `eslint-plugin-react`'s version detection _"calls the `context.getFilename()` API that ESLint 10
  removed"_. A dependency is not free of upgrade cost.
- **Ownership cost is about 185 lines:** the 110-line rule plus a 75-line test
  (`apps/web/test/lint/use-client-exports-rule.test.ts`). It lives next to four aliased rules that
  already sit on the same `kcvvPlugin`.

## 2. Does an off-the-shelf rule already do this?

| Candidate (installed or latest)                                                                                                     | Rule(s) that touch `'use client'` | Covers this rule? | Gap                                                                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@next/eslint-plugin-next` 16.4.6 (via `eslint-config-next`)                                                                        | `no-async-client-component` only  | **No**            | 22 rules in `dist/rules/` (list below). The only one that reads `'use client'` checks that the default export is not `async`.                                        |
| `eslint-plugin-react-hooks` 7.1.1 (React Compiler rules included)                                                                   | none                              | **No**            | The 31 rule names in the plugin's `rules` object cover hooks, purity, refs, memo and the compiler. The string `use client` does not occur in its 55 466-line bundle. |
| `eslint-plugin-react` 7.37.5                                                                                                        | none                              | **No**            | No file under `lib/` mentions `use client`.                                                                                                                          |
| `eslint-plugin-react-rsc` 5.30.2 (installed, through `@sanity/eslint-config-studio` → `@eslint-react/eslint-plugin`); latest 5.30.6 | `function-definition`             | **No**            | Its only rule: `'use server'` functions must be `async`, and a directive must be well placed and quoted. Exports of `'use client'` files are not checked.            |
| `eslint-plugin-use-client` 1.2.0 (2026-07-06, ~2.2 k downloads/week)                                                                | `require-use-client`              | **No**            | Checks whether a file _needs_ the directive (hooks, `createContext`, browser APIs). It does not check what the file exports.                                         |
| `eslint-plugin-react-server-components` 1.2.0 (last release 2024-05-26, ~33 k/week)                                                 | `use-client`                      | **No**            | Same "missing directive" check. Self-described as an _"Experiment"_. eslintrc-style config only.                                                                     |
| `eslint-plugin-rsc` 0.1.4 (2023-06-20, 10/week)                                                                                     | `no-async-client-component`       | **No**            | Abandoned.                                                                                                                                                           |
| **`eslint-plugin-react-refresh` 0.5.8** (2026-11-15, ~32 M/week)                                                                    | `only-export-components`          | **Partly**        | See below.                                                                                                                                                           |

`@next/eslint-plugin-next` 16.4.6 rules, read from `dist/rules/*.js` and `dist/index.js:79-94`:
`google-font-display`, `google-font-preconnect`, `inline-script-id`, `next-script-for-ga`,
`no-assign-module-variable`, `no-async-client-component`, `no-before-interactive-script-outside-document`,
`no-css-tags`, `no-document-import-in-page`, `no-duplicate-head`, `no-head-element`,
`no-head-import-in-document`, `no-html-link-for-pages`, `no-img-element`,
`no-location-assign-relative-destination`, `no-page-custom-font`, `no-script-component-in-head`,
`no-styled-jsx-in-document`, `no-sync-scripts`, `no-title-in-document-head`, `no-typos`,
`no-unwanted-polyfillio`.

### `react-refresh/only-export-components`, read from the 0.5.8 tarball (`index.js`)

The goal is different. Its messages say _"Fast refresh only works when a file only exports
components"_ (`index.js:7`). The overlap with this rule is real, but it comes from the shared naming
heuristic (PascalCase = component), not from any RSC awareness. Where it falls short of this rule:

- **It cannot be scoped to `'use client'` files.** No code path reads a directive. The only file
  filter is the name: `.test.`, `.spec.`, `.cy.` and `.stories.` are skipped (`index.js:38-40`). Scoping
  is possible only through the config's `files` globs.
- **It never checks `.ts` files.** `shouldScan` is `.jsx` or `.tsx`, or `.js` with `checkJS`
  (`index.js:41-42`). No option turns on `.ts`.
- **It reports only when the file also exports a component.** Non-component exports are reported only
  inside `if (hasReactExport)` (`index.js:277-289`). A hook-only or constants-only `'use client'` file
  passes.
- **Matches:** it flags `createContext` exports (`index.js:164-166`, message `reactContext`), flags
  `export *` (`:220-223`) and skips `export type` (`:221, :240`). Turn `allowConstantExport` off (the
  default) or literal constants pass (`:161, :305-314`). `allowExportNames` is an allow-list
  (`:151`); the `next` preset fills it with route-segment names (`:340-371`).

**Measured on this repo** with a scratch config, no repo edits (see
[§6 Commands](#6-commands-that-produced-the-numbers)):

| Run                                                                | `kcvv/use-client-exports` | `react-refresh/only-export-components`                                                                                                                                                                                                     |
| ------------------------------------------------------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 115 `'use client'` files on `main` (`c527dbc62`, before the fix)   | **17 files**              | **6 files**. It misses all 11 offending `.ts` files: `categoryMeta.ts` (`CATEGORY_META`, `CATEGORY_ORDER`, `ACCENT_GLYPH_CLASS`, `groupPathsByCategory`), `useSemanticAugment.ts`, `useScrollHint.ts` and eight hook files in `src/hooks/` |
| 104 `'use client'` files on the branch (after the fix)             | 0                         | 0                                                                                                                                                                                                                                          |
| all 379 non-test, non-story `.tsx` files under `src` on the branch | 0                         | **36 files / 57 reports with the `next` preset** (68 / 148 without it), **all in files without `'use client'`**, e.g. `src/components/gallery/lightbox-chrome.tsx`, `src/app/server-error-state.tsx`                                       |

So the closest off-the-shelf rule either covers about a third of the real cases (scoped by hand to
client files) or, enabled across `src/**/*.tsx`, adds 36 files of findings about server modules. Exports
from a server module are fine for RSC: a module without the directive is not a boundary.

## 3. What Next.js and React do on their own

### What the docs say may cross the boundary

- [react.dev → `'use client'` → Caveats](https://react.dev/reference/rsc/use-client#caveats): _"When a
  server evaluated module imports values from a `'use client'` module, the values must either be a React
  component or supported serializable prop values to be passed to a Client Component. Any other use
  case will throw an exception."_ The experiment below shows that last sentence is **not true for reads**.
  A member access or arithmetic gives `undefined` or `NaN` without an exception.
- [Next.js → Server and Client Boundary → Compound components across the boundary](https://nextjs.org/docs/app/guides/server-and-client-boundary)
  (lastUpdated 2026-10-05): _"A Server Component that imports a Client Component receives a client
  reference instead of the function. As a result, `Menu.Item` is `undefined`"_.
- [Next.js → `use client`](https://nextjs.org/docs/app/api-reference/directives/use-client) (2026-10-05):
  props of Client Components _"must be serializable"_. Nothing on non-component exports.
- [Next.js → Server and Client Components → Context providers](https://nextjs.org/docs/app/getting-started/server-and-client-components#context-providers)
  shows `export const ThemeContext = createContext({})` in a `'use client'` file. **The KCVV rule bans
  that pattern** (see §4).

### The code that creates client references

Both bundlers replace every named export of a `'use client'` ESM module, seen from the server graph,
with a **plain function** tagged as a client reference. Calling it throws. Reading a property from it
gives `undefined`.

- **webpack:** [`next-flight-loader/index.ts:126-145`](https://github.com/vercel/next.js/blob/v16.4.5/packages/next/src/build/webpack/loaders/next-flight-loader/index.ts#L126-L145)
  emits `export const ${ref} = registerClientReference(function() { throw new Error("Attempted to call
${ref}() from the server but ${ref} is on the client. …") }, …)`. The one compile-time error on this
  path is `export *` in a client boundary (`:117`). CJS modules go through `createProxy` instead
  (`:178-180`).
- **Turbopack:** [`ecmascript_client_reference_module.rs:81-135`](https://github.com/vercel/next.js/blob/v16.4.5/crates/next-core/src/next_client_reference/ecmascript_client_reference/ecmascript_client_reference_module.rs#L81-L135)
  generates the same code. Unexpected dynamic exports hit a no-op: `// TODO: throw? warn?` (`:85-87`).
- **React:** [`ReactFlightWebpackReferences.js:37-60`](https://github.com/facebook/react/blob/278794d7dee9cd2a3a2aaf9f0b2a4b8b747d74ee/packages/react-server-dom-webpack/src/ReactFlightWebpackReferences.js#L37-L60):
  `registerClientReference` only `Object.defineProperties` adds `$$typeof`/`$$id`/`$$async` to that
  function. There is no `Proxy`. The throwing `Proxy` (_"Cannot access X.y on the server. You cannot
  dot into a client module from a server component"_, `:180-202`) belongs to `createClientModuleProxy`
  (`:349`), which serves CommonJS modules only. The same code ships vendored in
  `next/dist/compiled/react-server-dom-webpack/cjs/react-server-dom-webpack-server.node.development.js:123-128, 7148-7156`.
- **Next's compile-time checks on `'use client'` exports are narrow.**
  [`react_server_components.rs:905-921, 1037-1046`](https://github.com/vercel/next.js/blob/v16.4.5/crates/next-custom-transforms/src/transforms/react_server_components.rs#L1037-L1046)
  checks only **app entry files** (`page`, `layout`, `route`, metadata files), and only for
  `metadata`/`generateMetadata` (_"You are attempting to export "metadata" from a component marked with
  "use client", which is disallowed."_, `:359`). The TypeScript plugin's
  [`client-boundary.ts:110`](https://github.com/vercel/next.js/blob/v16.4.5/packages/next/src/server/typescript/rules/client-boundary.ts#L110)
  checks that a client entry's **props** are serializable. It is editor-only and ignores exports.

### The experiment

A minimal app with `next@16.4.5`, `react@19.3.0` and `react-dom@19.3.0` from npm, in
`…/scratchpad/research-rsc/`. One client module, plus one Server Component page per case:

```tsx
// app/client-values.tsx
"use client";
import { createContext, use } from "react";
export const SIZE = 4;
export const META = { a: "Alpha" };
export const getSize = () => 4;
export const ThingContext = createContext("default");
export const Show = ({ value }: { value: unknown }) => (
  <p id="show">client got: {JSON.stringify(value)}</p>
);
export const ReadCtx = () => (
  <span id="ctxval">ctx value: {use(ThingContext)}</span>
);
```

`next build` (Turbopack) and `next build --webpack` both print `✓ Compiled successfully`, and
TypeScript passes. TypeScript sees the real types, not the client reference. Then `next start` and
`curl`. Turbopack and webpack gave identical results:

| Server page does                                               | HTTP         | Result                                                                                                                                          |
| -------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `<p>{SIZE}</p>` (renders the constant)                         | 200          | `rendered: 4`, correct: the reference resolves on the client                                                                                    |
| `<Show value={{ META, SIZE }} />` (passes as props)            | 200          | `{"META":{"a":"Alpha"},"SIZE":4}`, correct                                                                                                      |
| `String(META.a)`, `typeof SIZE`, `SIZE * 2`                    | **200**      | **`META.a = [undefined] typeof SIZE = [function] SIZE*2 = [NaN]`. Silent: no log line, no warning, in `next start` and in `next dev` alike**    |
| `getSize()`                                                    | 500          | `⨯ Error: Attempted to call getSize() from the server but getSize is on the client. …`                                                          |
| `useThing()` from a `'use client'` `.ts` hook file             | 500          | `⨯ Error: Attempted to call useThing() from the server but useThing is on the client. …`                                                        |
| `<ThingContext value="from server"><ReadCtx /></ThingContext>` | 200          | `ctx value: from server`, **works**                                                                                                             |
| `getSize()` on a **static** (prerendered) page                 | build fails  | `Error occurred prerendering page "/callstatic"` … `Attempted to call getSize() from the server …` `⨯ Next.js build worker exited with code: 1` |
| `String(META.a)` on a **static** page                          | build passes | prerendered HTML holds `META.a = [undefined]`                                                                                                   |

So: **calls** fail loudly, at build time on a static route or at request time on a dynamic one.
**Reads** (member access, arithmetic, `typeof`, string building) fail silently everywhere. Rendering or
passing the value whole works.

### The silent case is live on `main`

`apps/web/src/components/design-system/UpLink/UpLink.tsx:56` (`'use client'`) exports
`UP_LINK_TOP_AIR`. `apps/web/src/components/layout/PageHero/PageHeroSkeleton.tsx:142` has no directive
and reads `UP_LINK_TOP_AIR[tone]`. It is rendered with `upLinkShimmer` by
`src/app/(main)/ploegen/[slug]/wedstrijden/loading.tsx:42`, also without a directive. Per the `/dot`
row above, that lookup is `undefined` on the server, so the skeleton's `ink` tone drops
`mt-12 lg:mt-16`. The branch moves the map to the plain module
`src/components/design-system/UpLink/up-link-air.ts`. Both rules flag `UpLink.tsx:56` (table in §2).
**Not checked visually.** The missing class follows from the experiment and has not been seen on the page.

## 4. Recommendation: (a) keep the custom rule

| Option                                 | What it catches                                                                                                                                                        | What slips through                                                                                                                                                              | Cost                                                                                         |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **(a) keep `kcvv/use-client-exports`** | Every non-PascalCase value export, every `createContext` export, enums, `export *`, in `.ts` and `.tsx`, `'use client'` files only. 17 / 17 offending files on `main`. | PascalCase non-components (an object or a `memo(...)` of a non-component), and anything behind a default export. The rule's own header says so (`use-client-exports.mjs:8-12`). | 185 lines it owns. Uses no API that the ESLint 10 migration removed.                         |
| (b) `eslint-plugin-react-refresh`      | 6 / 17 on `main` (scoped by hand)                                                                                                                                      | All `.ts` files, every file with no component export, and no way to scope to the directive                                                                                      | A new devDependency, plus either a hand-kept `files` list or 36 files of off-target findings |
| (c) no lint, rely on Next/React        | Calls only: a build failure on static routes, a 500 on dynamic routes                                                                                                  | **All reads**: silent `undefined` or `NaN`, in dev and prod (the `UP_LINK_TOP_AIR` case)                                                                                        | Zero code. The bug class it misses is the one that already happened.                         |

If someone still wants (b), this is the closest config. It uses the plugin's exported `reactRefresh`
API (`index.js:374`) and needs a new devDependency:

```js
// apps/web/eslint.config.mjs (sketch, not applied)
import { reactRefresh } from "eslint-plugin-react-refresh";

export default [
  // …
  {
    ...reactRefresh.configs.next(), // only-export-components: "error", Next route-segment names allowed
    files: ["src/**/*.tsx"], // cannot express "files with 'use client'"; .ts files are never scanned
    ignores: ["**/*.test.tsx", "**/*.spec.tsx", "**/*.stories.tsx"],
  },
];
```

**Why (a):**

1. The pattern is the one ESLint documents and that Next, React and ESLint use on themselves. The repo
   already has the `kcvvPlugin` virtual plugin. This rule adds a real rule object next to the four
   aliases.
2. No published rule checks "what may a `'use client'` file export". The near-match has another
   purpose and misses two thirds of this repo's cases.
3. The platform is silent for exactly the case that matters (§3), and that case reached `main`.

**Two things the owner may want to decide while keeping it.** These are judgment calls, not bugs:

- **The context ban is stricter than the platform.** Next's docs export a context from a `'use client'`
  file, and the experiment shows a Server Component can render `<ThingContext value>` correctly.
  React's proxy even special-cases `.Provider` (`ReactFlightWebpackReferences.js:184-188`). The ban
  matches `react-refresh`'s Fast Refresh rule, not an RSC failure. Keep it as house style, or drop the
  `createContext` branch.
- **Hooks and helpers in a `'use client'` file are a hazard only if a server module imports them, and
  then they fail loudly** (the `getSize`/`useThing` rows). The silent class is non-function values. The
  rule flags all of them anyway. That over-approximation is cheap, and the branch's fix for hook files
  (dropping the directive) matches react.dev: _"When a `'use client'` module is imported from another
  client-rendered module, the directive has no effect."_ The directive belongs only on boundary entry
  files.

## 5. What I could not verify

1. **The `UP_LINK_TOP_AIR` regression on the live site.** It is inferred from the experiment plus the
   import chain, and has not been seen in a browser.
2. **Whether any other value export on `main` is read by a server module today.** A grep over importers
   found only the `UpLink` case outside barrel `index.ts` files and client files. That grep matched
   names by text; it was not a module-graph analysis. Barrels re-export, so a server importer behind a
   barrel could be missed.
3. **The exact ESLint docs version.** The `latest` pages carry a switcher (HEAD, v10.15.0, …) but no
   stamp. The migration guide is the v10.0.0 one.
4. **Downloads** are npm's last-week counts (2026-11-16 → 2026-11-22). They show reach, not quality.
5. **The React docs claim** _"Any other use case will throw an exception"_ is contradicted by the
   experiment for reads. I did not look for an upstream issue about that wording.

## 6. Commands that produced the numbers

```bash
# installed versions (worktree)
ls node_modules/.pnpm | grep -E "^(next@|eslint@|eslint-config-next|@next\+eslint|eslint-plugin-react|@eslint-react)"

# off-the-shelf candidates: tarballs unpacked under scratchpad/pkgs/, then read
npm pack eslint-plugin-react-refresh eslint-plugin-use-client eslint-plugin-react-server-components eslint-plugin-rsc
curl -s "https://api.npmjs.org/downloads/point/last-week/<pkg>"

# experiment (scratchpad/research-rsc)
npm install --ignore-scripts   # next@16.4.5 react@19.3.0 react-dom@19.3.0
npx next build && ./probe.sh turbo
npx next build --webpack && ./probe.sh webpack
npx next dev -p 3918           # then curl /dot /render /prop /ctx

# rule comparison (scratchpad/lintcmp/compare*.mjs): ESLint API from the worktree,
# overrideConfigFile: true, typescript-eslint parser, both rules on the same file list
node compare-main.mjs <worktree> <scratch> use-client-files-main.txt <main>/apps/web
node compare-next.mjs <worktree> <scratch> all-tsx.txt <worktree>/apps/web
```

---

## Sources

ESLint docs (`/docs/latest/`, switcher at v10.15.0):

- [Configure Plugins: Configure a Local Plugin / Configure a Virtual Plugin](https://eslint.org/docs/latest/use/configure/plugins#configure-a-virtual-plugin)
- [Custom Rules: Runtime Rules, RuleTester](https://eslint.org/docs/latest/extend/custom-rules)
- [Migrate to v10.x: Breaking changes for plugin developers](https://eslint.org/docs/latest/use/migrate-to-10.0.0)

React and Next docs:

- [react.dev: `'use client'`, Caveats and Serializable types](https://react.dev/reference/rsc/use-client)
- [Next.js: `use client`](https://nextjs.org/docs/app/api-reference/directives/use-client) _(2026-10-05)_
- [Next.js: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components) _(2026-10-05)_
- [Next.js: The Server and Client Boundary](https://nextjs.org/docs/app/guides/server-and-client-boundary) _(2026-10-05)_

Source code:

- vercel/next.js `v16.4.5` (`4e5335a00314be7fbb2aace5e9be56a88e64e5a8`):
  [`next-flight-loader/index.ts`](https://github.com/vercel/next.js/blob/v16.4.5/packages/next/src/build/webpack/loaders/next-flight-loader/index.ts) ·
  [`ecmascript_client_reference_module.rs`](https://github.com/vercel/next.js/blob/v16.4.5/crates/next-core/src/next_client_reference/ecmascript_client_reference/ecmascript_client_reference_module.rs) ·
  [`react_server_components.rs`](https://github.com/vercel/next.js/blob/v16.4.5/crates/next-custom-transforms/src/transforms/react_server_components.rs) ·
  [`client-boundary.ts`](https://github.com/vercel/next.js/blob/v16.4.5/packages/next/src/server/typescript/rules/client-boundary.ts) ·
  [`eslint.config.mjs`](https://github.com/vercel/next.js/blob/v16.4.5/eslint.config.mjs) ·
  [`packages/eslint-plugin-internal`](https://github.com/vercel/next.js/tree/v16.4.5/packages/eslint-plugin-internal)
- facebook/react `278794d7dee9cd2a3a2aaf9f0b2a4b8b747d74ee` (the canary Next 16.4.5 vendors):
  [`ReactFlightWebpackReferences.js`](https://github.com/facebook/react/blob/278794d7dee9cd2a3a2aaf9f0b2a4b8b747d74ee/packages/react-server-dom-webpack/src/ReactFlightWebpackReferences.js)
- facebook/react `64e28797cdb008a2a20945f774063067d199db99`:
  [`scripts/eslint-rules/`](https://github.com/facebook/react/tree/64e28797cdb008a2a20945f774063067d199db99/scripts/eslint-rules) ·
  [`.eslintrc.js`](https://github.com/facebook/react/blob/64e28797cdb008a2a20945f774063067d199db99/.eslintrc.js)
- eslint/eslint `v10.15.0`: [`tools/internal-rules`](https://github.com/eslint/eslint/tree/v10.15.0/tools/internal-rules) ·
  [`eslint.config.js`](https://github.com/eslint/eslint/blob/v10.15.0/eslint.config.js)
- typescript-eslint `5987e7c9768739cda34069ccd381be1d4e173119`:
  [`packages/eslint-plugin-internal/src/rules`](https://github.com/typescript-eslint/typescript-eslint/tree/5987e7c9768739cda34069ccd381be1d4e173119/packages/eslint-plugin-internal/src/rules)

npm packages (tarballs read, versions as listed):

- [`eslint-plugin-react-refresh` 0.5.8](https://github.com/ArnaudBarre/eslint-plugin-react-refresh) ·
  [`eslint-plugin-react-rsc` 5.30.2/5.30.6](https://github.com/Rel1cx/eslint-react/tree/main/plugins/eslint-plugin-react-rsc) ·
  [`eslint-plugin-use-client` 1.2.0](https://github.com/czarandy/eslint-plugin-use-client) ·
  [`eslint-plugin-react-server-components` 1.2.0](https://github.com/roginfarrer/eslint-plugin-react-client-components) ·
  `eslint-plugin-rsc` 0.1.4
- Installed in the worktree (`/Users/kevinvanransbeeck/Sites/KCVV/kcvv-issue-3839/node_modules/.pnpm/`):
  `@next+eslint-plugin-next@16.4.6…/dist/`, `eslint-plugin-react-hooks@7.1.1…/cjs/`,
  `eslint-plugin-react@7.37.5…/lib/rules/`, `eslint-plugin-react-rsc@5.30.2…/dist/index.js`,
  `next@16.4.5…/dist/build/webpack/loaders/next-flight-loader/index.js`,
  `next@16.4.5…/dist/compiled/react-server-dom-webpack/`

Repo (worktree `9c7c366ba`, `main` `c527dbc62`):

- `apps/web/eslint-rules/use-client-exports.mjs`, `apps/web/test/lint/use-client-exports-rule.test.ts`,
  `apps/web/test/lint/eslint-rule-harness.ts`, `apps/web/eslint.config.mjs:237-246, 257-261, 466-472`
- `main`: `apps/web/src/components/design-system/UpLink/UpLink.tsx:56`,
  `apps/web/src/components/layout/PageHero/PageHeroSkeleton.tsx:142`,
  `apps/web/src/app/(main)/ploegen/[slug]/wedstrijden/loading.tsx:42`

## Decision

Decided 2026-11-23 on [#3839](https://github.com/soniCaH/www.kcvvelewijt.be/issues/3839) / PR #3846:

- **Kept the custom rule (option a).**
- **Dropped the context ban.** An exported `createContext(...)` (also `React.createContext(...)`,
  also through `export { Ctx }`) passes whatever its name. Next's own docs export a context from a
  `'use client'` file, and the experiment above (Next 16.4.5) rendered `<ThingContext value>` from a Server
  Component correctly. A plain module that calls `createContext` breaks the moment a server file imports
  it. The rule's real target is the silent bug: a non-function value (constant, object) read on the
  server gives `undefined` or `NaN` with no error. So `ShareBadgeContext` and `ShareBlocksContext` stay
  in `ShareFrame.tsx`.
- Everything else in the rule is unchanged: the PascalCase component heuristic, and flagging hooks,
  helpers, constants, enums and `export *`.
