import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EventDetailCtas } from "./EventDetailCtas";

const trackEventMock = vi.fn();
vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

const baseProps = {
  eventSlug: "mosselfeest",
  eventTitle: "Mosselfeest 2026",
  dateStart: "2026-09-12T16:00:00Z",
  dateEnd: "2026-09-12T20:00:00Z",
  location: "Kantine KCVV",
  canonicalUrl: "https://kcvvelewijt.be/evenementen/mosselfeest",
};

// The Reserveer CTA is a real external anchor; suppress the default navigation
// so happy-dom doesn't attempt a network fetch (onClick analytics still fire —
// preventDefault stops only the browser default, not the React handler).
const suppressNavigation = (event: Event) => event.preventDefault();

describe("EventDetailCtas", () => {
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    trackEventMock.mockReset();
    document.addEventListener("click", suppressNavigation, true);
    // Stub blob-URL APIs (absent / navigation-triggering in the test DOM).
    globalThis.URL.createObjectURL = vi.fn(() => "blob:mock");
    globalThis.URL.revokeObjectURL = vi.fn();
    clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
  });

  afterEach(() => {
    document.removeEventListener("click", suppressNavigation, true);
    vi.restoreAllMocks();
  });

  it("always renders the 'Zet in agenda' CTA", () => {
    render(<EventDetailCtas {...baseProps} />);
    expect(
      screen.getByRole("button", { name: /Zet in agenda/i }),
    ).toBeInTheDocument();
  });

  it("renders the Reserveer link only when externalUrl is set, opening in a new tab", () => {
    const { rerender } = render(<EventDetailCtas {...baseProps} />);
    expect(screen.queryByRole("link", { name: /Reserveer/i })).toBeNull();

    rerender(
      <EventDetailCtas
        {...baseProps}
        externalUrl="https://tickets.example.com"
      />,
    );
    const link = screen.getByRole("link", { name: /Reserveer/i });
    expect(link).toHaveAttribute("href", "https://tickets.example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("uses the externalLabel when provided, falling back to 'Reserveer'", () => {
    const { rerender } = render(
      <EventDetailCtas
        {...baseProps}
        externalUrl="https://tickets.example.com"
        externalLabel="Koop tickets"
      />,
    );
    expect(
      screen.getByRole("link", { name: /Koop tickets/i }),
    ).toBeInTheDocument();

    rerender(
      <EventDetailCtas
        {...baseProps}
        externalUrl="https://tickets.example.com"
        externalLabel="   "
      />,
    );
    expect(
      screen.getByRole("link", { name: /Reserveer/i }),
    ).toBeInTheDocument();
  });

  it("fires event_detail_cta_click with cta='reserveer' on the Reserveer click", async () => {
    const user = userEvent.setup();
    render(
      <EventDetailCtas
        {...baseProps}
        externalUrl="https://tickets.example.com"
      />,
    );
    await user.click(screen.getByRole("link", { name: /Reserveer/i }));
    expect(trackEventMock).toHaveBeenCalledWith("event_detail_cta_click", {
      event_slug: "mosselfeest",
      cta: "reserveer",
    });
  });

  it("downloads an .ics blob and fires cta='agenda' on the agenda click", async () => {
    const user = userEvent.setup();
    render(<EventDetailCtas {...baseProps} />);
    await user.click(screen.getByRole("button", { name: /Zet in agenda/i }));

    expect(globalThis.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    expect(trackEventMock).toHaveBeenCalledWith("event_detail_cta_click", {
      event_slug: "mosselfeest",
      cta: "agenda",
    });
  });
});
