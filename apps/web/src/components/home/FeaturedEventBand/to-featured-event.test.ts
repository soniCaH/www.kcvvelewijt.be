import { describe, it, expect } from "vitest";
import type { EventVM } from "@/lib/repositories/event.repository";
import { toFeaturedEventBandEvent } from "./to-featured-event";

/** Only the fields the mapper reads; the rest of the VM is structural. */
const event = (p: Partial<EventVM> = {}): EventVM => {
  return {
    id: "event-1",
    title: "Mosselfestijn",
    slug: "mosselfestijn",
    dateStart: "2026-09-12T18:00:00Z",
    dateEnd: null,
    eventType: null,
    location: null,
    coverImageUrl: "https://cdn.example/cover.jpg",
    href: "#",
    featuredOnHome: true,
    ...p,
  } as unknown as EventVM;
};

describe("toFeaturedEventBandEvent", () => {
  // #2392: the CMS `location` reached the VM but never the band, so an editor's
  // real venue was overwritten by the "Kantine" default on every event.
  it("forwards the CMS location", () => {
    const vm = toFeaturedEventBandEvent(
      event({ location: "Sportpark Driesput, Elewijt" }),
    );
    expect(vm?.location).toBe("Sportpark Driesput, Elewijt");
  });

  it("returns null for no event or a missing start date", () => {
    expect(toFeaturedEventBandEvent(null)).toBe(null);
    expect(toFeaturedEventBandEvent(event({ dateStart: "" }))).toBe(null);
  });

  it("maps the cover image and drops it when the URL is absent", () => {
    expect(toFeaturedEventBandEvent(event())?.coverImage).toEqual({
      url: "https://cdn.example/cover.jpg",
      alt: "Mosselfestijn",
    });
    expect(
      toFeaturedEventBandEvent(event({ coverImageUrl: null }))?.coverImage,
    ).toBe(null);
  });

  it("treats placeholder hrefs as no external link", () => {
    expect(toFeaturedEventBandEvent(event({ href: "#" }))?.externalLink).toBe(
      null,
    );
    expect(toFeaturedEventBandEvent(event({ href: "" }))?.externalLink).toBe(
      null,
    );
    expect(
      toFeaturedEventBandEvent(event({ href: "https://tickets.example" }))
        ?.externalLink,
    ).toEqual({ url: "https://tickets.example", label: null });
  });
});
