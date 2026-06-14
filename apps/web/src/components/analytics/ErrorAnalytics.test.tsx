import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: vi.fn(),
}));

import { trackEvent } from "@/lib/analytics/track-event";
import { ErrorAnalytics } from "./ErrorAnalytics";

describe("<ErrorAnalytics>", () => {
  beforeEach(() => {
    vi.mocked(trackEvent).mockClear();
    window.history.pushState({}, "", "/deze-pagina-bestaat-niet");
  });

  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("fires error_view once on mount with the code and current path", () => {
    render(
      <ErrorAnalytics code="404">
        <div>body</div>
      </ErrorAnalytics>,
    );

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("error_view", {
      error_code: "404",
      path: "/deze-pagina-bestaat-niet",
    });
  });

  it("delegates a recovery-action click to error_action_click", () => {
    render(
      <ErrorAnalytics code="404">
        <a data-error-action="home" href="#">
          <span>Naar de homepage</span>
        </a>
      </ErrorAnalytics>,
    );
    vi.mocked(trackEvent).mockClear(); // drop the mount error_view

    fireEvent.click(screen.getByText("Naar de homepage"));

    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("error_action_click", {
      error_code: "404",
      path: "/deze-pagina-bestaat-niet",
      action: "home",
    });
  });

  it("carries the 500 code through both events", () => {
    render(
      <ErrorAnalytics code="500">
        <button type="button" data-error-action="retry">
          Probeer opnieuw
        </button>
      </ErrorAnalytics>,
    );

    expect(trackEvent).toHaveBeenCalledWith("error_view", {
      error_code: "500",
      path: "/deze-pagina-bestaat-niet",
    });

    fireEvent.click(screen.getByText("Probeer opnieuw"));
    expect(trackEvent).toHaveBeenLastCalledWith("error_action_click", {
      error_code: "500",
      path: "/deze-pagina-bestaat-niet",
      action: "retry",
    });
  });

  it("ignores clicks outside any data-error-action element", () => {
    render(
      <ErrorAnalytics code="404">
        <p>Geen knop hier.</p>
      </ErrorAnalytics>,
    );
    vi.mocked(trackEvent).mockClear();

    fireEvent.click(screen.getByText("Geen knop hier."));

    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("renders its children", () => {
    render(
      <ErrorAnalytics code="404">
        <span>wrapped content</span>
      </ErrorAnalytics>,
    );
    expect(screen.getByText("wrapped content")).toBeInTheDocument();
  });
});
