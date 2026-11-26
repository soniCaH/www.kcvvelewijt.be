// A function expression, not an arrow: GTM needs the `arguments` object, which an arrow lacks.
const gtag = function (..._args: unknown[]) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
};

export const updateConsentState = (analyticsGranted: boolean): void => {
  gtag("consent", "update", {
    analytics_storage: analyticsGranted ? "granted" : "denied",
  });
};
