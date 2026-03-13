import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

const mockRun = vi.fn();
const mockReset = vi.fn();

vi.mock("vanilla-cookieconsent", () => ({
  run: mockRun,
  reset: mockReset,
}));

// Import after mock is set up
const { CookieConsentBanner } = await import("./CookieConsentBanner");

describe("CookieConsentBanner", () => {
  beforeEach(() => {
    mockRun.mockClear();
    mockReset.mockClear();
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
});
