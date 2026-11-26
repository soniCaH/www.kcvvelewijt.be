import { describe, it, expect } from "vitest";
import { readEmptyStateUndoAttrs } from "./empty-state-undo-attrs";

const el = (attrs: Record<string, string>): HTMLElement => {
  const node = document.createElement("button");
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
};

describe("readEmptyStateUndoAttrs", () => {
  it("reads the source and facet", () => {
    expect(
      readEmptyStateUndoAttrs(
        el({
          "data-empty-state-undo-source": "evenementen",
          "data-empty-state-undo-facet": "Jeugdwerking",
        }),
      ),
    ).toEqual({ source: "evenementen", facet: "Jeugdwerking" });
  });

  it("returns null when there is no source", () => {
    expect(
      readEmptyStateUndoAttrs(
        el({ "data-empty-state-undo-facet": "Jeugdwerking" }),
      ),
    ).toBeNull();
  });

  it("returns null when there is no facet", () => {
    expect(
      readEmptyStateUndoAttrs(
        el({ "data-empty-state-undo-source": "evenementen" }),
      ),
    ).toBeNull();
  });

  it("returns null on an element with neither attribute", () => {
    expect(readEmptyStateUndoAttrs(el({}))).toBeNull();
  });
});
