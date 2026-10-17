/**
 * The viewer (`yet-another-react-lightbox`, its plugins and CSS) is a lazy
 * chunk (#3480): nothing loads with the gallery, the import starts on
 * thumbnail hover/focus, and the first click opens the viewer once it lands.
 * Its own file because a module loads once per file — the "not yet loaded"
 * assertions only hold before anything in the file has opened a viewer.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { LightboxProps } from "yet-another-react-lightbox";
import { GalleryLightbox } from "./GalleryLightbox";

// The factory runs when the module is first imported, so it counts loads.
const lightbox = vi.hoisted(() => ({
  loads: 0,
  props: null as unknown,
}));
vi.mock("yet-another-react-lightbox", () => {
  lightbox.loads += 1;
  return {
    default: (props: unknown) => {
      lightbox.props = props;
      return null;
    },
  };
});
// Plugins, CSS and the shared chrome (its Spinner pulls in the whole design
// system) are pinned in GalleryLightbox.test.tsx; stubbing them here keeps the
// cold import of the viewer cheap enough for the test budget.
vi.mock("../lightbox-chrome", () => ({
  LIGHTBOX_ANIMATION: {},
  LIGHTBOX_BACKDROP: {},
  lightboxLoadingIcon: () => null,
}));
vi.mock("yet-another-react-lightbox/plugins/thumbnails", () => ({
  default: {},
}));
vi.mock("yet-another-react-lightbox/plugins/zoom", () => ({ default: {} }));
vi.mock("yet-another-react-lightbox/plugins/captions", () => ({ default: {} }));
vi.mock("yet-another-react-lightbox/styles.css", () => ({}));
vi.mock("yet-another-react-lightbox/plugins/thumbnails.css", () => ({}));
vi.mock("yet-another-react-lightbox/plugins/captions.css", () => ({}));
vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

const IMAGES = [
  { url: "https://cdn.sanity.io/images/p/d/a.jpg", caption: "Eerste" },
  { url: "https://cdn.sanity.io/images/p/d/b.jpg", caption: "Tweede" },
];

describe("GalleryLightbox lazy viewer (#3480)", () => {
  it("loads the viewer on keyboard focus, mounts it on the first click and keeps it mounted", async () => {
    render(<GalleryLightbox gallerySlug="zemst-derby" images={IMAGES} />);

    // Initial load: no viewer module, nothing mounted.
    expect(lightbox.loads).toBe(0);
    expect(lightbox.props).toBeNull();

    const second = screen.getByRole("button", { name: /Foto 2 van 2/ });
    // Focus and pointer-enter share one preload handler; focus is the one a
    // keyboard visitor depends on.
    fireEvent.focus(second);
    await waitFor(() => expect(lightbox.loads).toBe(1));
    // Warming the chunk opens nothing.
    expect(lightbox.props).toBeNull();

    fireEvent.click(second);
    await waitFor(() => expect(lightbox.props).not.toBeNull());
    expect(lightbox.props).toMatchObject({ open: true, index: 1 });

    // Closing keeps the viewer mounted so it can animate out.
    (lightbox.props as LightboxProps).close?.();
    await waitFor(() => expect(lightbox.props).toMatchObject({ open: false }));
  });
});
