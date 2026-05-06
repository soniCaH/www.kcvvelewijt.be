/**
 * Redesign icon system — Phosphor Fill.
 *
 * Used by Phase 2+ atoms on redesign surfaces. Wrapper components default
 * `weight="fill"` and omit `weight` from the public prop type so consumers
 * cannot accidentally render an outline / thin / regular variant and break
 * the visual contract.
 *
 * Dual-coexistence with `@/lib/icons` (Lucide): legacy components keep
 * importing from there until their own redesign phase. See PRD §6.6.
 */

import {
  ArrowRight as PhArrowRight,
  CaretDown as PhCaretDown,
  CaretLeft as PhCaretLeft,
  CaretRight as PhCaretRight,
  CheckCircle as PhCheckCircle,
  Heart as PhHeart,
  List as PhList,
  MagnifyingGlass as PhMagnifyingGlass,
  Warning as PhWarning,
  WarningCircle as PhWarningCircle,
  X as PhX,
  type Icon,
  type IconProps,
} from "@phosphor-icons/react";
import { createElement, type ComponentType } from "react";

export type RedesignIconProps = Omit<IconProps, "weight">;

const fillWrapper = (PhIcon: ComponentType<IconProps>) => {
  const Wrapped = (props: RedesignIconProps) =>
    createElement(PhIcon, { ...props, weight: "fill" });
  Wrapped.displayName = `Fill(${PhIcon.displayName ?? PhIcon.name ?? "Icon"})`;
  return Wrapped;
};

export const ArrowRight = fillWrapper(PhArrowRight);
export const CaretDown = fillWrapper(PhCaretDown);
export const CaretLeft = fillWrapper(PhCaretLeft);
export const CaretRight = fillWrapper(PhCaretRight);
export const CheckCircle = fillWrapper(PhCheckCircle);
export const Heart = fillWrapper(PhHeart);
export const List = fillWrapper(PhList);
export const MagnifyingGlass = fillWrapper(PhMagnifyingGlass);
export const Warning = fillWrapper(PhWarning);
export const WarningCircle = fillWrapper(PhWarningCircle);
export const X = fillWrapper(PhX);

export type { Icon };
