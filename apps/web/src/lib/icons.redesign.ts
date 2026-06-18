"use client";

/**
 * Icon system — Phosphor Fill. The single icon source for the whole app.
 *
 * Wrapper components default `weight="fill"` and omit `weight` from the public
 * prop type so consumers cannot accidentally render an outline / thin / regular
 * variant and break the visual contract.
 *
 * `"use client"`: `@phosphor-icons/react` calls `createContext` at module
 * evaluation, which throws in a Server Component graph. Marking this module a
 * client boundary lets Server Components (e.g. <SiteFooter>) import and render
 * these icons. The legacy Lucide module (`@/lib/icons`) was retired in #2154.
 */

import {
  ArrowDown as PhArrowDown,
  ArrowRight as PhArrowRight,
  ArrowSquareOut as PhArrowSquareOut,
  ArrowUp as PhArrowUp,
  ArrowsOut as PhArrowsOut,
  Bus as PhBus,
  Car as PhCar,
  CaretDown as PhCaretDown,
  CaretLeft as PhCaretLeft,
  CaretRight as PhCaretRight,
  CaretUp as PhCaretUp,
  CheckCircle as PhCheckCircle,
  Coffee as PhCoffee,
  DownloadSimple as PhDownloadSimple,
  Envelope as PhEnvelope,
  Eye as PhEye,
  FacebookLogo as PhFacebookLogo,
  FileText as PhFileText,
  FirstAid as PhFirstAid,
  Flag as PhFlag,
  Handshake as PhHandshake,
  Heart as PhHeart,
  House as PhHouse,
  Info as PhInfo,
  InstagramLogo as PhInstagramLogo,
  List as PhList,
  MagnifyingGlass as PhMagnifyingGlass,
  MapPin as PhMapPin,
  PaperPlaneTilt as PhPaperPlaneTilt,
  Phone as PhPhone,
  Play as PhPlay,
  Pulse as PhPulse,
  Question as PhQuestion,
  ShareNetwork as PhShareNetwork,
  ShieldCheck as PhShieldCheck,
  SoccerBall as PhSoccerBall,
  Sparkle as PhSparkle,
  Square as PhSquare,
  Swap as PhSwap,
  Ticket as PhTicket,
  Timer as PhTimer,
  TreeStructure as PhTreeStructure,
  User as PhUser,
  UsersThree as PhUsersThree,
  Warning as PhWarning,
  WarningCircle as PhWarningCircle,
  Wheelchair as PhWheelchair,
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

export const ArrowDown = fillWrapper(PhArrowDown);
export const ArrowRight = fillWrapper(PhArrowRight);
export const ArrowSquareOut = fillWrapper(PhArrowSquareOut);
export const ArrowUp = fillWrapper(PhArrowUp);
export const ArrowsOut = fillWrapper(PhArrowsOut);
export const Bus = fillWrapper(PhBus);
export const Car = fillWrapper(PhCar);
export const CaretDown = fillWrapper(PhCaretDown);
export const CaretLeft = fillWrapper(PhCaretLeft);
export const CaretRight = fillWrapper(PhCaretRight);
export const CaretUp = fillWrapper(PhCaretUp);
export const CheckCircle = fillWrapper(PhCheckCircle);
export const Coffee = fillWrapper(PhCoffee);
export const DownloadSimple = fillWrapper(PhDownloadSimple);
export const Envelope = fillWrapper(PhEnvelope);
export const Eye = fillWrapper(PhEye);
export const FacebookLogo = fillWrapper(PhFacebookLogo);
export const FileText = fillWrapper(PhFileText);
export const FirstAid = fillWrapper(PhFirstAid);
export const Flag = fillWrapper(PhFlag);
export const Handshake = fillWrapper(PhHandshake);
export const Heart = fillWrapper(PhHeart);
export const House = fillWrapper(PhHouse);
export const Info = fillWrapper(PhInfo);
export const InstagramLogo = fillWrapper(PhInstagramLogo);
export const List = fillWrapper(PhList);
export const MagnifyingGlass = fillWrapper(PhMagnifyingGlass);
export const MapPin = fillWrapper(PhMapPin);
export const PaperPlaneTilt = fillWrapper(PhPaperPlaneTilt);
export const Phone = fillWrapper(PhPhone);
export const Play = fillWrapper(PhPlay);
export const Pulse = fillWrapper(PhPulse);
export const Question = fillWrapper(PhQuestion);
export const ShareNetwork = fillWrapper(PhShareNetwork);
export const ShieldCheck = fillWrapper(PhShieldCheck);
export const SoccerBall = fillWrapper(PhSoccerBall);
export const Sparkle = fillWrapper(PhSparkle);
export const Square = fillWrapper(PhSquare);
export const Swap = fillWrapper(PhSwap);
export const Ticket = fillWrapper(PhTicket);
export const Timer = fillWrapper(PhTimer);
export const TreeStructure = fillWrapper(PhTreeStructure);
export const User = fillWrapper(PhUser);
export const UsersThree = fillWrapper(PhUsersThree);
export const Warning = fillWrapper(PhWarning);
export const WarningCircle = fillWrapper(PhWarningCircle);
export const Wheelchair = fillWrapper(PhWheelchair);
export const X = fillWrapper(PhX);

export type { Icon };
