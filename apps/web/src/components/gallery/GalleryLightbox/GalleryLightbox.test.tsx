import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { LightboxProps } from "yet-another-react-lightbox";
import { GalleryLightbox, galleryImageAlt } from "./GalleryLightbox";

// The library draws on a portal and measures layout; what this component owns
// is the props it hands over, so capture those at the module boundary.
const lightboxProps = vi.hoisted(() => ({ current: null as unknown }));
vi.mock("yet-another-react-lightbox", () => ({
  default: (props: unknown) => {
    lightboxProps.current = props;
    return null;
  },
}));

/**
 * Rule 5 of #2548: a gallery photo is the site's one genuinely alone image, so
 * it says position and extent. `/galerij/[slug]` shipped 55 images reading
 * `Foto 1` … `Foto 55` — an index with nothing to index into.
 */
describe("galleryImageAlt", () => {
  it("says position and extent when nothing is authored", () => {
    expect(galleryImageAlt({ alt: null }, 11, 55)).toBe("Foto 12 van 55");
  });

  it("counts from one, not from zero", () => {
    expect(galleryImageAlt({ alt: null }, 0, 55)).toBe("Foto 1 van 55");
    expect(galleryImageAlt({ alt: null }, 54, 55)).toBe("Foto 55 van 55");
  });

  it("lets an authored alt override the derived string", () => {
    expect(galleryImageAlt({ alt: "Julien kopt binnen" }, 3, 55)).toBe(
      "Julien kopt binnen",
    );
  });

  it("falls back when the authored alt is blank or whitespace", () => {
    expect(galleryImageAlt({ alt: "" }, 3, 55)).toBe("Foto 4 van 55");
    expect(galleryImageAlt({ alt: "   " }, 3, 55)).toBe("Foto 4 van 55");
    expect(galleryImageAlt({}, 3, 55)).toBe("Foto 4 van 55");
  });

  it("never names the collection — the page's h1 already does", () => {
    expect(galleryImageAlt({ alt: null }, 0, 3)).not.toMatch(/galerij|fotos/i);
  });
});

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

  it("writes The Curve exactly as globals.css declares --ease-out", () => {
    // Swipe and navigation easing go to `Element.animate()`, which rejects
    // `var()` — so the literal is repeated here and pinned to the token.
    const css = readFileSync(
      join(__dirname, "../../../app/globals.css"),
      "utf8",
    ).replace(/\/\*[\s\S]*?\*\//g, "");
    const token = css.match(/--ease-out:\s*([^;]+);/)?.[1];

    const { easing } = renderLightbox().animation ?? {};

    expect(token).toBeDefined();
    expect([easing?.fade, easing?.swipe, easing?.navigation]).toEqual([
      token,
      token,
      token,
    ]);
  });

  it("waits with the compact Spinner, not the library's own icon", () => {
    const { render: slots } = renderLightbox();

    const { container } = render(<>{slots?.iconLoading?.() as ReactNode}</>);

    expect(container.querySelector('[role="status"]')).not.toBeNull();
    expect(container.querySelector(".kcvv-spinner-pulse")).not.toBeNull();
    expect(container.querySelector(".kcvv-spinner-scarf")).toBeNull();
  });

  it("shows the waiting device after the library's delay and announces nothing", () => {
    const { render: slots } = renderLightbox();

    const { container } = render(<>{slots?.iconLoading?.() as ReactNode}</>);
    const wrapper = container.firstElementChild;

    // `yarl__slide_loading` carries the library's ~800ms delayed fade-in
    // (and drops it under reduced motion), so a fast load never flashes dots.
    expect(wrapper).toHaveClass("yarl__slide_loading");
    expect(wrapper).toHaveAttribute("aria-hidden", "true");
    expect(wrapper?.querySelector(".kcvv-spinner-pulse")).not.toBeNull();
  });
});
