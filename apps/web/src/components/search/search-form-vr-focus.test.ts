/**
 * search-form-vr-focus Tests
 *
 * Focus: `forceSearchFocusRing` sets `data-vr-force-ring="true"` on the
 * `[data-search-form]` hook nested inside the given root (the attribute
 * SearchForm.tsx's `data-[vr-force-ring=true]:ring-warm` variant reacts to),
 * and is a no-op when no such hook exists rather than throwing.
 */

import { describe, it, expect } from "vitest";
import { forceSearchFocusRing } from "./search-form-vr-focus";

describe("forceSearchFocusRing", () => {
  it("sets data-vr-force-ring=true on the [data-search-form] hook nested inside the root", () => {
    const root = document.createElement("div");
    root.innerHTML = `<form data-search-form><input type="text" /></form>`;

    forceSearchFocusRing(root);

    expect(root.querySelector("form")?.getAttribute("data-vr-force-ring")).toBe(
      "true",
    );
  });

  it("does not throw when the root has no [data-search-form] hook", () => {
    const root = document.createElement("div");

    expect(() => forceSearchFocusRing(root)).not.toThrow();
  });
});
