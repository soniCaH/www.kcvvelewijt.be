import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("next/script", () => ({
  default: ({ children, id }: { children?: string; id?: string }) => (
    <script data-testid={id}>{children}</script>
  ),
}));

const { GoogleTagManagerLoader } = await import("./GoogleTagManagerLoader");

describe("GoogleTagManagerLoader", () => {
  it("renders GTM init script with the provided GTM ID", () => {
    const { container } = render(
      <GoogleTagManagerLoader gtmId="GTM-TEST123" />,
    );

    const scripts = container.querySelectorAll("script");
    expect(scripts.length).toBe(1);

    const initScript = container.querySelector('[data-testid="gtm-init"]');
    expect(initScript?.textContent).toContain("GTM-TEST123");
  });

  it("does not render consent default script (handled in root layout)", () => {
    const { container } = render(
      <GoogleTagManagerLoader gtmId="GTM-TEST123" />,
    );

    const consentScript = container.querySelector(
      '[data-testid="gtm-consent-default"]',
    );
    expect(consentScript).toBeNull();
  });

  it("renders nothing when gtmId is not provided", () => {
    const { container } = render(<GoogleTagManagerLoader />);
    expect(container.innerHTML).toBe("");
  });
});
