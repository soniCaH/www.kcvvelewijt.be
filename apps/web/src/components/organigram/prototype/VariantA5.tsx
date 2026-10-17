// PROTOTYPE — throwaway. A5 "Kaartenbak": every person is an index card with contact always visible, no clicking.
import Link from "next/link";
import type { OrgChartMember, OrgChartNode } from "@/types/organigram";
import { MonoLabel, RoundAvatar } from "@/components/design-system";
import {
  PILLARS,
  boardIn,
  keyFigures,
  mergeSolo,
  pillarSeats,
  seatsIn,
} from "./pillars";
import { BoardLink } from "./BoardLink";

/** Mail + phone, always shown. No data → the secretariat. */
function Contact({ m }: { m: OrgChartMember }) {
  if (!m.email && !m.phone)
    return (
      <p className="text-body-sm text-ink-muted">
        Contact via{" "}
        <Link href="/club/contact" className="underline">
          het secretariaat
        </Link>
      </p>
    );
  return (
    <p className="text-body-sm flex flex-col">
      {m.email && (
        <a
          href={`mailto:${m.email}`}
          className="text-jersey-deep break-all underline"
        >
          {m.email}
        </a>
      )}
      {m.phone && (
        <a
          href={`tel:${m.phone.replace(/\s/g, "")}`}
          className="text-ink underline"
        >
          {m.phone}
        </a>
      )}
    </p>
  );
}

function Name({ m, className }: { m: OrgChartMember; className: string }) {
  return m.href ? (
    <Link href={m.href} className={`${className} hover:underline`}>
      {m.name}
    </Link>
  ) : (
    <span className={className}>{m.name}</span>
  );
}

function VacantCard({ title }: { title: string }) {
  return (
    <li className="border-ink/50 flex flex-col gap-1 border-2 border-dashed p-3">
      <span className="text-label text-ink-muted font-mono uppercase">
        {title}
      </span>
      <Link
        href="/club/contact"
        className="text-jersey-deep text-body-sm font-semibold underline"
      >
        plek vrij — iets voor jou?
      </Link>
    </li>
  );
}

/** Small card: one person, all their titles in this pillar. */
function PersonCard({ m, titles }: { m: OrgChartMember; titles: string[] }) {
  return (
    <li className="border-ink bg-cream-soft shadow-paper-sm flex gap-3 border p-3">
      <RoundAvatar
        size={40}
        name={m.name}
        photoUrl={m.imageUrl}
        className="shrink-0"
      />
      <div className="flex min-w-0 flex-col gap-1">
        <Name m={m} className="text-ink text-base font-bold" />
        <span className="text-label text-jersey-deep font-mono uppercase">
          {titles.join(" · ")}
        </span>
        <Contact m={m} />
      </div>
    </li>
  );
}

function Cards({ seats }: { seats: OrgChartNode[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {mergeSolo(seats).flatMap(({ node, titles }) =>
        node.members.length === 0
          ? [<VacantCard key={node.id} title={node.title} />]
          : // A shared seat gets one card per holder.
            node.members.map((m) => (
              <PersonCard key={`${node.id}-${m.id}`} m={m} titles={titles} />
            )),
      )}
    </ul>
  );
}

/** Large card: a key figure with photo, role, why-line and contact. */
function KeyCard({ node, why }: { node: OrgChartNode; why: string }) {
  return (
    <li className="border-ink bg-cream-soft shadow-paper-sm border p-4">
      <p className="text-label text-jersey-deep font-mono uppercase">
        {node.title}
      </p>
      <p className="text-body-sm text-ink-muted mt-1">{why}</p>
      {node.members.length === 0 ? (
        <Link
          href="/club/contact"
          className="text-jersey-deep text-body-sm mt-3 block font-semibold underline"
        >
          plek vrij — iets voor jou?
        </Link>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {node.members.map((m) => (
            <li key={m.id} className="flex items-start gap-3">
              <RoundAvatar
                size={64}
                name={m.name}
                photoUrl={m.imageUrl}
                className="shrink-0"
              />
              <div className="flex min-w-0 flex-col gap-1">
                <Name
                  m={m}
                  className="font-display text-ink text-xl font-bold"
                />
                <Contact m={m} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

function KeyGroup({
  label,
  group,
  nodes,
}: {
  label: string;
  group: "dagelijks" | "aanspreek";
  nodes: OrgChartNode[];
}) {
  return (
    <section aria-label={label} className="flex flex-col gap-4">
      <MonoLabel variant="pill-ink" size="sm">
        {label}
      </MonoLabel>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {keyFigures(nodes, group).map((k) => (
          <KeyCard key={k.code} node={k.node} why={k.why} />
        ))}
      </ul>
    </section>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-label text-ink-muted mt-2 font-mono font-semibold uppercase">
      {children}
    </p>
  );
}

/** Key-figure cards + board line; reused by A7. */
export function KeyCards({ nodes }: { nodes: OrgChartNode[] }) {
  const boardSeat = nodes.find((n) => n.roleCode === "BST");
  return (
    <div className="flex flex-col gap-12">
      <KeyGroup label="Dagelijks bestuur" group="dagelijks" nodes={nodes} />
      <KeyGroup label="Aanspreekpunten" group="aanspreek" nodes={nodes} />
      <div className="-mt-6 flex flex-col items-start gap-2">
        {boardSeat && boardSeat.members.length > 0 && (
          <p className="text-body-sm text-ink-muted">
            <span className="text-ink font-semibold">Raad van bestuur: </span>
            {boardSeat.members.map((m) => m.name).join(", ")}
          </p>
        )}
        <BoardLink board="hoofdbestuur" />
      </div>
    </div>
  );
}

export function VariantA5({ nodes }: { nodes: OrgChartNode[] }) {
  const overig = seatsIn(nodes, "overig");

  return (
    <div data-testid="proto-variant-a5" className="flex flex-col gap-12">
      <KeyCards nodes={nodes} />

      {PILLARS.map((p) => {
        const board = boardIn(
          nodes,
          p.key === "jeugd" ? "jeugd-organisatie" : p.key,
        );
        const boardAll =
          p.key === "jeugd"
            ? [
                ...board,
                ...boardIn(nodes, "jeugd-opleiding").filter(
                  (m) => !board.some((b) => b.id === m.id),
                ),
              ]
            : board;
        return (
          <section
            key={p.key}
            aria-label={p.title}
            className="border-ink flex flex-col gap-3 border-t-2 pt-5"
          >
            <h3 className="font-display text-ink text-2xl font-bold">
              {p.title}
            </h3>
            <p className="text-ink-muted text-sm">{p.purpose}</p>
            {boardAll.length > 0 && (
              <p className="text-body-sm text-ink">
                <span className="font-semibold">In het bestuur: </span>
                {boardAll.map((m) => m.name).join(", ")}
              </p>
            )}
            {p.key === "jeugd" && (
              <BoardLink board="jeugdbestuur" className="self-start" />
            )}
            {p.key === "jeugd" ? (
              <>
                <Sub>Organisatie · jeugdbestuur</Sub>
                <Cards seats={seatsIn(nodes, "jeugd-organisatie")} />
                <Sub>Opleiding · per leeftijd</Sub>
                <Cards seats={seatsIn(nodes, "jeugd-opleiding")} />
              </>
            ) : (
              <Cards seats={pillarSeats(nodes, p.key)} />
            )}
          </section>
        );
      })}

      {overig.length > 0 && (
        <section aria-label="Niet ingedeeld" className="flex flex-col gap-3">
          <Sub>Nog niet ingedeeld (prototype)</Sub>
          <Cards seats={overig} />
        </section>
      )}
    </div>
  );
}
