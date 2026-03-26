import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

const mockSetDefaultConsent = vi.fn();
vi.mock("@/lib/analytics/gtm-consent", () => ({
  setDefaultConsent: mockSetDefaultConsent,
}));

vi.mock("next/script", () => ({
  default: ({ children, id }: { children?: string; id?: string }) => (
    <script data-testid={id}>{children}</script>
  ),
}));

const { GoogleTagManagerLoader } = await import("./GoogleTagManagerLoader");

describe("GoogleTagManagerLoader", () => {
  beforeEach(() => {
    mockSetDefaultConsent.mockClear();
  });

  it("renders GTM scripts with the provided GTM ID", () => {
    const { container } = render(
      <GoogleTagManagerLoader gtmId="GTM-TEST123" />,
    );

    const scripts = container.querySelectorAll("script");
    expect(scripts.length).toBe(2);

    const initScript = container.querySelector('[data-testid="gtm-init"]');
    expect(initScript?.textContent).toContain("GTM-TEST123");
  });

  it("renders consent default script before GTM init", () => {
    const { container } = render(
      <GoogleTagManagerLoader gtmId="GTM-TEST123" />,
    );

    const consentScript = container.querySelector(
      '[data-testid="gtm-consent-default"]',
    );
    expect(consentScript?.textContent).toContain("analytics_storage");
    expect(consentScript?.textContent).toContain("denied");
  });

  it("calls setDefaultConsent on render", () => {
    render(<GoogleTagManagerLoader gtmId="GTM-TEST123" />);
    expect(mockSetDefaultConsent).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when gtmId is not provided", () => {
    const { container } = render(<GoogleTagManagerLoader />);
    expect(container.innerHTML).toBe("");
  });

  it("does not call setDefaultConsent when gtmId is not provided", () => {
    render(<GoogleTagManagerLoader />);
    expect(mockSetDefaultConsent).not.toHaveBeenCalled();
  });
});
