export function trackEvent(
  name: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined" || !window.dataLayer) return;

  // The GA4 tag maps every Data Layer Variable, and GTM keeps a key until
  // something overwrites it: without a reset, an optional param this event
  // omits would carry over from the previous one. GTM runs a pushed function
  // with `this` bound to its data model.
  window.dataLayer.push(function (this: { reset(): void }) {
    this.reset();
  });
  window.dataLayer.push({ event: name, ...params });
}
