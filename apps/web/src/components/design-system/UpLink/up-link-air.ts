import type { UpLinkTone } from "./UpLink";

// A plain module, not an export of the 'use client' <UpLink>: <PageHeroSkeleton> is a Server
// Component, and a value it reads from a client file arrives as a client reference.
// `ink` also carries the chip's own top air (#2877): 48px at base, 64px from
// `lg` up. Every route used to supply this itself via its own container
// padding, and the values drifted (32px / 48px / 48→64px / 56→80px, plus
// further undocumented values on routes PageHero also opens, e.g. `pt-10`,
// `pt-8`, `pt-12 sm:pt-16`) because #2570 mounted the chip inside whatever
// container each route already had. The shared opening already owns the gap
// *below* itself for exactly this reason (see `<PageHero>`'s own `mb-10`
// comment) — this is the same move, one line higher up. `cream` gains none:
// it only ever renders inside a dark opening band, whose own padding is
// already the air.
//
// Exported as a map, not a string, so `<PageHeroSkeleton>`'s shimmer up-link
// (the one route whose label is data, not fixed copy) asks this file which
// tone gets air instead of holding its own copy of that rule (#2877 review
// round 2): a bare string would still let the two files disagree about
// *which* tone the value belongs to, even while sharing the value itself.
export const UP_LINK_TOP_AIR: Record<UpLinkTone, string> = {
  ink: "mt-12 lg:mt-16",
  cream: "",
};
