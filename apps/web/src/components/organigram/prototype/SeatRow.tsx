// PROTOTYPE — throwaway. One seat as a row: avatar(s), every name, role title.
// Carries `data-member-card` + `data-node-id` so the hub's existing
// <HubMemberPanel> click delegation opens the contact panel unchanged.
import type { OrgChartNode } from "@/types/organigram";
import { RoundAvatar } from "@/components/design-system";
import { otherSeats } from "./pillars";

export function SeatRow({
  node,
  nodes,
  board,
  showAlso = true,
  compact = false,
  extraTitles = [],
}: {
  node: OrgChartNode;
  /** Other seats of the same single person, merged into this row. */
  extraTitles?: string[];
  nodes: OrgChartNode[];
  board?: Set<string>;
  showAlso?: boolean;
  compact?: boolean;
}) {
  const vacant = node.members.length === 0;
  const also =
    showAlso && node.members.length === 1
      ? [
          ...new Set(
            node.members.flatMap((m) => otherSeats(nodes, m.id, node)),
          ),
        ].filter((t) => !extraTitles.includes(t))
      : [];

  return (
    <button
      type="button"
      data-member-card="true"
      data-node-id={node.id}
      className={`hover:bg-cream-soft -mx-2 flex w-[calc(100%+1rem)] min-w-0 items-start gap-3 px-2 py-1.5 text-left ${vacant ? "opacity-65" : ""}`}
    >
      <span className="flex shrink-0 -space-x-3">
        {vacant ? (
          <RoundAvatar size={compact ? 24 : 40} glyph="+" dashed />
        ) : (
          node.members
            .slice(0, 2)
            .map((m) => (
              <RoundAvatar
                key={m.id}
                size={compact ? 24 : 40}
                name={m.name}
                photoUrl={m.imageUrl ?? null}
              />
            ))
        )}
      </span>
      <span className="min-w-0">
        <span className="text-ink text-body-md block font-semibold">
          {vacant ? (
            <span className="italic">Plek vrij — iets voor jou?</span>
          ) : (
            node.members.map((m, i) => (
              <span key={m.id}>
                {i > 0 && ", "}
                {m.name ?? "—"}
                {board?.has(m.id) && (
                  <span
                    title="Zit ook in de raad van bestuur"
                    className="border-jersey-deep text-jersey-deep text-label-sm ml-1 inline-block border px-1 align-[2px] font-mono font-semibold"
                  >
                    B
                  </span>
                )}
              </span>
            ))
          )}
        </span>
        <span className="text-ink-muted text-body-sm block">
          {[node.title, ...extraTitles].join(" · ")}
        </span>
        {also.length > 0 && (
          <span className="text-ink-muted text-label block font-mono">
            ook: {also.join(" · ").toLowerCase()}
          </span>
        )}
      </span>
    </button>
  );
}
