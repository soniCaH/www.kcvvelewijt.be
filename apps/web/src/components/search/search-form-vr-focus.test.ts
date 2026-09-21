/**
 * search-form-vr-focus Tests
 *
 * Focus: `focusSearchInput` actually moves DOM focus onto the nested
 * `<input>` (the property `:focus-within` matches against), and is a no-op
 * when no input exists rather than throwing.
 */

import { describe, it, expect } from "vitest";
import { focusSearchInput } from "./search-form-vr-focus";

describe("focusSearchInput", () => {
  it("focuses the input nested inside the given root", () => {
    const root = document.createElement("div");
    root.innerHTML = `<form><input type="text" /></form>`;
    document.body.append(root);

    focusSearchInput(root);

    expect(document.activeElement).toBe(root.querySelector("input"));

    root.remove();
  });

  it("does not throw when the root has no input", () => {
    const root = document.createElement("div");

    expect(() => focusSearchInput(root)).not.toThrow();
  });
});
