"use client";

/**
 * Category metadata for the `<HulpFinder>` (design lock 7o6c, decision 1).
 *
 * Client-only: holds Phosphor Fill icon component references (`@phosphor-icons/
 * react` calls `createContext` at module eval, which is absent under the RSC
 * `react-server` condition). Re-exported via the finder barrel, so the boundary
 * keeps the server build from evaluating Phosphor.
 *
 * Maps the 6 `ResponsibilityPath` categories to a Dutch label, a **Phosphor
 * Fill** icon (redesign canonical, via `@/lib/icons.redesign`), and a restrained
 * fanzine accent. Default glyphs are **ink**; **Medisch alone** carries the
 * in-palette **`brick` (`text-alert`)** accent — the one colour break that
 * signals the highest-stakes category, not decoration. The generic
 * `text-red-600 / text-green-600 / …` map (legacy `getCategoryInfo`) is retired
 * for the finder; `getCategoryInfo` keeps only its `label` for `<HubSearch>`.
 */

import {
  FileText,
  FirstAid,
  Handshake,
  Info,
  ShieldCheck,
  SoccerBall,
  type RedesignIconProps,
} from "@/lib/icons.redesign";
import type { ComponentType } from "react";
import type { ResponsibilityPath } from "@/types/responsibility";

export type CategoryKey = ResponsibilityPath["category"];

/** `brick` = the in-palette alert accent reserved for Medisch (7o6c · 1). */
export type CategoryAccent = "ink" | "brick";

export interface CategoryMeta {
  label: string;
  icon: ComponentType<RedesignIconProps>;
  accent: CategoryAccent;
}

export const CATEGORY_META: Record<CategoryKey, CategoryMeta> = {
  medisch: { label: "Medisch", icon: FirstAid, accent: "brick" },
  sportief: { label: "Sportief", icon: SoccerBall, accent: "ink" },
  administratief: { label: "Administratief", icon: FileText, accent: "ink" },
  gedrag: { label: "Gedrag", icon: ShieldCheck, accent: "ink" },
  algemeen: { label: "Algemeen", icon: Info, accent: "ink" },
  commercieel: { label: "Commercieel", icon: Handshake, accent: "ink" },
};

/** Display order for browse — Medisch first (highest-stakes). */
export const CATEGORY_ORDER: ReadonlyArray<CategoryKey> = [
  "medisch",
  "sportief",
  "administratief",
  "gedrag",
  "algemeen",
  "commercieel",
];

/** Glyph colour per accent — `brick` = `text-alert` (semantic redesign alert). */
export const ACCENT_GLYPH_CLASS: Record<CategoryAccent, string> = {
  ink: "text-ink",
  brick: "text-alert",
};

/**
 * Group a flat list of paths by category, keyed by `CategoryKey` with matching
 * paths in their original input order. Empty categories get an empty array.
 */
export function groupPathsByCategory(
  paths: ReadonlyArray<ResponsibilityPath>,
): Record<CategoryKey, ResponsibilityPath[]> {
  const grouped = {} as Record<CategoryKey, ResponsibilityPath[]>;
  for (const cat of CATEGORY_ORDER) grouped[cat] = [];
  for (const path of paths) grouped[path.category].push(path);
  return grouped;
}
