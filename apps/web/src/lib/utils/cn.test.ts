import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { cn, CUSTOM_SIZE_TOKENS } from "./cn";

/**
 * The stock Tailwind scale, declared verbatim in the `@theme` block (see
 * `globals.css`'s own comment on why) — `tailwind-merge`'s factory config
 * already files these correctly, so they are not part of `CUSTOM_SIZE_TOKENS`
 * even though they live in the same block as the 12 custom steps.
 */
const STOCK_TEXT_TOKENS = new Set([
  "xs",
  "sm",
  "base",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
]);

/**
 * Derives the custom `--text-*` step names straight from the `@theme` block,
 * the same way `CUSTOM_SIZE_TOKENS`'s own doc comment in `cn.ts` claims to.
 * A modifier declaration (`--text-display-xl--line-height`,
 * `--text-label--letter-spacing`) always contains a literal `--` between the
 * step name and the modifier — filtering those out is what keeps this to
 * exactly the 12 base steps.
 */
function deriveCustomSizeTokensFromGlobalsCss(): string[] {
  const css = readFileSync(join(__dirname, "../../app/globals.css"), "utf8");
  const themeStart = css.indexOf("@theme {");
  const themeEnd = css.indexOf("\n}", themeStart);
  const themeBlock = css.slice(themeStart, themeEnd);
  const names = new Set<string>();
  for (const match of themeBlock.matchAll(/--text-([\w-]+?)\s*:/g)) {
    const name = match[1];
    if (!name.includes("--")) names.add(name);
  }
  return [...names].filter((name) => !STOCK_TEXT_TOKENS.has(name)).sort();
}

describe("CUSTOM_SIZE_TOKENS — derived from globals.css, not hand-copied", () => {
  it("matches every custom --text-* step in the @theme block", () => {
    // This is the drift guard the comment above CUSTOM_SIZE_TOKENS promises:
    // add a 13th --text-* step to globals.css without touching this array,
    // and this assertion — not the it.each below, which only ever walks the
    // array it's supposed to be checking — is what fails.
    expect([...CUSTOM_SIZE_TOKENS].sort()).toEqual(
      deriveCustomSizeTokensFromGlobalsCss(),
    );
  });
});

describe("cn — custom font-size tokens", () => {
  it.each(CUSTOM_SIZE_TOKENS)("keeps text-%s beside a text colour", (token) => {
    expect(cn(`text-${token}`, "text-ink")).toBe(`text-${token} text-ink`);
  });

  it("still collapses two genuine sizes to the last one", () => {
    expect(cn("text-body-sm", "text-body-lg")).toBe("text-body-lg");
    expect(cn("text-label", "text-2xl")).toBe("text-2xl");
    expect(cn("text-2xl", "text-label")).toBe("text-label");
  });

  it("still collapses two colours to the last one", () => {
    expect(cn("text-ink", "text-cream")).toBe("text-cream");
  });
});

describe("cn — size-* drops both h-* and w-*", () => {
  it("collapses an explicit h-*/w-* pair to a later size-*", () => {
    // A caller may use `size-[Npx]` in place of `h-[Npx] w-[Npx]` — this is
    // the drift guard: if tailwind-merge ever stops treating `size-*` as
    // conflicting with both axes, this fails instead of silently leaving a
    // stale `h-60 w-60` beside it.
    expect(cn("relative h-60 w-60", "size-[140px]")).toBe(
      "relative size-[140px]",
    );
  });
});
