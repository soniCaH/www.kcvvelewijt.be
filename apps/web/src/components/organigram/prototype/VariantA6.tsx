// PROTOTYPE — throwaway. A6 "Wegwijzer": the visitor's question first (big signpost lines), then the detailed map of every seat per pillar.
import type { OrgChartMember, OrgChartNode } from "@/types/organigram";
import {
  MonoLabel,
  RoundAvatar,
  StripedSeam,
} from "@/components/design-system";
import { BoardLink } from "./BoardLink";
import { InlineContact } from "./InlineContact";
import {
  PILLARS,
  boardIn,
  keyFigures,
  mergeSolo,
  pillarSeats,
  seatsIn,
  type KeyGroup,
  type PillarKey,
} from "./pillars";

const names = (ms: OrgChartMember[]) => ms.map((m) => m.name).join(", ");

function Toggle() {
  return (
    <span className="text-jersey-deep text-label shrink-0 font-mono font-semibold uppercase">
      <span className="group-open:hidden">Contact +</span>
      <span className="hidden group-open:inline">Sluit −</span>
    </span>
  );
}

/** One signpost: the reason as the headline, the person underneath. */
function Signpost({ why, node }: { why: string; node: OrgChartNode }) {
  const vacant = node.members.length === 0;
  return (
    <InlineContact
      node={node}
      className="border-ink/15 border-b"
      panelClassName="border-jersey-deep mb-4 ml-5 border-l-2 py-2 pl-4"
      summary={
        <span className="hover:bg-cream-soft flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <span className="font-display text-ink text-display-sm min-w-0 font-bold">
            {why}
          </span>
          <span className="flex min-w-0 items-center gap-3 sm:shrink-0">
            <span className="flex shrink-0 -space-x-3">
              {vacant ? (
                <RoundAvatar size={40} glyph="+" dashed />
              ) : (
                node.members
                  .slice(0, 2)
                  .map((m) => (
                    <RoundAvatar
                      key={m.id}
                      size={40}
                      name={m.name}
                      photoUrl={m.imageUrl ?? null}
                    />
                  ))
              )}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-ink text-body-md font-semibold">
                {vacant ? "Plek vrij — iets voor jou?" : names(node.members)}
              </span>
              <span className="text-ink-muted text-body-sm">{node.title}</span>
            </span>
            <span className="ml-auto pl-2">
              <Toggle />
            </span>
          </span>
        </span>
      }
    />
  );
}

function Group({
  label,
  group,
  nodes,
}: {
  label: string;
  group: KeyGroup;
  nodes: OrgChartNode[];
}) {
  return (
    <div className="flex flex-col">
      <MonoLabel variant="pill-ink" size="sm">
        {label}
      </MonoLabel>
      <div className="border-ink mt-3 border-t-2">
        {keyFigures(nodes, group).map((k) => (
          <Signpost key={k.code} why={k.why} node={k.node} />
        ))}
      </div>
    </div>
  );
}

/** Compact map row: small avatar, name(s), every title this person holds here. */
function MapRow({ node, titles }: { node: OrgChartNode; titles: string[] }) {
  const vacant = node.members.length === 0;
  return (
    <InlineContact
      node={node}
      panelClassName="border-jersey-deep mb-2 ml-3 border-l-2 py-1 pl-3"
      summary={
        <span
          className={`hover:bg-cream-soft flex min-w-0 items-start gap-2 py-1.5 ${vacant ? "opacity-65" : ""}`}
        >
          {vacant ? (
            <RoundAvatar size={24} glyph="+" dashed />
          ) : (
            <RoundAvatar
              size={24}
              name={node.members[0].name}
              photoUrl={node.members[0].imageUrl ?? null}
            />
          )}
          <span className="flex min-w-0 flex-col">
            <span className="text-ink text-body-sm font-semibold">
              {vacant ? (
                <span className="italic">Plek vrij — iets voor jou?</span>
              ) : (
                names(node.members)
              )}
            </span>
            <span className="text-ink-muted text-xs">{titles.join(" · ")}</span>
          </span>
        </span>
      }
    />
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-jersey-deep border-ink/15 text-label-sm mt-2 border-t pt-2 font-mono font-semibold uppercase">
      {children}
    </p>
  );
}

function rows(seats: OrgChartNode[]) {
  return mergeSolo(seats).map(({ node, titles }) => (
    <MapRow key={node.id} node={node} titles={titles} />
  ));
}

export function VariantA6({ nodes }: { nodes: OrgChartNode[] }) {
  const boardSeat = nodes.find((n) => n.roleCode === "BST");
  const overig = seatsIn(nodes, "overig");

  return (
    <div data-testid="proto-variant-a6" className="flex flex-col gap-10">
      {/* Signposts: lead with the visitor's question. */}
      <section
        aria-label="Waarover gaat je vraag?"
        className="flex flex-col gap-8"
      >
        <h3 className="font-display text-ink text-display-md font-bold">
          Waarover gaat je vraag?
        </h3>
        <div className="grid grid-cols-1 gap-8">
          <Group label="Dagelijks bestuur" group="dagelijks" nodes={nodes} />
          <Group label="Aanspreekpunten" group="aanspreek" nodes={nodes} />
        </div>
        <div className="flex flex-col items-start gap-2">
          {boardSeat && boardSeat.members.length > 0 && (
            <p className="text-ink-muted text-body-sm">
              <span className="text-ink font-semibold">Raad van bestuur: </span>
              {names(boardSeat.members)}.
            </p>
          )}
          <BoardLink board="hoofdbestuur" />
        </div>
      </section>

      <StripedSeam />

      {/* The map: every seat, per pillar. */}
      <section aria-label="Wie doet wat" className="flex flex-col gap-6">
        <h3 className="font-display text-ink text-display-sm font-bold">
          Wie doet wat in de club
        </h3>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
          {PILLARS.map((p) => {
            const board =
              p.key === "jeugd"
                ? [
                    ...new Map(
                      [
                        ...boardIn(nodes, "jeugd-organisatie"),
                        ...boardIn(nodes, "jeugd-opleiding"),
                      ].map((m) => [m.id, m]),
                    ).values(),
                  ]
                : boardIn(nodes, p.key as PillarKey);
            return (
              <section
                key={p.key}
                aria-label={p.title}
                className="border-ink lg:border-l-ink/15 flex min-w-0 flex-col border-t-2 pt-3 lg:border-t-0 lg:border-l lg:px-4 lg:pt-0 lg:first:border-l-0 lg:first:pl-0"
              >
                <h4 className="font-display text-ink text-xl font-bold">
                  {p.title}
                </h4>
                <p className="text-ink-muted text-sm">{p.purpose}</p>
                {board.length > 0 && (
                  <p className="text-jersey-deep text-body-sm mt-1">
                    <span className="font-semibold">In het bestuur: </span>
                    {names(board)}
                  </p>
                )}
                {p.key === "jeugd" && (
                  <BoardLink board="jeugdbestuur" className="mt-1 self-start" />
                )}
                <div className="mt-3 flex flex-col">
                  {p.key === "jeugd" ? (
                    <>
                      <Sub>Organisatie</Sub>
                      {rows(seatsIn(nodes, "jeugd-organisatie"))}
                      <Sub>Opleiding</Sub>
                      {rows(seatsIn(nodes, "jeugd-opleiding"))}
                    </>
                  ) : (
                    rows(pillarSeats(nodes, p.key))
                  )}
                </div>
              </section>
            );
          })}
        </div>
        {overig.length > 0 && (
          <section aria-label="Niet ingedeeld" className="flex flex-col">
            <Sub>Nog niet ingedeeld (prototype)</Sub>
            {rows(overig)}
          </section>
        )}
      </section>
    </div>
  );
}
