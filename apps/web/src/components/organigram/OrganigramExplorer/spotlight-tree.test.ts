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
  CLUB_ROOT_NODE,
  withClubRoot,
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

describe("buildSpotlightTree — parent cycles (#3478)", () => {
  const club = { id: "club", title: "KCVV", parentId: null, members: [] };

  /** Walk down from the root: every id reachable through `childrenOf`. */
  function reachable(tree: ReturnType<typeof buildSpotlightTree>): string[] {
    const out: string[] = [];
    const queue = [tree.rootId];
    while (queue.length) {
      const id = queue.shift() as string;
      out.push(id);
      queue.push(...(tree.childrenOf.get(id) ?? []).map((n) => n.id));
    }
    return out.sort();
  }

  it("attaches exactly one member of a two-node cycle to the root", () => {
    const tree = buildSpotlightTree([club, node("a", "b"), node("b", "a")]);
    const rootKids = tree.childrenOf.get(CLUB_ROOT_ID)?.map((n) => n.id);
    expect(rootKids).toHaveLength(1);
    expect(reachable(tree)).toEqual(["a", "b", "club"]);
    expect(trailTo(tree, "a")[0]?.id).toBe(CLUB_ROOT_ID);
    expect(trailTo(tree, "b")[0]?.id).toBe(CLUB_ROOT_ID);
  });

  it("breaks a longer cycle and keeps the subtree hanging off it reachable", () => {
    const tree = buildSpotlightTree([
      club,
      node("a", "c"),
      node("b", "a"),
      node("c", "b"),
      node("leaf", "b"), // hangs off the cycle, not part of it
    ]);
    expect(tree.childrenOf.get(CLUB_ROOT_ID)).toHaveLength(1);
    expect(reachable(tree)).toEqual(["a", "b", "c", "club", "leaf"]);
    expect(trailTo(tree, "leaf")[0]?.id).toBe(CLUB_ROOT_ID);
  });

  it("handles several independent cycles", () => {
    const tree = buildSpotlightTree([
      club,
      node("a", "b"),
      node("b", "a"),
      node("x", "y"),
      node("y", "x"),
    ]);
    expect(tree.childrenOf.get(CLUB_ROOT_ID)).toHaveLength(2);
    expect(reachable(tree)).toEqual(["a", "b", "club", "x", "y"]);
  });

  it("leaves a healthy tree untouched", () => {
    const healthy = buildSpotlightTree(NODES);
    expect(reachable(healthy)).toEqual(NODES.map((n) => n.id).sort());
    expect(healthy.parentOf.get("jeugdsecr")).toBe("jeugdvoorzitter");
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

describe("withClubRoot", () => {
  it("puts the club root in front of the boxes", () => {
    const boxes = [node("voorzitter", "club")];

    expect(withClubRoot(boxes).map((n) => n.id)).toEqual([
      "club",
      "voorzitter",
    ]);
    expect(withClubRoot(boxes)[0]).toBe(CLUB_ROOT_NODE);
  });

  it("leaves a list that already has a root alone", () => {
    const own = [{ id: "club", title: "Eigen", parentId: null, members: [] }];

    expect(withClubRoot(own)).toBe(own);
  });

  it("makes a list of boxes a tree the explorer can walk, with the root on top", () => {
    const tree = buildSpotlightTree(withClubRoot([node("voorzitter", null)]));

    expect(tree.rootId).toBe(CLUB_ROOT_ID);
    expect(tree.parentOf.get("voorzitter")).toBe(CLUB_ROOT_ID);
  });
});
