"use client";

import type { ComponentType } from "react";
import { cn } from "@/lib/utils/cn";
import {
  DownloadSimple,
  Eye,
  FirstAid,
  Heart,
  House,
  Info,
  MagnifyingGlass,
  SoccerBall,
  Ticket,
  TreeStructure,
  UsersThree,
  type RedesignIconProps,
} from "@/lib/icons.redesign";

const NAV_GLYPHS = {
  DownloadSimple,
  Eye,
  FirstAid,
  Heart,
  House,
  Info,
  MagnifyingGlass,
  SoccerBall,
  Ticket,
  TreeStructure,
  UsersThree,
} satisfies Record<string, ComponentType<RedesignIconProps>>;

export type NavGlyphName = keyof typeof NAV_GLYPHS;

export interface NavGlyphProps {
  name: NavGlyphName;
  className?: string;
}

/**
 * <NavGlyph> — renders a redesign nav glyph (Phosphor-fill) by name, defaulting
 * to cream for the jersey-deep nav panel. A thin `"use client"` boundary so
 * server components (`<EditorialHubCard>`, the nav-hub grid) can request a glyph
 * without importing `@phosphor-icons/react`, which calls `createContext` at
 * module scope and is therefore client-only.
 */
export function NavGlyph({ name, className }: NavGlyphProps) {
  const Icon = NAV_GLYPHS[name];
  return (
    <Icon
      size={40}
      className={cn("text-cream", className)}
      aria-hidden="true"
    />
  );
}
