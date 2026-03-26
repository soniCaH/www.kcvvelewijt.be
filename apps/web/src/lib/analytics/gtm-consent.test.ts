import { describe, it, expect, beforeEach, vi } from "vitest";

// Fresh import per test to avoid module caching issues
let setDefaultConsent: typeof import("./gtm-consent").setDefaultConsent;
let updateConsentState: typeof import("./gtm-consent").updateConsentState;

beforeEach(async () => {
  window.dataLayer = [];
  vi.resetModules();
  const mod = await import("./gtm-consent");
  setDefaultConsent = mod.setDefaultConsent;
  updateConsentState = mod.updateConsentState;
});

describe("setDefaultConsent", () => {
  it("pushes a gtag consent default command with analytics_storage denied", () => {
    setDefaultConsent();

    expect(window.dataLayer).toHaveLength(1);
    const pushed = window.dataLayer![0] as unknown as IArguments;
    expect(pushed[0]).toBe("consent");
    expect(pushed[1]).toBe("default");
    expect(pushed[2]).toEqual(
      expect.objectContaining({ analytics_storage: "denied" }),
    );
  });

  it("initializes dataLayer if it does not exist", () => {
    delete window.dataLayer;

    setDefaultConsent();

    expect(window.dataLayer).toBeDefined();
    expect(window.dataLayer).toHaveLength(1);
  });
});

describe("updateConsentState", () => {
  it("pushes consent update with analytics_storage granted when true", () => {
    updateConsentState(true);

    const pushed = window.dataLayer![0] as unknown as IArguments;
    expect(pushed[0]).toBe("consent");
    expect(pushed[1]).toBe("update");
    expect(pushed[2]).toEqual(
      expect.objectContaining({ analytics_storage: "granted" }),
    );
  });

  it("pushes consent update with analytics_storage denied when false", () => {
    updateConsentState(false);

    const pushed = window.dataLayer![0] as unknown as IArguments;
    expect(pushed[0]).toBe("consent");
    expect(pushed[1]).toBe("update");
    expect(pushed[2]).toEqual(
      expect.objectContaining({ analytics_storage: "denied" }),
    );
  });
});
