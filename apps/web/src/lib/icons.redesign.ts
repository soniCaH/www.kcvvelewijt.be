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
  ArrowsOut as PhArrowsOut,
  Bus as PhBus,
  CaretDown as PhCaretDown,
  CaretLeft as PhCaretLeft,
  CaretRight as PhCaretRight,
  CaretUp as PhCaretUp,
  CheckCircle as PhCheckCircle,
  DownloadSimple as PhDownloadSimple,
  Envelope as PhEnvelope,
  Eye as PhEye,
  FileText as PhFileText,
  FirstAid as PhFirstAid,
  Handshake as PhHandshake,
  Heart as PhHeart,
  House as PhHouse,
  Info as PhInfo,
  List as PhList,
  MagnifyingGlass as PhMagnifyingGlass,
  Phone as PhPhone,
  Question as PhQuestion,
  ShieldCheck as PhShieldCheck,
  SoccerBall as PhSoccerBall,
  Sparkle as PhSparkle,
  TreeStructure as PhTreeStructure,
  User as PhUser,
  UsersThree as PhUsersThree,
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
export const ArrowsOut = fillWrapper(PhArrowsOut);
export const Bus = fillWrapper(PhBus);
export const CaretDown = fillWrapper(PhCaretDown);
export const CaretLeft = fillWrapper(PhCaretLeft);
export const CaretRight = fillWrapper(PhCaretRight);
export const CaretUp = fillWrapper(PhCaretUp);
export const CheckCircle = fillWrapper(PhCheckCircle);
export const DownloadSimple = fillWrapper(PhDownloadSimple);
export const Envelope = fillWrapper(PhEnvelope);
export const Eye = fillWrapper(PhEye);
export const FileText = fillWrapper(PhFileText);
export const FirstAid = fillWrapper(PhFirstAid);
export const Handshake = fillWrapper(PhHandshake);
export const Heart = fillWrapper(PhHeart);
export const House = fillWrapper(PhHouse);
export const Info = fillWrapper(PhInfo);
export const List = fillWrapper(PhList);
export const MagnifyingGlass = fillWrapper(PhMagnifyingGlass);
export const Phone = fillWrapper(PhPhone);
export const Question = fillWrapper(PhQuestion);
export const ShieldCheck = fillWrapper(PhShieldCheck);
export const SoccerBall = fillWrapper(PhSoccerBall);
export const Sparkle = fillWrapper(PhSparkle);
export const TreeStructure = fillWrapper(PhTreeStructure);
export const User = fillWrapper(PhUser);
export const UsersThree = fillWrapper(PhUsersThree);
export const Warning = fillWrapper(PhWarning);
export const WarningCircle = fillWrapper(PhWarningCircle);
export const X = fillWrapper(PhX);

export type { Icon };
