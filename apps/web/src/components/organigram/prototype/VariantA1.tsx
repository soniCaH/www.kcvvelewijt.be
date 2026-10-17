// PROTOTYPE — throwaway. A1 "Clubboek": a typographic ledger like a printed club yearbook — dotted `functie …… naam` rows that unfold contact in place.
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

/** Small-caps chapter label, the programme's running head. */
function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-jersey-deep text-label font-mono font-semibold uppercase">
      {children}
    </p>
  );
}

/** One ledger line: `functie ........ naam`, unfolding contact beneath. */
function LedgerRow({ node, titles }: { node: OrgChartNode; titles: string[] }) {
  const vacant = node.members.length === 0;
  return (
    <li className="border-ink/10 border-b last:border-b-0">
      <InlineContact
        node={node}
        panelClassName="border-jersey-deep mb-3 ml-1 border-l-2 py-1 pl-4"
        summary={
          <span className="group-open:text-jersey-deep hover:text-jersey-deep flex items-baseline gap-2 py-2">
            <span className="text-body-md text-ink min-w-0">
              {titles.join(" · ")}
            </span>
            <span
              aria-hidden="true"
              className="border-ink-muted mb-1 h-0 min-w-4 flex-1 border-b border-dotted"
            />
            {vacant ? (
              <span className="text-ink-muted text-body-sm shrink-0 italic">
                plek vrij — iets voor jou?
              </span>
            ) : (
              <span className="text-body-md text-ink min-w-0 text-right font-semibold">
                {names(node)}
              </span>
            )}
            <span
              aria-hidden="true"
              className="text-ink-muted text-mono-sm shrink-0 font-mono group-open:rotate-45"
            >
              +
            </span>
          </span>
        }
      />
    </li>
  );
}

function Ledger({ seats }: { seats: OrgChartNode[] }) {
  return (
    <ul className="flex flex-col">
      {mergeSolo(seats).map(({ node, titles }) => (
        <LedgerRow key={node.id} node={node} titles={titles} />
      ))}
    </ul>
  );
}

/** A key figure: the only place in the book with a face. */
function Figure({ node, why }: { node: OrgChartNode; why: string }) {
  const first = node.members[0];
  return (
    <InlineContact
      node={node}
      className="min-w-0"
      panelClassName="border-jersey-deep mt-2 ml-8 border-l-2 py-1 pl-4"
      summary={
        <span className="hover:bg-cream-soft group-open:bg-cream-soft -mx-2 flex items-start gap-3 px-2 py-2">
          <RoundAvatar
            size={64}
            name={first?.name}
            photoUrl={first?.imageUrl}
            glyph={first ? undefined : "+"}
            dashed={!first}
          />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-ink-muted text-label-sm font-mono uppercase">
              {node.title}
            </span>
            <span className="font-display text-ink text-xl font-bold">
              {first ? names(node) : "Plek vrij"}
            </span>
            <span className="text-ink-muted text-body-sm italic">{why}</span>
            <span className="text-jersey-deep text-label-sm font-mono uppercase">
              <span className="group-open:hidden">Contact ↓</span>
              <span className="hidden group-open:inline">Sluiten ↑</span>
            </span>
          </span>
        </span>
      }
    />
  );
}

function FigureGroup({
  title,
  figures,
  cols,
}: {
  title: string;
  figures: ReturnType<typeof keyFigures>;
  cols: string;
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h3 className="font-display text-ink border-ink border-b pb-1 text-2xl font-bold">
        {title}
      </h3>
      <div className={`grid grid-cols-1 gap-x-8 gap-y-2 ${cols}`}>
        {figures.map((f) => (
          <Figure key={f.code} node={f.node} why={f.why} />
        ))}
      </div>
    </section>
  );
}

function Chapter({
  pillarKey,
  title,
  purpose,
  nodes,
  children,
}: {
  pillarKey: string;
  title: string;
  purpose: string;
  nodes: OrgChartNode[];
  children: React.ReactNode;
}) {
  // "jeugd" spans two departments; board members from either count.
  const board =
    pillarKey === "jeugd"
      ? [
          ...boardIn(nodes, "jeugd-organisatie"),
          ...boardIn(nodes, "jeugd-opleiding"),
        ].filter((m, i, all) => all.findIndex((x) => x.id === m.id) === i)
      : boardIn(nodes, pillarKey as Parameters<typeof boardIn>[1]);
  return (
    <section aria-label={title} className="flex min-w-0 flex-col">
      <h3 className="font-display text-ink border-ink text-display-sm border-t-2 pt-3 font-bold">
        {title}
      </h3>
      <p className="text-ink-muted text-body-sm mt-1 italic">{purpose}</p>
      {board.length > 0 && (
        <p className="text-body-sm text-ink mt-2">
          <span className="text-jersey-deep font-semibold">
            In het bestuur:
          </span>{" "}
          {board.map((m) => m.name).join(", ")}
        </p>
      )}
      {pillarKey === "jeugd" && (
        <BoardLink board="jeugdbestuur" className="mt-2 self-start" />
      )}
      <div className="mt-3 flex flex-col gap-4">{children}</div>
    </section>
  );
}

/** The pillar chapters as ledgers; reused by A7. */
export function ClubBook({ nodes }: { nodes: OrgChartNode[] }) {
  const overig = seatsIn(nodes, "overig");
  return (
    <div className="flex flex-col gap-12">
      {/* The book proper: one chapter per pillar. */}
      <div className="grid grid-cols-1 gap-x-12 gap-y-12 lg:grid-cols-2">
        {PILLARS.map((p) => (
          <Chapter
            key={p.key}
            pillarKey={p.key}
            title={p.title}
            purpose={p.purpose}
            nodes={nodes}
          >
            {p.key === "jeugd" ? (
              <>
                <div>
                  <Kicker>Organisatie</Kicker>
                  <Ledger seats={seatsIn(nodes, "jeugd-organisatie")} />
                </div>
                <div>
                  <Kicker>Opleiding</Kicker>
                  <Ledger seats={seatsIn(nodes, "jeugd-opleiding")} />
                </div>
              </>
            ) : (
              <Ledger seats={pillarSeats(nodes, p.key)} />
            )}
          </Chapter>
        ))}
      </div>

      {overig.length > 0 && (
        <section aria-label="Overige functies" className="flex flex-col">
          <Kicker>Overige functies</Kicker>
          <Ledger seats={overig} />
        </section>
      )}
    </div>
  );
}

export function VariantA1({ nodes }: { nodes: OrgChartNode[] }) {
  const raad = nodes.find((n) => n.roleCode === "BST");
  return (
    <div data-testid="proto-variant-a1" className="flex flex-col gap-12">
      {/* Front matter: the faces you contact first. */}
      <div className="flex flex-col gap-8">
        <FigureGroup
          title="Dagelijks bestuur"
          figures={keyFigures(nodes, "dagelijks")}
          cols="sm:grid-cols-2 lg:grid-cols-3"
        />
        <FigureGroup
          title="Aanspreekpunten"
          figures={keyFigures(nodes, "aanspreek")}
          cols="sm:grid-cols-2 lg:grid-cols-3"
        />
        <div className="flex flex-col items-start gap-2">
          {raad && raad.members.length > 0 && (
            <p className="text-ink-muted text-body-sm">
              <span className="text-ink font-semibold">Raad van bestuur</span> —{" "}
              {names(raad)}.
            </p>
          )}
          <BoardLink board="hoofdbestuur" />
        </div>
      </div>

      <ClubBook nodes={nodes} />
    </div>
  );
}
