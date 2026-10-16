// PROTOTYPE — throwaway. Option B: "Van top naar ploeg" — the real parentId
// tree, drawn on the page as one spine with nested lists. No regrouping.
import type { OrgChartNode } from "@/types/organigram";
import { MonoLabel } from "@/components/design-system";
import { SeatRow } from "./SeatRow";

function Branch({
  node,
  nodes,
  kids,
}: {
  node: OrgChartNode;
  nodes: OrgChartNode[];
  kids: (id: string) => OrgChartNode[];
}) {
  const children = kids(node.id);
  return (
    <li className="min-w-0">
      <SeatRow node={node} nodes={nodes} compact />
      {children.length > 0 && (
        <ul className="border-ink ml-3 flex flex-col border-l-2 pl-4">
          {children.map((c) => (
            <Branch key={c.id} node={c} nodes={nodes} kids={kids} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function VariantSpine({ nodes }: { nodes: OrgChartNode[] }) {
  const kids = (id: string) => {
    const list = nodes.filter((n) => n.id !== "club" && n.parentId === id);
    return [
      ...list.filter((n) => n.members.length > 0),
      ...list.filter((n) => n.members.length === 0),
    ];
  };
  const tops = kids("club");
  const root = tops.length === 1 ? tops[0] : undefined;
  const level1 = root ? kids(root.id) : tops;
  const branches = level1.filter((n) => kids(n.id).length > 0);
  const leaves = level1.filter((n) => kids(n.id).length === 0);

  return (
    <div
      data-testid="proto-variant-b"
      className="flex flex-col items-stretch gap-0"
    >
      {root && (
        <div className="flex flex-col items-center gap-2">
          <MonoLabel variant="pill-ink" size="sm">
            Top
          </MonoLabel>
          <div className="w-full max-w-xs">
            <SeatRow node={root} nodes={nodes} />
          </div>
          <span aria-hidden="true" className="bg-ink block h-6 w-0.5" />
        </div>
      )}

      <section
        aria-label="Rechtstreeks onder de voorzitter"
        className="border-ink border-t-2 pt-5"
      >
        <p className="text-ink-muted text-label mb-3 font-mono font-semibold uppercase">
          Rechtstreeks onder de voorzitter
        </p>
        <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
          {leaves.map((n) => (
            <li key={n.id} className="min-w-0">
              <SeatRow node={n} nodes={nodes} compact />
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {branches.map((b) => (
          <section
            key={b.id}
            aria-label={b.title}
            className="border-ink min-w-0 border-t-2 pt-4"
          >
            <h3 className="font-display text-ink mb-2 text-2xl font-bold">
              {b.title}
            </h3>
            <ul className="flex flex-col">
              <Branch node={b} nodes={nodes} kids={kids} />
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
