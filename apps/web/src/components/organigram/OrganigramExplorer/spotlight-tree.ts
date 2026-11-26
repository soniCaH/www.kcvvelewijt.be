import type { OrgChartNode } from "@/types/organigram";

/**
 * Pure spotlight-tree model for `<OrganigramExplorer>` (Phase 7, #2054).
 *
 * The explorer navigates the REAL `parentNode` reporting tree (decision 7o3 +
 * the live data audit: there are no afdeling container nodes — `department` is an
 * orthogonal tag). This module turns the flat `OrgChartNode[]` the page already
 * fetches (`StaffRepository.findAll()`, plus the synthetic "club" root that
 * `withClubRoot` adds) into
 * a navigable tree and, for a given focused node, the spotlight "neighbourhood"
 * the UI renders: breadcrumb trail · parent · siblings (with the focus index) ·
 * children. Only the neighbourhood is ever mounted — never the whole tree
 * (competitive analysis 7o3b §0/§4: mount-only-neighbourhood).
 *
 * Everything here is pure and framework-free so it is exhaustively unit-tested
 * and reused by the accessible "volledig organigram" fallback (#2054) too.
 */

export const CLUB_ROOT_ID = "club";

/**
 * The organisation itself, the root the reporting tree hangs from. Not a box:
 * the repository never returns it, and the one consumer that needs a root —
 * this tree — adds it (`withClubRoot`).
 */
export const CLUB_ROOT_NODE: OrgChartNode = {
  id: CLUB_ROOT_ID,
  title: "KCVV Elewijt",
  members: [
    {
      id: CLUB_ROOT_ID,
      name: "KCVV Elewijt",
      imageUrl: "/images/logo-flat.png",
    },
  ],
  department: "algemeen",
  parentId: null,
};

/** The boxes with the club root in front, unless the list already has one. */
export const withClubRoot = (nodes: OrgChartNode[]): OrgChartNode[] => {
  return nodes.some((node) => node.id === CLUB_ROOT_ID)
    ? nodes
    : [CLUB_ROOT_NODE, ...nodes];
};

export interface SpotlightTree {
  rootId: string;
  byId: Map<string, OrgChartNode>;
  /** parent id → children, in repository order (GROQ sortOrder → title). */
  childrenOf: Map<string, OrgChartNode[]>;
  /** node id → parent id (null for the root). */
  parentOf: Map<string, string | null>;
}

export interface SpotlightView {
  focus: OrgChartNode;
  /** Reporting line root → focus (inclusive) — the breadcrumb. */
  trail: OrgChartNode[];
  /** Depth of the focus below the root (root = 0). */
  depth: number;
  parent: OrgChartNode | null;
  /** All siblings including the focus, in order. A root focus is its own only sibling. */
  siblings: OrgChartNode[];
  /** Index of the focus within `siblings`. */
  focusIndex: number;
  children: OrgChartNode[];
}

/**
 * Build the tree from the flat node list. A node attaches to its `parentId`
 * when that parent exists in the set; otherwise (null, missing, inactive, or a
 * self-reference) it becomes a child of the root. The root itself (`rootId`) has
 * no parent. Children preserve incoming order.
 *
 * A parent cycle (A → B → A) never reaches the root, so its members and the
 * whole subtree below them would vanish. Studio validation refuses a cycle on
 * save, but two drafts can each pass and still close one once both publish
 * (#3478), so the builder breaks each cycle itself: the member that comes first
 * in incoming order is re-attached to the root.
 */
export const buildSpotlightTree = (
  nodes: OrgChartNode[],
  rootId: string = CLUB_ROOT_ID,
): SpotlightTree => {
  const byId = new Map<string, OrgChartNode>();
  for (const node of nodes) byId.set(node.id, node);

  const parentOf = new Map<string, string | null>();
  for (const node of nodes) {
    if (node.id === rootId) {
      parentOf.set(node.id, null);
      continue;
    }
    const rawParent = node.parentId ?? null;
    parentOf.set(
      node.id,
      rawParent !== null && rawParent !== node.id && byId.has(rawParent)
        ? rawParent
        : rootId,
    );
  }

  breakParentCycles(nodes, parentOf, rootId);

  const childrenOf = new Map<string, OrgChartNode[]>();
  for (const node of nodes) {
    const parentId = parentOf.get(node.id) ?? null;
    if (parentId === null) continue;
    const bucket = childrenOf.get(parentId);
    if (bucket) bucket.push(node);
    else childrenOf.set(parentId, [node]);
  }

  return { rootId, byId, childrenOf, parentOf };
};

/** Climb parent links until the root, a settled node or a revisit; `end` is where it stopped. */
const walkUp = (
  id: string | null,
  parentOf: Map<string, string | null>,
  settled: Set<string>,
  path: string[],
): { path: string[]; end: string | null } =>
  id === null || settled.has(id) || path.includes(id)
    ? { path, end: id }
    : walkUp(parentOf.get(id) ?? null, parentOf, settled, [...path, id]);

/**
 * Re-attach one member of every parent cycle to the root (mutates `parentOf`).
 * Walks up from each node; a walk that revisits a node of its own path has
 * found a cycle, and the cycle's first member in incoming order is cut loose.
 */
const breakParentCycles = (
  nodes: OrgChartNode[],
  parentOf: Map<string, string | null>,
  rootId: string,
): void => {
  const order = new Map(nodes.map((node, index) => [node.id, index]));
  const settled = new Set<string>();

  for (const start of nodes) {
    const { path, end } = walkUp(start.id, parentOf, settled, []);
    if (end !== null && path.includes(end)) {
      const cycle = path.slice(path.indexOf(end));
      const cut = cycle.reduce((a, b) =>
        (order.get(b) ?? 0) < (order.get(a) ?? 0) ? b : a,
      );
      parentOf.set(cut, rootId);
    }
    for (const id of path) settled.add(id);
  }
};

/** Children of a node (empty when leaf or unknown). */
export const childrenOf = (tree: SpotlightTree, id: string): OrgChartNode[] => {
  return tree.childrenOf.get(id) ?? [];
};

/**
 * The node the explorer opens on by default: the most substantive top-level
 * node (the root child with the most direct reports) — the de-facto top of the
 * reporting tree — rather than the thin synthetic club root. Data-driven so it
 * holds whatever the real org shape is; falls back to the root when there are no
 * top nodes. The root stays reachable via the breadcrumb.
 */
export const primaryFocusId = (tree: SpotlightTree): string => {
  const best = childrenOf(tree, tree.rootId).reduce<OrgChartNode | undefined>(
    (top, node) =>
      !top || childrenOf(tree, node.id).length > childrenOf(tree, top.id).length
        ? node
        : top,
    undefined,
  );
  return best?.id ?? tree.rootId;
};

/** Parent id of a node, or null for the root / unknown nodes. */
const parentIdOf = (tree: SpotlightTree, id: string): string | null => {
  return tree.parentOf.get(id) ?? null;
};

/** Nodes from `current` up to the root, stopping on an unknown or revisited node. */
const collectTrail = (
  tree: SpotlightTree,
  current: string | null,
  seen: string[],
): OrgChartNode[] => {
  const node = current === null ? undefined : tree.byId.get(current);
  if (current === null || !node || seen.includes(current)) return [];
  return [
    node,
    ...collectTrail(tree, parentIdOf(tree, current), [...seen, current]),
  ];
};

/**
 * The reporting line from the root down to `id`, inclusive. Guards against
 * cycles by stopping if a node is revisited.
 */
export const trailTo = (tree: SpotlightTree, id: string): OrgChartNode[] => {
  return collectTrail(tree, id, []).reverse();
};

/**
 * Resolve the spotlight neighbourhood for a focused node. Throws if the id is
 * unknown — callers hold a valid focus id (it starts at the root and only moves
 * via the navigation helpers below, which return existing ids or null).
 */
export const getSpotlightView = (
  tree: SpotlightTree,
  focusId: string,
): SpotlightView => {
  const focus = tree.byId.get(focusId);
  if (!focus) {
    throw new Error(`getSpotlightView: unknown node "${focusId}"`);
  }

  const trail = trailTo(tree, focusId);
  const parentId = parentIdOf(tree, focusId);
  const parent = parentId !== null ? (tree.byId.get(parentId) ?? null) : null;
  const siblings = parent ? childrenOf(tree, parent.id) : [focus];
  const focusIndex = siblings.findIndex((node) => node.id === focusId);

  return {
    focus,
    trail,
    depth: trail.length - 1,
    parent,
    siblings,
    focusIndex: focusIndex === -1 ? 0 : focusIndex,
    children: childrenOf(tree, focusId),
  };
};

// ─── Navigation (return a target node id, or null when the move is unavailable) ──

/** ↑ — move to the parent. Null at the root. */
export const parentTarget = (
  tree: SpotlightTree,
  id: string,
): string | null => {
  return parentIdOf(tree, id);
};

/** ↓ — move to the first child. Null on a leaf. */
export const firstChildTarget = (
  tree: SpotlightTree,
  id: string,
): string | null => {
  return childrenOf(tree, id)[0]?.id ?? null;
};

/**
 * ← / → — move to the previous/next sibling. Stops at the ends (returns null)
 * rather than wrapping: ←/→ is a positional axis, so wrapping is unexpected
 * (a11y research 7o3b); Home/End jump to the ends and the `n / N` indicator +
 * the sibling jump-list (tap) cover longer hops.
 */
export const siblingTarget = (
  tree: SpotlightTree,
  id: string,
  offset: 1 | -1,
): string | null => {
  const parentId = parentIdOf(tree, id);
  const siblings = parentId ? childrenOf(tree, parentId) : [];
  if (siblings.length === 0) return null;
  const index = siblings.findIndex((node) => node.id === id);
  if (index === -1) return null;
  const next = index + offset;
  if (next < 0 || next >= siblings.length) return null;
  return siblings[next]?.id ?? null;
};

/** Home / End — jump to the first/last sibling at this level. */
export const edgeSiblingTarget = (
  tree: SpotlightTree,
  id: string,
  edge: "first" | "last",
): string | null => {
  const parentId = parentIdOf(tree, id);
  const siblings = parentId ? childrenOf(tree, parentId) : [];
  if (siblings.length === 0) return null;
  const target = edge === "first" ? siblings[0] : siblings.at(-1);
  return target?.id ?? null;
};

/** Keys the spotlight stage handles for navigation (Enter/Escape are owned by the component). */
export type SpotlightNavKey =
  "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight" | "Home" | "End";

/**
 * Route a navigation key to its target node id (or null when the move is
 * unavailable at this position). The locked scheme (7o3): ↑ parent · ↓ first
 * child · ← / → prev/next sibling · Home/End first/last sibling.
 */
export const targetForKey = (
  tree: SpotlightTree,
  id: string,
  key: SpotlightNavKey,
): string | null => {
  switch (key) {
    case "ArrowUp":
      return parentTarget(tree, id);
    case "ArrowDown":
      return firstChildTarget(tree, id);
    case "ArrowLeft":
      return siblingTarget(tree, id, -1);
    case "ArrowRight":
      return siblingTarget(tree, id, 1);
    case "Home":
      return edgeSiblingTarget(tree, id, "first");
    case "End":
      return edgeSiblingTarget(tree, id, "last");
    default:
      return null;
  }
};

/**
 * Count-then-expand split for a large children fan (competitive analysis 7o3b
 * §3 — the converged industry answer to 11–12-wide fan-outs). Returns the
 * visible slice and how many are hidden; when expanded, everything is visible.
 */
export const splitFan = <T>(
  items: T[],
  cap: number,
  expanded: boolean,
): { visible: T[]; hidden: number } => {
  if (expanded) {
    return { visible: items, hidden: 0 };
  }
  // Normalise the cap to an integer in [0, items.length] so `hidden` is always a
  // whole, in-range count even if a caller passes a fractional or out-of-range cap.
  const integerCap = Math.min(Math.max(0, Math.floor(cap)), items.length);
  const visible = items.slice(0, integerCap);
  return { visible, hidden: items.length - visible.length };
};
