"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Users } from "@/lib/icons";
import type {
  RelatedPlayerItem,
  RelatedTeamItem,
  RelatedStaffItem,
} from "../types";

export type MentionedEntity =
  | RelatedPlayerItem
  | RelatedTeamItem
  | RelatedStaffItem;

export interface MentionedEntitiesStripProps {
  entities: MentionedEntity[];
  className?: string;
  /**
   * Fired when an entity card is clicked. Position is 1-indexed within the
   * strip. Staff entities without a route never fire — they render as a
   * non-interactive div.
   */
  onEntityClick?: (entity: MentionedEntity, position: number) => void;
}

const TYPE_LABEL: Record<MentionedEntity["type"], string> = {
  player: "Speler",
  team: "Ploeg",
  staff: "Staf",
};

function getHref(entity: MentionedEntity): string | null {
  switch (entity.type) {
    case "player":
      return `/spelers/${entity.psdId}`;
    case "team":
      return `/ploegen/${entity.slug}`;
    case "staff":
      return null;
  }
}

function getName(entity: MentionedEntity): string {
  switch (entity.type) {
    case "player":
    case "staff":
      return [entity.firstName, entity.lastName].filter(Boolean).join(" ");
    case "team":
      return entity.name;
  }
}

function getMeta(entity: MentionedEntity): string | null {
  switch (entity.type) {
    case "player":
      return entity.position;
    case "team":
      return entity.tagline;
    case "staff":
      return entity.role;
  }
}

function getInitials(entity: MentionedEntity): string {
  const name = getName(entity);
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (
    parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)
  ).toUpperCase();
}

function Thumbnail({ entity }: { entity: MentionedEntity }) {
  const isTeam = entity.type === "team";

  if (entity.imageUrl) {
    return (
      <div className="bg-kcvv-green-dark/10 relative aspect-square h-full flex-shrink-0 overflow-hidden">
        <Image
          src={entity.imageUrl}
          alt=""
          fill
          className={cn(
            "transition-transform duration-300 group-hover:scale-105",
            isTeam ? "object-cover" : "object-cover object-top",
          )}
          sizes="80px"
        />
      </div>
    );
  }

  if (isTeam) {
    return (
      <div className="bg-kcvv-green-dark relative flex aspect-square h-full flex-shrink-0 items-center justify-center">
        <Users
          className="text-kcvv-green-bright h-7 w-7"
          strokeWidth={2}
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div className="bg-kcvv-green-dark relative flex aspect-square h-full flex-shrink-0 items-center justify-center">
      <span className="text-kcvv-green-bright text-base font-extrabold tracking-wider">
        {getInitials(entity)}
      </span>
    </div>
  );
}

function EntityCard({
  entity,
  onClick,
}: {
  entity: MentionedEntity;
  onClick?: () => void;
}) {
  const href = getHref(entity);
  const name = getName(entity);
  const meta = getMeta(entity);

  const inner = (
    <>
      <div
        className="bg-kcvv-green-bright pointer-events-none absolute inset-x-0 top-0 z-20 h-[2px] transition-[clip-path] duration-300 ease-out [clip-path:inset(0_50%)] group-hover:[clip-path:inset(0_0%)]"
        aria-hidden="true"
      />
      <Thumbnail entity={entity} />
      <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2">
        <span className="text-kcvv-green-dark mb-1 text-[10px] leading-none font-bold tracking-wider uppercase">
          {TYPE_LABEL[entity.type]}
        </span>
        <span className="text-kcvv-black truncate text-sm leading-tight font-bold">
          {name}
        </span>
        {meta && (
          <span className="text-kcvv-gray mt-0.5 truncate text-xs leading-tight">
            {meta}
          </span>
        )}
      </div>
    </>
  );

  const baseClasses =
    "group relative flex items-stretch h-20 overflow-hidden rounded-card border border-kcvv-gray-light/50 bg-white min-w-0";

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          baseClasses,
          "hover:border-kcvv-green-bright/60 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5",
        )}
      >
        {inner}
      </Link>
    );
  }

  return <div className={baseClasses}>{inner}</div>;
}

export const MentionedEntitiesStrip = ({
  entities,
  className,
  onEntityClick,
}: MentionedEntitiesStripProps) => {
  if (entities.length === 0) return null;

  return (
    <section className={cn("w-full", className)}>
      <header className="mb-4">
        <h3 className="border-kcvv-green-bright text-kcvv-green-dark border-l-2 pl-2 text-xs font-bold tracking-wider uppercase">
          In dit artikel
        </h3>
      </header>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {entities.map((entity, index) => (
          <EntityCard
            key={entity.id}
            entity={entity}
            onClick={
              onEntityClick ? () => onEntityClick(entity, index + 1) : undefined
            }
          />
        ))}
      </div>
    </section>
  );
};
