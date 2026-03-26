export function trackEvent(
  name: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined" || !window.dataLayer) return;

  window.dataLayer.push({ event: name, ...params });
}
