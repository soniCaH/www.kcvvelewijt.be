import { describe, it, expect, beforeEach, vi } from "vitest";

// Fresh import per test to avoid module caching issues
const consent = {} as {
  updateConsentState: typeof import("./gtm-consent").updateConsentState;
};

beforeEach(async () => {
  window.dataLayer = [];
  vi.resetModules();
  const mod = await import("./gtm-consent");
  consent.updateConsentState = mod.updateConsentState;
});

describe("updateConsentState", () => {
  it("pushes consent update with analytics_storage granted when true", () => {
    consent.updateConsentState(true);

    const pushed = window.dataLayer![0] as unknown as IArguments;
    expect(pushed[0]).toBe("consent");
    expect(pushed[1]).toBe("update");
    expect(pushed[2]).toEqual(
      expect.objectContaining({ analytics_storage: "granted" }),
    );
  });

  it("pushes consent update with analytics_storage denied when false", () => {
    consent.updateConsentState(false);

    const pushed = window.dataLayer![0] as unknown as IArguments;
    expect(pushed[0]).toBe("consent");
    expect(pushed[1]).toBe("update");
    expect(pushed[2]).toEqual(
      expect.objectContaining({ analytics_storage: "denied" }),
    );
  });

  it("initializes dataLayer if it does not exist", () => {
    delete window.dataLayer;

    consent.updateConsentState(true);

    expect(window.dataLayer).toBeDefined();
    expect(window.dataLayer).toHaveLength(1);
  });
});
