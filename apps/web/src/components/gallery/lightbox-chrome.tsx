import { Spinner } from "@/components/design-system";

/**
 * The chrome every `yet-another-react-lightbox` on the site shares — the
 * gallery viewer and the team-photo viewer (#3447) — so the two cannot drift.
 */

// Every lightbox motion is Arrival — a photo entering the screen — on The
// Curve (DESIGN.md → Motion). The literal is `--ease-out`'s value (a test pins
// them together): the library also feeds `easing.fade` to `Element.animate()`
// (pull-to-close release), which rejects `var()`. Under
// `prefers-reduced-motion: reduce` the library itself skips the slide
// animations and zeroes the fade, so nothing is gated here. One exception no
// prop reaches: the Zoom plugin hardcodes `ease-in-out` for a fresh zoom.
const ARRIVAL_MS = 500;
const THE_CURVE = "cubic-bezier(0, 0, 0.58, 1)";
export const LIGHTBOX_ANIMATION = {
  fade: ARRIVAL_MS,
  swipe: ARRIVAL_MS,
  navigation: ARRIVAL_MS,
  easing: { fade: THE_CURVE, swipe: THE_CURVE, navigation: THE_CURVE },
};

/** Ink backdrop, matching the redesign chrome. */
export const LIGHTBOX_BACKDROP = { backgroundColor: "rgba(20, 20, 20, 0.94)" };

/**
 * A visitor-requested photo is loading: the site's waiting device.
 * `yarl__slide_loading` is the library's own class for its default icon: it
 * brings the delayed fade-in (no flash on a fast load) and the reduced-motion
 * opt-out; `aria-hidden` keeps the carousel's live region as quiet as it was
 * with the library icon.
 */
export const lightboxLoadingIcon = () => (
  <div className="yarl__slide_loading" aria-hidden="true">
    <Spinner variant="compact" className="[--spinner-dot:var(--color-cream)]" />
  </div>
);
