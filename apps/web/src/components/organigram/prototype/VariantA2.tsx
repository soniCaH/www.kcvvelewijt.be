// PROTOTYPE — throwaway. A2 "Smoelenboek": photo-first — the faces you recognise at the canteen, tap one for its contact.
import type { OrgChartMember, OrgChartNode } from "@/types/organigram";
import { MonoLabel, RoundAvatar } from "@/components/design-system";
import { BoardLink } from "./BoardLink";
import { InlineContact } from "./InlineContact";
import {
  PILLARS,
  boardIn,
  keyFigures,
  seatsIn,
  pillarSeats,
  type PillarKey,
} from "./pillars";

type Face = { key: string; node: OrgChartNode; titles: string[] };

/**
 * One face per person: every holder of a seat becomes (or joins) their own
 * face, carrying a one-member copy of the seat so the contact shows only them.
 * Vacant seats stay a face of their own.
 */
function facesOf(seats: OrgChartNode[]): Face[] {
  const byPerson = new Map<string, Face>();
  const vacant: Face[] = [];
  for (const n of seats) {
    if (n.members.length === 0) {
      vacant.push({ key: n.id, node: n, titles: [n.title] });
      continue;
    }
    for (const m of n.members) {
      const hit = byPerson.get(m.id);
      if (hit) hit.titles.push(n.title);
      else
        byPerson.set(m.id, {
          key: `${n.id}-${m.id}`,
          node: { ...n, members: [m] },
          titles: [n.title],
        });
    }
  }
  return [...byPerson.values(), ...vacant];
}

const OPEN_PANEL = "border-jersey-deep bg-cream-soft mt-3 border-t-2 p-4";

function FaceTile({ face }: { face: Face }) {
  const person = face.node.members[0];
  return (
    <InlineContact
      node={face.node}
      // Open: the face leaves its cell and takes the whole row, so the
      // unfolded contact reads as a framed card, not a stray drop-down.
      className="open:border-ink open:bg-cream min-w-0 open:col-span-full open:border-2 open:p-3"
      panelClassName={OPEN_PANEL}
      summary={
        <span className="hover:bg-cream-soft flex flex-col items-center gap-2 p-2 text-center group-open:flex-row group-open:items-center group-open:gap-4 group-open:p-0 group-open:text-left group-open:hover:bg-transparent">
          {person ? (
            <RoundAvatar
              size={64}
              name={person.name}
              photoUrl={person.imageUrl}
            />
          ) : (
            <RoundAvatar size={64} glyph="+" dashed />
          )}
          <span className="flex min-w-0 flex-col">
            <span className="text-body-md text-ink font-semibold break-words">
              {person ? person.name : "Plek vrij"}
            </span>
            <span className="text-body-sm text-ink-muted break-words">
              {face.titles.join(" · ")}
            </span>
            {!person && (
              <span className="text-body-sm text-jersey-deep">
                Iets voor jou?
              </span>
            )}
          </span>
        </span>
      }
    />
  );
}

function FaceGrid({ seats }: { seats: OrgChartNode[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {facesOf(seats).map((f) => (
        <FaceTile key={f.key} face={f} />
      ))}
    </div>
  );
}

function BoardLine({ members }: { members: OrgChartMember[] }) {
  if (members.length === 0) return null;
  return (
    <p className="text-body-sm text-ink flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="text-ink-muted">In het bestuur:</span>
      {members.map((m) => (
        <span key={m.id} className="inline-flex items-center gap-1.5">
          <RoundAvatar size={24} name={m.name} photoUrl={m.imageUrl} />
          {m.name}
        </span>
      ))}
    </p>
  );
}

function KeyFigure({ node, why }: { node: OrgChartNode; why: string }) {
  const person = node.members[0];
  return (
    <InlineContact
      node={node}
      className="open:border-ink open:bg-cream min-w-0 open:border-2 open:p-3"
      panelClassName={OPEN_PANEL}
      summary={
        <span className="hover:bg-cream-soft flex items-start gap-4 p-2 group-open:p-0 group-open:hover:bg-transparent">
          {person ? (
            <RoundAvatar
              size={64}
              name={person.name}
              photoUrl={person.imageUrl}
            />
          ) : (
            <RoundAvatar size={64} glyph="+" dashed />
          )}
          <span className="flex min-w-0 flex-col">
            <span className="text-body-md text-ink font-semibold">
              {node.members.map((m) => m.name).join(" & ") || "Plek vrij"}
            </span>
            <span className="text-label text-jersey-deep font-mono font-semibold uppercase">
              {node.title}
            </span>
            <span className="text-body-sm text-ink-muted mt-1">{why}</span>
          </span>
        </span>
      }
    />
  );
}

function KeyRow({
  label,
  figures,
}: {
  label: string;
  figures: ReturnType<typeof keyFigures>;
}) {
  return (
    <div className="flex flex-col gap-3">
      <MonoLabel variant="pill-ink" size="sm">
        {label}
      </MonoLabel>
      <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
        {figures.map((k) => (
          <KeyFigure key={k.code} node={k.node} why={k.why} />
        ))}
      </div>
    </div>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-label text-jersey-deep font-mono font-semibold uppercase">
      {children}
    </p>
  );
}

export function VariantA2({ nodes }: { nodes: OrgChartNode[] }) {
  const boardSeat = nodes.find((n) => n.roleCode === "BST");
  const overig = seatsIn(nodes, "overig");
  // "jeugd" spans two sub-pillars; collect board members of both.
  const boardOf = (key: string): OrgChartMember[] => {
    if (key !== "jeugd") return boardIn(nodes, key as PillarKey);
    const all = [
      ...boardIn(nodes, "jeugd-organisatie"),
      ...boardIn(nodes, "jeugd-opleiding"),
    ];
    return all.filter((m, i) => all.findIndex((x) => x.id === m.id) === i);
  };

  return (
    <div data-testid="proto-variant-a2" className="flex flex-col gap-10">
      <section
        aria-label="Bestuur en aanspreekpunten"
        className="border-ink flex flex-col gap-6 border-b-2 pb-8"
      >
        <KeyRow
          label="Dagelijks bestuur"
          figures={keyFigures(nodes, "dagelijks")}
        />
        <KeyRow
          label="Aanspreekpunten"
          figures={keyFigures(nodes, "aanspreek")}
        />
        {boardSeat && boardSeat.members.length > 0 && (
          <p className="text-body-sm text-ink-muted">
            <span className="text-ink font-semibold">Raad van bestuur: </span>
            {boardSeat.members.map((m) => m.name).join(", ")}
          </p>
        )}
        <BoardLink board="hoofdbestuur" />
      </section>

      {PILLARS.map((p) => (
        <section
          key={p.key}
          aria-label={p.title}
          className={
            p.key === "integriteit"
              ? "border-jersey-deep flex flex-col gap-4 border-2 p-4"
              : "flex flex-col gap-4"
          }
        >
          <header className="flex flex-col gap-1">
            <h3 className="font-display text-ink text-display-sm font-bold">
              {p.title}
            </h3>
            <p className="text-body-sm text-ink-muted">{p.purpose}</p>
            <BoardLine members={boardOf(p.key)} />
            {p.key === "jeugd" && <BoardLink board="jeugdbestuur" />}
          </header>
          {p.key === "jeugd" ? (
            <>
              <Sub>Organisatie · jeugdbestuur</Sub>
              <FaceGrid seats={seatsIn(nodes, "jeugd-organisatie")} />
              <Sub>Opleiding · per leeftijd</Sub>
              <FaceGrid seats={seatsIn(nodes, "jeugd-opleiding")} />
            </>
          ) : (
            <FaceGrid seats={pillarSeats(nodes, p.key)} />
          )}
        </section>
      ))}

      {overig.length > 0 && (
        <section aria-label="Niet ingedeeld" className="flex flex-col gap-4">
          <Sub>Nog niet ingedeeld (prototype)</Sub>
          <FaceGrid seats={overig} />
        </section>
      )}
    </div>
  );
}
