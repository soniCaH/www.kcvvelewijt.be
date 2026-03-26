import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

const mockRun = vi.fn();
const mockReset = vi.fn();
const mockAcceptedCategory = vi.fn();

vi.mock("vanilla-cookieconsent", () => ({
  run: mockRun,
  reset: mockReset,
  acceptedCategory: mockAcceptedCategory,
}));

const mockUpdateConsentState = vi.fn();
vi.mock("@/lib/analytics/gtm-consent", () => ({
  updateConsentState: mockUpdateConsentState,
}));

// Import after mock is set up
const { CookieConsentBanner } = await import("./CookieConsentBanner");

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    mockRun.mockClear();
    mockReset.mockClear();
    mockAcceptedCategory.mockClear();
    mockUpdateConsentState.mockClear();
    mockRun.mockResolvedValue(undefined);
  });

  it("calls CookieConsent.run on mount", () => {
    render(<CookieConsentBanner />);
    expect(mockRun).toHaveBeenCalledTimes(1);
  });

  it("passes a config object with nl language and two categories", () => {
    render(<CookieConsentBanner />);
    const config = mockRun.mock.calls[0][0];
    expect(config.language.default).toBe("nl");
    expect(config.categories.necessary).toBeDefined();
    expect(config.categories.analytics).toBeDefined();
  });

  it("renders nothing visible", () => {
    const { container } = render(<CookieConsentBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("calls CookieConsent.reset on unmount", () => {
    const { unmount } = render(<CookieConsentBanner />);
    unmount();
    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(mockReset).toHaveBeenCalledWith(false);
  });

  it("registers an onConsent callback", () => {
    render(<CookieConsentBanner />);
    const config = mockRun.mock.calls[0][0];
    expect(config.onConsent).toBeTypeOf("function");
  });

  it("registers an onChange callback", () => {
    render(<CookieConsentBanner />);
    const config = mockRun.mock.calls[0][0];
    expect(config.onChange).toBeTypeOf("function");
  });

  it("onConsent calls updateConsentState with true when analytics accepted", () => {
    mockAcceptedCategory.mockReturnValue(true);
    render(<CookieConsentBanner />);
    const config = mockRun.mock.calls[0][0];

    config.onConsent();

    expect(mockAcceptedCategory).toHaveBeenCalledWith("analytics");
    expect(mockUpdateConsentState).toHaveBeenCalledWith(true);
  });

  it("onConsent calls updateConsentState with false when analytics not accepted", () => {
    mockAcceptedCategory.mockReturnValue(false);
    render(<CookieConsentBanner />);
    const config = mockRun.mock.calls[0][0];

    config.onConsent();

    expect(mockAcceptedCategory).toHaveBeenCalledWith("analytics");
    expect(mockUpdateConsentState).toHaveBeenCalledWith(false);
  });

  it("onChange calls updateConsentState based on current accepted category", () => {
    mockAcceptedCategory.mockReturnValue(true);
    render(<CookieConsentBanner />);
    const config = mockRun.mock.calls[0][0];

    config.onChange({
      changedCategories: ["analytics"],
      changedServices: {},
      cookie: {},
    });

    expect(mockUpdateConsentState).toHaveBeenCalledWith(true);
  });
});
