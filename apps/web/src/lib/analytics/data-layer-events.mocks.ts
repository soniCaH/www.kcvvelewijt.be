/**
 * The `window.dataLayer` entries a test cares about: `trackEvent` pushes a
 * reset function in front of every event, so drop the functions and keep the
 * events themselves. `track-event.test.ts` asserts the reset sequence itself.
 */
export const dataLayerEvents = () =>
  (window.dataLayer ?? []).filter((e) => typeof e !== "function");
