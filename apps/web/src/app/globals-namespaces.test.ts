import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Pins the `@theme` font-namespace reset (#3365, same family as #2520).
 * Without `--font-*: initial;`, Tailwind's built-in serif and sans utilities
 * keep generating their stock stacks, so a component that reaches for them
 * renders Georgia / system-ui instead of Freight. The reset must sit BEFORE
 * every `--font-*` declaration: a reset placed after them deletes the Freight
 * faces, because `initial` clears every earlier `--font-*` too.
 */
const css = readFileSync(join(__dirname, "globals.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);
const theme = css.slice(css.indexOf("@theme {"));

describe("globals.css — the stock-theme namespace resets", () => {
  it("resets --font-* before every other --font-* declaration", () => {
    const reset = theme.indexOf("--font-*: initial;");
    expect(reset).toBeGreaterThan(-1);
    const firstDeclaration = theme.search(/--font-(?!\*)[a-z-]+\s*:/);
    expect(firstDeclaration).toBeGreaterThan(reset);
  });

  it.each(["radius", "shadow"])(
    "resets --%s-* before the first token the file declares in it",
    (ns) => {
      const reset = theme.indexOf(`--${ns}-*: initial;`);
      expect(reset).toBeGreaterThan(-1);
      const first = theme.search(new RegExp(`--${ns}-(?!\\*)[a-z-]+\\s*:`));
      expect(first === -1 || first > reset).toBe(true);
    },
  );
});
