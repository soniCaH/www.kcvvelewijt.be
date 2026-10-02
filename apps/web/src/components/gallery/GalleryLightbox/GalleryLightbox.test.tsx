import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { LightboxProps } from "yet-another-react-lightbox";
import { GalleryLightbox } from "./GalleryLightbox";

// The library draws on a portal and measures layout; what this component owns
// is the props it hands over, so capture those at the module boundary.
const lightboxProps = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("yet-another-react-lightbox", () => ({
  default: (props: unknown) => {
    lightboxProps.current = props;
    return null;
  },
}));

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

const IMAGES = [{ url: "https://cdn.sanity.io/images/p/d/a.jpg" }];

const renderLightbox = (): LightboxProps => {
  render(<GalleryLightbox gallerySlug="zemst-derby" images={IMAGES} />);
  return lightboxProps.current as LightboxProps;
};

// DESIGN.md → Motion: Arrival (500ms) and The Curve.
const THE_CURVE = "cubic-bezier(0, 0, 0.58, 1)";

describe("GalleryLightbox motion (#3383)", () => {
  it("moves at Arrival speed on The Curve for open/close, swipe and navigation", () => {
    const { animation } = renderLightbox();

    expect(animation).toEqual({
      fade: 500,
      swipe: 500,
      navigation: 500,
      easing: { fade: THE_CURVE, swipe: THE_CURVE, navigation: THE_CURVE },
    });
  });

  it("waits with the compact Spinner, not the library's own icon", () => {
    const { render: slots } = renderLightbox();

    const { container } = render(<>{slots?.iconLoading?.() as ReactNode}</>);

    expect(container.querySelector('[role="status"]')).not.toBeNull();
    expect(container.querySelector(".kcvv-spinner-pulse")).not.toBeNull();
    expect(container.querySelector(".kcvv-spinner-scarf")).toBeNull();
  });
});
