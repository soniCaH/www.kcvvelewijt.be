/**
 * spotlight-tree unit tests.
 *
 * Mirrors the real reporting-tree shape (live audit, #2054):
 *   club (virtual root)
 *   ├─ voorzitter ──┬─ jeugdvoorzitter ─ (7 kids)
 *   │               ├─ secretaris (leaf)
 *   │               └─ sportief ─ tvjo ─ (wide: 12 kids incl. api → ethische-commissie)
 *   └─ gc (leaf, separate top node)
 */

import { describe, it, expect } from "vitest";
import type { OrgChartNode } from "@/types/organigram";
import {
  buildSpotlightTree,
  getSpotlightView,
  primaryFocusId,
  trailTo,
  parentTarget,
  firstChildTarget,
  siblingTarget,
  edgeSiblingTarget,
  targetForKey,
  splitFan,
  CLUB_ROOT_ID,
} from "./spotlight-tree";

function node(
  id: string,
  parentId: string | null,
  members = 1,
  title = id,
): OrgChartNode {
  return {
    id,
    title,
    parentId,
    members: Array.from({ length: members }, (_, i) => ({
      id: `${id}-m${i}`,
      name: `${id} holder ${i}`,
    })),
  };
}

const NODES: OrgChartNode[] = [
  { id: "club", title: "KCVV Elewijt", parentId: null, members: [] },
  node("voorzitter", "club"),
  node("gc", "club", 2), // shared, separate top node, leaf
  node("jeugdvoorzitter", "voorzitter"),
  node("secretaris", "voorzitter"),
  node("sportief", "voorzitter"),
  // jeugdvoorzitter children (subset)
  node("jeugdsecr", "jeugdvoorzitter"),
  node("ouderraad", "jeugdvoorzitter", 0), // vacant
  // sportief → tvjo (the wide branch)
  node("tvjo", "sportief"),
  node("api", "tvjo"),
  node("ethische-commissie", "api"),
  node("videoanalist", "tvjo", 0), // vacant
];

const tree = buildSpotlightTree(NODES);

describe("buildSpotlightTree", () => {
  it("roots the two top nodes under the virtual club root, in order", () => {
    expect(tree.childrenOf.get("club")?.map((n) => n.id)).toEqual([
      "voorzitter",
      "gc",
    ]);
    expect(tree.parentOf.get("club")).toBeNull();
  });

  it("wires real parentId edges", () => {
    expect(tree.parentOf.get("tvjo")).toBe("sportief");
    expect(tree.parentOf.get("ethische-commissie")).toBe("api");
    expect(tree.childrenOf.get("voorzitter")?.map((n) => n.id)).toEqual([
      "jeugdvoorzitter",
      "secretaris",
      "sportief",
    ]);
  });

  it("re-parents a node with a missing/unknown parent under the root", () => {
    const orphanTree = buildSpotlightTree([
      { id: "club", title: "KCVV", parentId: null, members: [] },
      node("orphan", "ghost-parent"),
    ]);
    expect(orphanTree.parentOf.get("orphan")).toBe(CLUB_ROOT_ID);
  });

  it("treats a self-referencing parent as a root child", () => {
    const selfTree = buildSpotlightTree([
      { id: "club", title: "KCVV", parentId: null, members: [] },
      node("loop", "loop"),
    ]);
    expect(selfTree.parentOf.get("loop")).toBe(CLUB_ROOT_ID);
  });
});

describe("trailTo (breadcrumb)", () => {
  it("returns the reporting line root → focus inclusive", () => {
    expect(trailTo(tree, "ethische-commissie").map((n) => n.id)).toEqual([
      "club",
      "voorzitter",
      "sportief",
      "tvjo",
      "api",
      "ethische-commissie",
    ]);
  });

  it("is just the root for the root", () => {
    expect(trailTo(tree, "club").map((n) => n.id)).toEqual(["club"]);
  });
});

describe("getSpotlightView", () => {
  it("resolves the neighbourhood of a mid node", () => {
    const view = getSpotlightView(tree, "sportief");
    expect(view.parent?.id).toBe("voorzitter");
    expect(view.siblings.map((n) => n.id)).toEqual([
      "jeugdvoorzitter",
      "secretaris",
      "sportief",
    ]);
    expect(view.focusIndex).toBe(2);
    expect(view.children.map((n) => n.id)).toEqual(["tvjo"]);
    expect(view.depth).toBe(2);
  });

  it("handles the root focus (no parent, self-sibling, depth 0)", () => {
    const view = getSpotlightView(tree, "club");
    expect(view.parent).toBeNull();
    expect(view.siblings.map((n) => n.id)).toEqual(["club"]);
    expect(view.focusIndex).toBe(0);
    expect(view.depth).toBe(0);
    expect(view.children.map((n) => n.id)).toEqual(["voorzitter", "gc"]);
  });

  it("handles a leaf focus (no children)", () => {
    expect(getSpotlightView(tree, "secretaris").children).toEqual([]);
  });

  it("throws on an unknown focus id", () => {
    expect(() => getSpotlightView(tree, "nope")).toThrow(/unknown node/);
  });
});

describe("primaryFocusId", () => {
  it("picks the top node with the most direct reports, not the synthetic root", () => {
    // voorzitter has 3 children here; gc has 0 → opens on voorzitter.
    expect(primaryFocusId(tree)).toBe("voorzitter");
  });

  it("falls back to the root when there are no top-level nodes", () => {
    const lone = buildSpotlightTree([
      { id: "club", title: "KCVV", parentId: null, members: [] },
    ]);
    expect(primaryFocusId(lone)).toBe("club");
  });
});

describe("navigation targets", () => {
  it("↑ parent — null at root, the parent otherwise", () => {
    expect(parentTarget(tree, "club")).toBeNull();
    expect(parentTarget(tree, "tvjo")).toBe("sportief");
  });

  it("↓ first child — null on a leaf, first child otherwise", () => {
    expect(firstChildTarget(tree, "secretaris")).toBeNull();
    expect(firstChildTarget(tree, "voorzitter")).toBe("jeugdvoorzitter");
  });

  it("← / → siblings — stops at the ends (no wrap)", () => {
    // voorzitter's children: [jeugdvoorzitter, secretaris, sportief]
    expect(siblingTarget(tree, "jeugdvoorzitter", -1)).toBeNull(); // first → no prev
    expect(siblingTarget(tree, "jeugdvoorzitter", 1)).toBe("secretaris");
    expect(siblingTarget(tree, "secretaris", 1)).toBe("sportief");
    expect(siblingTarget(tree, "sportief", 1)).toBeNull(); // last → no next
  });

  it("Home / End — jump to first/last sibling", () => {
    expect(edgeSiblingTarget(tree, "sportief", "first")).toBe(
      "jeugdvoorzitter",
    );
    expect(edgeSiblingTarget(tree, "jeugdvoorzitter", "last")).toBe("sportief");
  });

  it("a top node's siblings are the other top nodes", () => {
    expect(siblingTarget(tree, "voorzitter", 1)).toBe("gc");
    expect(siblingTarget(tree, "gc", -1)).toBe("voorzitter");
  });
});

describe("targetForKey", () => {
  it("routes the locked key scheme to the right move", () => {
    expect(targetForKey(tree, "sportief", "ArrowUp")).toBe("voorzitter");
    expect(targetForKey(tree, "sportief", "ArrowDown")).toBe("tvjo");
    expect(targetForKey(tree, "secretaris", "ArrowLeft")).toBe(
      "jeugdvoorzitter",
    );
    expect(targetForKey(tree, "secretaris", "ArrowRight")).toBe("sportief");
    expect(targetForKey(tree, "sportief", "Home")).toBe("jeugdvoorzitter");
    expect(targetForKey(tree, "jeugdvoorzitter", "End")).toBe("sportief");
  });

  it("returns null for unavailable moves (root parent, leaf child, sibling ends)", () => {
    expect(targetForKey(tree, "club", "ArrowUp")).toBeNull();
    expect(targetForKey(tree, "secretaris", "ArrowDown")).toBeNull();
    expect(targetForKey(tree, "jeugdvoorzitter", "ArrowLeft")).toBeNull();
  });
});

describe("splitFan (count-then-expand)", () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  it("caps and reports the hidden count when collapsed", () => {
    expect(splitFan(items, 6, false)).toEqual({
      visible: [1, 2, 3, 4, 5, 6],
      hidden: 6,
    });
  });

  it("shows everything when expanded", () => {
    expect(splitFan(items, 6, true)).toEqual({ visible: items, hidden: 0 });
  });

  it("does not cap when items fit under the cap", () => {
    expect(splitFan([1, 2, 3], 6, false)).toEqual({
      visible: [1, 2, 3],
      hidden: 0,
    });
  });
});
