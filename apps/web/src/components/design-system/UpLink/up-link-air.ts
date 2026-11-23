import type { UpLinkTone } from "./UpLink";

// A plain module, not an export of the 'use client' <UpLink>: <PageHeroSkeleton> is a Server
// Component, and a value it reads from a client file arrives as a client reference (#3839).
// `ink` carries the chip's own top air (#2877); `cream` sits inside a dark band whose padding
// is already the air.
export const UP_LINK_TOP_AIR: Record<UpLinkTone, string> = {
  ink: "mt-12 lg:mt-16",
  cream: "",
};
