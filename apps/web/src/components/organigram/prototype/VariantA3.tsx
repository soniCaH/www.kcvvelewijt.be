// PROTOTYPE — throwaway. A3 "Per pijler": key figures on top, then one pillar at a time behind chip-styled tabs, contact always visible.
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { OrgChartMember, OrgChartNode } from "@/types/organigram";
import { RoundAvatar } from "@/components/design-system";
import { BoardLink } from "./BoardLink";
import {
  PILLARS,
  boardIn,
  keyFigures,
  mergeSolo,
  pillarSeats,
  seatsIn,
  type KeyGroup,
} from "./pillars";

const CHIP =
  "border-2 border-ink font-mono font-semibold uppercase px-3 py-2 text-label whitespace-nowrap transition-[translate,box-shadow,background-color,color] duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none";

/** Mail / phone on one line, or the fallback when a person has neither. */
function Reach({ m }: { m: OrgChartMember }) {
  if (!m.email && !m.phone)
    return (
      <span className="text-ink-muted text-body-sm">
        Via{" "}
        <Link href="/club/contact" className="underline">
          het clubsecretariaat
        </Link>
      </span>
    );
  return (
    <span className="text-body-sm flex flex-wrap gap-x-4 gap-y-1">
      {m.email && (
        <a
          href={`mailto:${m.email}`}
          className="text-jersey-deep break-all underline"
        >
          {m.email}
        </a>
      )}
      {m.phone && (
        <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="underline">
          {m.phone}
        </a>
      )}
    </span>
  );
}

function Name({ m }: { m: OrgChartMember }) {
  return m.href ? (
    <Link href={m.href} className="text-ink font-semibold hover:underline">
      {m.name}
    </Link>
  ) : (
    <span className="text-ink font-semibold">{m.name}</span>
  );
}

function KeyGroupStrip({
  nodes,
  group,
  label,
}: {
  nodes: OrgChartNode[];
  group: KeyGroup;
  label: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h3 className="text-jersey-deep text-label font-mono font-semibold uppercase">
        {label}
      </h3>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {keyFigures(nodes, group).map(({ code, why, node }) => {
          const m = node.members[0];
          return (
            <li key={code} className="flex min-w-0 items-start gap-3">
              <RoundAvatar
                size={40}
                name={m?.name}
                photoUrl={m?.imageUrl}
                dashed={!m}
                glyph={m ? undefined : "?"}
              />
              <div className="flex min-w-0 flex-col">
                <span className="text-ink-muted text-label-sm font-mono uppercase">
                  {node.title}
                </span>
                {m ? (
                  <Name m={m} />
                ) : (
                  <Link
                    href="/club/contact"
                    className="text-jersey-deep underline"
                  >
                    Plek vrij — iets voor jou?
                  </Link>
                )}
                <span className="text-ink-muted text-body-sm">{why}</span>
                {m && <Reach m={m} />}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SeatList({ seats }: { seats: OrgChartNode[] }) {
  return (
    <ul className="border-ink/15 flex flex-col border-t">
      {mergeSolo(seats).map(({ node, titles }) => (
        <li
          key={node.id}
          className="border-ink/15 grid grid-cols-1 gap-2 border-b py-3 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-6"
        >
          <span className="text-ink text-body-md font-semibold">
            {titles.join(" · ")}
          </span>
          {node.members.length === 0 ? (
            <span className="text-body-sm text-ink-muted">
              Plek vrij —{" "}
              <Link href="/club/contact" className="text-jersey-deep underline">
                iets voor jou?
              </Link>
            </span>
          ) : (
            <ul className="flex min-w-0 flex-col gap-3">
              {node.members.map((m) => (
                <li key={m.id} className="flex min-w-0 items-start gap-3">
                  <RoundAvatar size={24} name={m.name} photoUrl={m.imageUrl} />
                  <div className="flex min-w-0 flex-col">
                    <Name m={m} />
                    <Reach m={m} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

export function VariantA3({ nodes }: { nodes: OrgChartNode[] }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const board = nodes.find((n) => n.roleCode === "BST");

  const select = (i: number) => {
    const next = (i + PILLARS.length) % PILLARS.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <div data-testid="proto-variant-a3" className="flex flex-col gap-10">
      {/* Key figures: who to contact first */}
      <section
        aria-label="Wie spreek je aan"
        className="border-ink flex flex-col gap-6 border-b-2 pb-6"
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_3fr]">
          <KeyGroupStrip
            nodes={nodes}
            group="dagelijks"
            label="Dagelijks bestuur"
          />
          <KeyGroupStrip
            nodes={nodes}
            group="aanspreek"
            label="Aanspreekpunten"
          />
        </div>
        <div className="flex flex-col gap-2">
          {board && board.members.length > 0 && (
            <p className="text-ink-muted text-body-sm">
              Raad van bestuur: {board.members.map((m) => m.name).join(", ")}.
            </p>
          )}
          <BoardLink board="hoofdbestuur" className="self-start" />
        </div>
      </section>

      {/* One pillar at a time */}
      <section
        aria-label="De werking per pijler"
        className="flex flex-col gap-6"
      >
        <div
          role="tablist"
          aria-label="Pijlers"
          className="-mx-1 flex gap-3 overflow-x-auto px-1 pt-1 pb-2"
        >
          {PILLARS.map((p, i) => (
            <button
              key={p.key}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`a3-tab-${p.key}`}
              aria-controls={`a3-panel-${p.key}`}
              aria-selected={i === active}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") select(i + 1);
                else if (e.key === "ArrowLeft") select(i - 1);
                else if (e.key === "Home") select(0);
                else if (e.key === "End") select(PILLARS.length - 1);
                else return;
                e.preventDefault();
              }}
              className={`${CHIP} ${
                i === active
                  ? "bg-ink text-cream shadow-paper-sm-soft"
                  : "bg-cream-soft text-ink shadow-paper-sm"
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>

        {PILLARS.map((p, i) => {
          const leads = boardIn(
            nodes,
            p.key === "jeugd" ? "jeugd-organisatie" : p.key,
          );
          if (p.key === "jeugd")
            for (const m of boardIn(nodes, "jeugd-opleiding"))
              if (!leads.some((l) => l.id === m.id)) leads.push(m);
          return (
            <div
              key={p.key}
              role="tabpanel"
              id={`a3-panel-${p.key}`}
              aria-labelledby={`a3-tab-${p.key}`}
              hidden={i !== active}
              tabIndex={0}
              className="flex flex-col gap-6"
            >
              <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
                <div className="flex min-w-0 flex-col gap-2">
                  <h3 className="font-display text-ink text-display-md">
                    {p.title}
                  </h3>
                  <p className="text-ink-muted text-body-lg max-w-prose">
                    {p.purpose}
                  </p>
                  {p.key === "jeugd" && (
                    <BoardLink board="jeugdbestuur" className="self-start" />
                  )}
                </div>
                {leads.length > 0 && (
                  <div className="flex shrink-0 flex-col gap-2">
                    <span className="text-jersey-deep text-label font-mono font-semibold uppercase">
                      Vanuit het bestuur
                    </span>
                    <ul className="flex flex-wrap gap-x-5 gap-y-3">
                      {leads.map((m) => (
                        <li key={m.id} className="flex items-center gap-2">
                          <RoundAvatar
                            size={40}
                            name={m.name}
                            photoUrl={m.imageUrl}
                          />
                          <Name m={m} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </header>

              {p.key === "jeugd" ? (
                <>
                  <h4 className="text-jersey-deep text-label font-mono font-semibold uppercase">
                    Organisatie · jeugdbestuur
                  </h4>
                  <SeatList seats={seatsIn(nodes, "jeugd-organisatie")} />
                  <h4 className="text-jersey-deep text-label font-mono font-semibold uppercase">
                    Opleiding · per leeftijd
                  </h4>
                  <SeatList seats={seatsIn(nodes, "jeugd-opleiding")} />
                </>
              ) : (
                <SeatList seats={pillarSeats(nodes, p.key)} />
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
