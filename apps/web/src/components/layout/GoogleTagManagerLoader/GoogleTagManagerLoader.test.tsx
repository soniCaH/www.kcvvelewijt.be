import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

const mockSetDefaultConsent = vi.fn();
vi.mock("@/lib/analytics/gtm-consent", () => ({
  setDefaultConsent: mockSetDefaultConsent,
}));

const MockGTM = vi.fn(() => <div data-testid="gtm-script" />);
vi.mock("@next/third-parties/google", () => ({
  GoogleTagManager: MockGTM,
}));

const { GoogleTagManagerLoader } = await import("./GoogleTagManagerLoader");

describe("GoogleTagManagerLoader", () => {
  beforeEach(() => {
    mockSetDefaultConsent.mockClear();
    MockGTM.mockClear();
  });

  it("renders GoogleTagManager with the provided GTM ID", () => {
    render(<GoogleTagManagerLoader gtmId="GTM-TEST123" />);

    expect(MockGTM).toHaveBeenCalledWith({ gtmId: "GTM-TEST123" }, undefined);
  });

  it("calls setDefaultConsent on mount", () => {
    render(<GoogleTagManagerLoader gtmId="GTM-TEST123" />);

    expect(mockSetDefaultConsent).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when gtmId is not provided", () => {
    const { container } = render(<GoogleTagManagerLoader />);

    expect(container.innerHTML).toBe("");
    expect(MockGTM).not.toHaveBeenCalled();
  });

  it("does not call setDefaultConsent when gtmId is not provided", () => {
    render(<GoogleTagManagerLoader />);

    expect(mockSetDefaultConsent).not.toHaveBeenCalled();
  });
});
