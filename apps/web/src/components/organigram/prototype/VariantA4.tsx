// PROTOTYPE — throwaway. A4 "Bouwplan": the structure drawn as a diagram — a dark board band, ink connectors dropping into four pillar columns, seats hanging on a rule.
import type { OrgChartNode } from "@/types/organigram";
import { RoundAvatar } from "@/components/design-system";
import { BoardLink } from "./BoardLink";
import { InlineContact } from "./InlineContact";
import {
  PILLARS,
  boardIn,
  keyFigures,
  mergeSolo,
  pillarSeats,
  seatsIn,
} from "./pillars";

const names = (n: OrgChartNode) => n.members.map((m) => m.name).join(", ");

/** "+" that turns into "×" while the row's <details> is open. */
function Toggle({ dark = false }: { dark?: boolean }) {
  return (
    <span
      aria-hidden
      className={`text-label ml-auto shrink-0 font-mono transition-transform group-open:rotate-45 ${dark ? "text-cream" : "text-jersey-deep"}`}
    >
      +
    </span>
  );
}

/** One key figure in the dark band: who, what, why — contact unfolds below. */
function KeyRow({ node, why }: { node: OrgChartNode; why: string }) {
  const first = node.members[0];
  return (
    <InlineContact
      node={node}
      panelClassName="bg-cream text-ink mt-1 mb-2 p-3"
      summary={
        <span className="hover:bg-jersey-deep -mx-2 flex items-start gap-3 px-2 py-2">
          <RoundAvatar
            size={40}
            name={first?.name}
            photoUrl={first?.imageUrl}
            glyph={first ? undefined : "+"}
            dashed={!first}
          />
          <span className="flex min-w-0 flex-col">
            <span className="text-label text-cream-quiet font-mono uppercase">
              {node.title}
            </span>
            <span className="text-body-md text-cream font-semibold">
              {first ? names(node) : "Plek vrij — iets voor jou?"}
            </span>
            <span className="text-body-sm text-cream">{why}</span>
          </span>
          <Toggle dark />
        </span>
      }
    />
  );
}

/** A seat hanging off the pillar's rule: a short tick, then the row. */
function SeatChip({ node, titles }: { node: OrgChartNode; titles: string[] }) {
  const first = node.members[0];
  return (
    <li className="before:bg-ink relative before:absolute before:top-5 before:-left-4 before:h-0.5 before:w-3">
      <InlineContact
        node={node}
        panelClassName="border-jersey-deep mb-2 ml-1 border-l-2 py-2 pl-3"
        summary={
          <span className="hover:bg-cream-soft flex items-center gap-2 px-1 py-2">
            <RoundAvatar
              size={24}
              name={first?.name}
              photoUrl={first?.imageUrl}
              glyph={first ? undefined : "+"}
              dashed={!first}
            />
            <span className="flex min-w-0 flex-col">
              <span className="text-body-sm text-ink font-semibold">
                {titles.join(" · ")}
              </span>
              {first ? (
                <span className="text-body-sm text-ink-muted">
                  {names(node)}
                </span>
              ) : (
                <span className="text-body-sm text-jersey-deep">
                  plek vrij — iets voor jou?
                </span>
              )}
            </span>
            <Toggle />
          </span>
        }
      />
    </li>
  );
}

function Seats({ seats, label }: { seats: OrgChartNode[]; label?: string }) {
  if (seats.length === 0) return null;
  return (
    <div className="flex flex-col">
      {label && (
        <p className="text-label text-jersey-deep mt-3 ml-5 pl-4 font-mono font-semibold uppercase">
          {label}
        </p>
      )}
      <ul className="border-ink ml-5 flex flex-col border-l-2 pl-4">
        {mergeSolo(seats).map(({ node, titles }) => (
          <SeatChip key={node.id} node={node} titles={titles} />
        ))}
      </ul>
    </div>
  );
}

export function VariantA4({ nodes }: { nodes: OrgChartNode[] }) {
  const dagelijks = keyFigures(nodes, "dagelijks");
  const aanspreek = keyFigures(nodes, "aanspreek");
  const raad = nodes.find((n) => n.roleCode === "BST");
  const overig = seatsIn(nodes, "overig");

  return (
    <div data-testid="proto-variant-a4" className="flex flex-col">
      {/* The top of the plan: who runs the club and whom to call first. */}
      <section
        aria-label="Bestuur en aanspreekpunten"
        className="bg-jersey-deep-dark text-cream flex flex-col gap-6 p-5 lg:p-8"
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_3fr]">
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="font-display text-cream text-2xl font-bold">
              Dagelijks bestuur
            </h3>
            {dagelijks.map((k) => (
              <KeyRow key={k.code} node={k.node} why={k.why} />
            ))}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="font-display text-cream text-2xl font-bold">
              Aanspreekpunten
            </h3>
            <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              {aanspreek.map((k) => (
                <KeyRow key={k.code} node={k.node} why={k.why} />
              ))}
            </div>
          </div>
        </div>
        <div className="border-cream/20 flex flex-col gap-2 border-t pt-4">
          {raad && raad.members.length > 0 && (
            <p className="text-body-sm text-cream-quiet">
              <span className="text-cream font-semibold">
                Raad van bestuur:{" "}
              </span>
              {names(raad)}.
            </p>
          )}
          <BoardLink board="hoofdbestuur" tone="cream" />
        </div>
      </section>

      {/* Stub from the band: centred on desktop, the spine's start on mobile. */}
      <div aria-hidden className="bg-ink ml-4 h-8 w-0.5 lg:mx-auto" />

      {/*
        Mobile: one vertical spine (this wrapper's left border), pillars stack.
        Desktop: a horizontal bus between the outer column centres (12.5% /
        87.5% because the columns carry no gap), each column drops from it.
      */}
      <div className="border-ink relative ml-4 grid grid-cols-1 gap-10 border-l-2 pt-2 pl-6 lg:ml-0 lg:grid-cols-4 lg:gap-0 lg:border-l-0 lg:pt-0 lg:pl-0">
        <div
          aria-hidden
          className="bg-ink absolute top-0 right-[12.5%] left-[12.5%] hidden h-0.5 lg:block"
        />
        {PILLARS.map((p) => {
          const integ = p.key === "integriteit";
          const kop = boardIn(
            nodes,
            p.key === "jeugd" ? "jeugd-organisatie" : p.key,
          ).concat(p.key === "jeugd" ? boardIn(nodes, "jeugd-opleiding") : []);
          const kopUnique = [...new Map(kop.map((m) => [m.id, m])).values()];
          return (
            <section
              key={p.key}
              aria-label={p.title}
              className={`relative flex min-w-0 flex-col lg:px-3 lg:pt-8 lg:before:absolute lg:before:top-0 lg:before:left-1/2 lg:before:h-8 lg:before:w-0 lg:before:border-l-2 ${integ ? "lg:before:border-jersey-deep lg:before:border-dashed" : "lg:before:border-ink"}`}
            >
              <header
                className={`bg-cream relative flex flex-col gap-2 border-2 p-4 before:absolute before:top-6 before:-left-6.5 before:h-0.5 before:w-6.5 lg:before:hidden ${integ ? "border-jersey-deep before:bg-jersey-deep" : "border-ink before:bg-ink"}`}
              >
                <h3 className="font-display text-ink text-2xl font-bold">
                  {p.title}
                </h3>
                <p className="text-body-sm text-ink-muted">{p.purpose}</p>
                {kopUnique.length > 0 && (
                  <div className="border-ink/15 mt-1 flex flex-col gap-2 border-t pt-3">
                    <p className="text-label text-jersey-deep font-mono font-semibold uppercase">
                      In het bestuur
                    </p>
                    {kopUnique.map((m) => (
                      <span key={m.id} className="flex items-center gap-2">
                        <RoundAvatar
                          size={40}
                          name={m.name}
                          photoUrl={m.imageUrl}
                        />
                        <span className="text-body-sm text-ink font-semibold">
                          {m.name}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
                {p.key === "jeugd" && <BoardLink board="jeugdbestuur" />}
              </header>
              {p.key === "jeugd" ? (
                <>
                  <Seats
                    label="Organisatie"
                    seats={seatsIn(nodes, "jeugd-organisatie")}
                  />
                  <Seats
                    label="Opleiding"
                    seats={seatsIn(nodes, "jeugd-opleiding")}
                  />
                </>
              ) : (
                <Seats seats={pillarSeats(nodes, p.key)} />
              )}
            </section>
          );
        })}
      </div>

      {overig.length > 0 && (
        <section aria-label="Niet ingedeeld" className="mt-10">
          <Seats label="Nog niet ingedeeld (prototype)" seats={overig} />
        </section>
      )}
    </div>
  );
}
