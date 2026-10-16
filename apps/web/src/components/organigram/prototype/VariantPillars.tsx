// PROTOTYPE — throwaway. Option A: "Bestuur bovenaan, drie pijlers eronder".
import type { OrgChartNode } from "@/types/organigram";
import { MonoLabel } from "@/components/design-system";
import { SeatRow } from "./SeatRow";
import { boardMemberIds, seatsIn, type PillarKey } from "./pillars";

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-jersey-deep border-ink/15 text-label mt-2 border-t pt-3 font-mono font-semibold uppercase">
      {children}
    </p>
  );
}

function Pillar({
  title,
  purpose,
  children,
}: {
  title: string;
  purpose: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={title}
      className="border-ink lg:border-l-ink/15 flex min-w-0 flex-col gap-1 border-t-2 pt-4 lg:border-t-0 lg:border-l lg:px-5 lg:pt-0"
    >
      <h3 className="font-display text-ink text-2xl font-bold">{title}</h3>
      <p className="text-ink-muted mb-2 text-sm">{purpose}</p>
      {children}
    </section>
  );
}

export function VariantPillars({ nodes }: { nodes: OrgChartNode[] }) {
  const board = boardMemberIds(nodes);
  const rows = (key: PillarKey, filter?: (n: OrgChartNode) => boolean) =>
    seatsIn(nodes, key)
      .filter((n) => (filter ? filter(n) : true))
      // One row per single person: their seats in this list merge.
      .reduce<{ node: OrgChartNode; extra: string[] }[]>((acc, n) => {
        const solo = n.members.length === 1 ? n.members[0].id : null;
        const hit = solo
          ? acc.find(
              (r) =>
                r.node.members.length === 1 && r.node.members[0].id === solo,
            )
          : undefined;
        if (hit) hit.extra.push(n.title);
        else acc.push({ node: n, extra: [] });
        return acc;
      }, [])
      .map(({ node: n, extra }) => (
        <SeatRow
          key={n.id}
          node={n}
          nodes={nodes}
          board={board}
          extraTitles={extra}
        />
      ));

  const bestuur = seatsIn(nodes, "bestuur");
  const boardSeat = bestuur.find((n) => n.roleCode === "BST");
  const trio = bestuur.filter((n) => n.roleCode !== "BST");
  const overig = seatsIn(nodes, "overig");
  const isA = (n: OrgChartNode) =>
    ["T1-A", "T2-A", "KT-F", "TD"].includes(n.roleCode ?? "");

  return (
    <div data-testid="proto-variant-a" className="flex flex-col gap-8">
      {/* Top band: the VZW board */}
      <section
        aria-label="Bestuur"
        className="border-ink flex flex-col gap-3 border-b-2 pb-6"
      >
        <MonoLabel variant="pill-ink" size="sm">
          Het bestuur · de vzw
        </MonoLabel>
        <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-4">
          {trio.map((n) => (
            <SeatRow key={n.id} node={n} nodes={nodes} />
          ))}
        </div>
        {boardSeat && (
          <button
            type="button"
            data-member-card="true"
            data-node-id={boardSeat.id}
            className="text-ink hover:bg-cream-soft -mx-2 px-2 py-1.5 text-left text-sm"
          >
            <span className="font-semibold">Raad van bestuur: </span>
            {boardSeat.members.map((m) => m.name).join(", ")}
            <span className="text-ink-muted">
              {" "}
              — elk trekt een domein hieronder (
              <span className="border-jersey-deep text-jersey-deep text-label-sm border px-1 font-mono font-semibold">
                B
              </span>
              ).
            </span>
          </button>
        )}
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-0">
        <Pillar
          title="Sportief"
          purpose="Het A- en B-elftal: trainers, keepers en doorstroom."
        >
          {rows("sportief", (n) => n.roleCode === "TD")}
          <Sub>A-elftal</Sub>
          {rows("sportief", (n) => isA(n) && n.roleCode !== "TD")}
          <Sub>B-elftal &amp; doorstroom</Sub>
          {rows("sportief", (n) => !isA(n))}
        </Pillar>

        <Pillar
          title="Jeugd"
          purpose="Van de kleinsten tot de beloften. Organisatie en opleiding."
        >
          <Sub>Organisatie · jeugdbestuur</Sub>
          {rows("jeugd-organisatie")}
          <Sub>Opleiding · per leeftijd</Sub>
          {rows("jeugd-opleiding")}
        </Pillar>

        <Pillar
          title="Club & werking"
          purpose="Alles naast het veld: sponsors, gebouw, kantine, kledij."
        >
          {rows("club")}
        </Pillar>
      </div>

      <section
        aria-label="Integriteit"
        className="border-jersey-deep flex flex-col gap-2 border-2 p-4 sm:flex-row sm:items-start sm:gap-8"
      >
        <div className="shrink-0">
          <h3 className="font-display text-ink text-xl font-bold">
            Integriteit
          </h3>
          <p className="text-ink-muted mt-1 max-w-[22ch] text-sm">
            Voor elk probleem rond welzijn, pesten of grensoverschrijdend
            gedrag.
          </p>
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-x-6 sm:grid-cols-2">
          {rows("integriteit")}
        </div>
      </section>

      {overig.length > 0 && (
        <section aria-label="Niet ingedeeld" className="flex flex-col gap-1">
          <Sub>Nog niet ingedeeld (prototype)</Sub>
          {overig.map((n) => (
            <SeatRow key={n.id} node={n} nodes={nodes} board={board} />
          ))}
        </section>
      )}
    </div>
  );
}
