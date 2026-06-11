import type { OrgChartNode } from "@/types/organigram";
import { cn } from "@/lib/utils/cn";
import { MonoLabel } from "@/components/design-system";
import { OrgPersonCard } from "@/components/organigram/OrgPersonCard";

/**
 * `<StructureDirectory>` — the Phase 7 `/hulp` "Structuur" browse (design lock
 * `7o2` view model).
 *
 * The calm, single-scroll people directory: every active organigram position
 * grouped by **afdeling** (Hoofdbestuur · Jeugdbestuur · Algemeen) and rendered
 * as an `<OrgPersonCard>` (single / shared / vacant). Every position is shown —
 * no per-afdeling cap (an arbitrary "first N" read as a featured subset, #2054
 * owner review); navigation lives in the explorer + the clickable full chart, so
 * the directory's job is simply to list everyone honestly.
 *
 * Data only: vacant cards are the real 0-members positions, never fabricated.
 */

export interface StructureDirectoryProps {
  /**
   * All organigram positions (the `StaffRepository.findAll()` shape). The
   * synthetic "club" root node is filtered out internally.
   */
  nodes: OrgChartNode[];
  /** Forwarded to each vacant card's recruit CTA. */
  vacantCtaHref?: string;
  /**
   * Render each card as a focusable `<button>` that opens the
   * `<MemberDetailPanel>` (Phase 4, #2055). The hub passes this so its single
   * click-delegation listener can drive the panel; standalone/presentational
   * usage (default) keeps the inert `<article>` cards.
   */
  interactive?: boolean;
  className?: string;
}

interface DirectoryGroup {
  key: "hoofdbestuur" | "jeugdbestuur" | "algemeen";
  label: string;
  nodes: OrgChartNode[];
}

const DEPARTMENT_ORDER = [
  { key: "hoofdbestuur", label: "Hoofdbestuur" },
  { key: "jeugdbestuur", label: "Jeugdbestuur" },
  { key: "algemeen", label: "Algemeen" },
] as const;

/**
 * Narrow a raw department string to a known afdeling key. `department` is cast
 * from Sanity in the repository, so an unexpected value could reach us at
 * runtime — fold those into "Algemeen" rather than letting the position vanish.
 */
function isKnownDepartment(value: string): value is DirectoryGroup["key"] {
  return DEPARTMENT_ORDER.some((entry) => entry.key === value);
}

/**
 * Group positions by afdeling in the locked display order, dropping the
 * synthetic "club" root and any empty afdeling. Incoming order (GROQ
 * `sortOrder` → `title`) is preserved within each group. Positions with no
 * department fold into "Algemeen".
 */
export function groupByDepartment(nodes: OrgChartNode[]): DirectoryGroup[] {
  const buckets = new Map<DirectoryGroup["key"], OrgChartNode[]>();

  for (const node of nodes) {
    if (node.id === "club") continue; // synthetic root, never a directory card
    const raw = node.department ?? "algemeen";
    const dept: DirectoryGroup["key"] = isKnownDepartment(raw)
      ? raw
      : "algemeen";
    const list = buckets.get(dept) ?? [];
    list.push(node);
    buckets.set(dept, list);
  }

  return DEPARTMENT_ORDER.map(({ key, label }) => ({
    key,
    label,
    nodes: buckets.get(key) ?? [],
  })).filter((group) => group.nodes.length > 0);
}

export function StructureDirectory({
  nodes,
  vacantCtaHref,
  interactive = false,
  className,
}: StructureDirectoryProps) {
  const groups = groupByDepartment(nodes);
  if (groups.length === 0) return null;

  return (
    <div
      data-testid="structure-directory"
      className={cn("flex flex-col gap-10", className)}
    >
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label}>
          <h3 className="flex flex-wrap items-center gap-3">
            <MonoLabel variant="pill-ink" size="sm">
              {group.label}
            </MonoLabel>
            <span
              aria-hidden="true"
              className="text-ink-muted font-mono text-[10px] tracking-[0.06em] uppercase"
            >
              {group.nodes.length}{" "}
              {group.nodes.length === 1 ? "functie" : "functies"}
            </span>
          </h3>
          <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
            {group.nodes.map((node) => (
              <OrgPersonCard
                key={node.id}
                node={node}
                interactive={interactive}
                {...(vacantCtaHref ? { vacantCtaHref } : {})}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
