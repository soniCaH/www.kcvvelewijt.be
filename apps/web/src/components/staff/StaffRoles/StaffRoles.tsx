"use client";

import Link from "next/link";
import { TapedCard } from "@/components/design-system/TapedCard";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { PageContainer } from "@/components/design-system";
import { ArrowRight } from "@/lib/icons.redesign";
import { cn } from "@/lib/utils/cn";

/**
 * `<StaffRoles>` — the locked merged "Rol & verantwoordelijkheden." section
 * (10f2) for `/staf/[slug]`. Combines two distinct data sources under one
 * `<EditorialHeading>`:
 *
 *   - Organigram positions → paper rows (roleCode `<MonoLabel>` pill + title +
 *     department). Static info, not links.
 *   - Responsibilities → an "Aanspreekpunt voor" mono sub-label followed by
 *     paper link cards that deep-link to `/hulp#<slug>` — the hash format
 *     `<HulpFinder>` reads to reveal + open the matching responsibility card
 *     (it does not read a `pad` query param) — with the canonical press-down
 *     `<TapedCard interactive="press">` hover.
 *
 * Auto-hides entirely when both lists are empty. No section-header icon —
 * the heading carries the meaning (Lucide `Network`/`CircleHelp` retired).
 *
 * Design lock: `docs/design/mockups/phase-10-staf/10f2-staf-assembled.html` (#2124).
 */

export interface StaffRolePosition {
  id: string;
  title: string;
  roleCode?: string;
  department?: string;
}

export interface StaffResponsibility {
  title: string;
  /** Deep-links to `/hulp#<slug>` (the `<HulpFinder>` hash anchor). */
  slug: string;
  category?: string;
}

export interface StaffRolesProps {
  positions: StaffRolePosition[];
  responsibilities: StaffResponsibility[];
  className?: string;
}

export function StaffRoles({
  positions,
  responsibilities,
  className,
}: StaffRolesProps) {
  if (positions.length === 0 && responsibilities.length === 0) return null;

  return (
    <PageContainer as="section" className={cn("py-12", className)}>
      <EditorialHeading
        level={2}
        size="display-md"
        emphasis={{ text: ".", tone: "warm" }}
        className="mb-6"
      >
        {"Rol & verantwoordelijkheden"}
      </EditorialHeading>

      {positions.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {positions.map((pos) => (
            <TapedCard
              key={pos.id}
              bg="cream"
              padding="sm"
              shadow="sm"
              dataAttrs={{ "data-testid": "staff-position-row" }}
              className="flex items-center gap-3"
            >
              {pos.roleCode ? (
                <MonoLabel variant="pill-jersey-deep">{pos.roleCode}</MonoLabel>
              ) : null}
              <span className="font-display text-ink font-bold">
                {pos.title}
              </span>
              {pos.department ? (
                <span className="text-ink-muted ml-auto font-mono text-[length:var(--text-mono-sm)] tracking-[0.06em] uppercase">
                  {pos.department}
                </span>
              ) : null}
            </TapedCard>
          ))}
        </div>
      ) : null}

      {responsibilities.length > 0 ? (
        <>
          <p className="text-ink-muted mt-7 mb-3 font-mono text-[length:var(--text-label)] tracking-[var(--text-label--tracking)] uppercase">
            Aanspreekpunt voor
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {responsibilities.map((resp) => (
              <Link
                key={resp.slug}
                href={`/hulp#${encodeURIComponent(resp.slug)}`}
                className="group block"
                data-testid="staff-responsibility-card"
              >
                <TapedCard
                  bg="cream"
                  padding="sm"
                  shadow="sm"
                  interactive="press"
                  className="flex items-center justify-between gap-3"
                >
                  <span className="min-w-0">
                    <span className="font-display text-ink block font-bold">
                      {resp.title}
                    </span>
                    {resp.category ? (
                      <span className="text-ink-muted mt-0.5 block font-mono text-[length:var(--text-label)] tracking-[var(--text-label--tracking)] uppercase">
                        {resp.category}
                      </span>
                    ) : null}
                  </span>
                  <ArrowRight
                    size={18}
                    className="text-jersey-deep shrink-0"
                    aria-hidden="true"
                  />
                </TapedCard>
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </PageContainer>
  );
}
