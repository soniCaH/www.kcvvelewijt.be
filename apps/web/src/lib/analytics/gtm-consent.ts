function gtag(..._args: unknown[]) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

export function updateConsentState(analyticsGranted: boolean): void {
  gtag("consent", "update", {
    analytics_storage: analyticsGranted ? "granted" : "denied",
  });
}
