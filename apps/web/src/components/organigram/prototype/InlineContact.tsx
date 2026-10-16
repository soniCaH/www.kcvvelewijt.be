// PROTOTYPE — throwaway. Contact opens IN PLACE (native <details>), replacing
// the right-hand side panel. No `data-member-card`, so the hub's panel never
// opens from these rows.
import Link from "next/link";
import type { OrgChartNode } from "@/types/organigram";

/** The contact lines for every holder of a seat. Vacant → recruit line. */
export function ContactLines({ node }: { node: OrgChartNode }) {
  if (node.members.length === 0)
    return (
      <p className="text-body-sm text-ink">
        Deze plek is vrij.{" "}
        <Link href="/club/contact" className="text-jersey-deep underline">
          Iets voor jou? Laat het ons weten
        </Link>
      </p>
    );
  return (
    <ul className="flex flex-col gap-2">
      {node.members.map((m) => (
        <li key={m.id} className="text-body-sm text-ink flex flex-col">
          {node.members.length > 1 && (
            <span className="font-semibold">{m.name}</span>
          )}
          {m.email && (
            <a
              href={`mailto:${m.email}`}
              className="text-jersey-deep underline"
            >
              {m.email}
            </a>
          )}
          {m.phone && (
            <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="underline">
              {m.phone}
            </a>
          )}
          {m.href && (
            <Link href={m.href} className="text-ink-muted underline">
              Volledig profiel →
            </Link>
          )}
          {!m.email && !m.phone && !m.href && (
            <span className="text-ink-muted">
              Geen rechtstreeks contact — via{" "}
              <Link href="/club/contact" className="underline">
                het clubsecretariaat
              </Link>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * A row that unfolds its contact underneath. `summary` is the visible row;
 * the caller owns its design.
 */
export function InlineContact({
  node,
  summary,
  className,
  panelClassName,
}: {
  node: OrgChartNode;
  summary: React.ReactNode;
  className?: string;
  panelClassName?: string;
}) {
  return (
    <details className={`group ${className ?? ""}`}>
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        {summary}
      </summary>
      <div
        className={
          panelClassName ?? "border-jersey-deep ml-2 border-l-2 py-2 pl-4"
        }
      >
        <ContactLines node={node} />
      </div>
    </details>
  );
}
