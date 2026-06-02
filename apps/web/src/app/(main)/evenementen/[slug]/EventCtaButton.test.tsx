import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { EventCtaButton } from "./EventCtaButton";

const trackEventMock = vi.fn();

vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

describe("EventCtaButton", () => {
  beforeEach(() => {
    trackEventMock.mockReset();
  });

  it("renders the label and points to the external href", () => {
    render(
      <EventCtaButton
        href="https://tickets.example.com"
        label="Koop tickets"
        eventSlug="spaghetti-avond"
      />,
    );

    const link = screen.getByRole("link", { name: /Koop tickets/i });
    expect(link).toHaveAttribute("href", "https://tickets.example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("emits event_external_link_click with the event_slug and label payload", async () => {
    const user = userEvent.setup();
    render(
      <EventCtaButton
        href="https://tickets.example.com"
        label="Koop tickets"
        eventSlug="spaghetti-avond"
      />,
    );

    await user.click(screen.getByRole("link", { name: /Koop tickets/i }));

    expect(trackEventMock).toHaveBeenCalledTimes(1);
    expect(trackEventMock).toHaveBeenCalledWith("event_external_link_click", {
      event_slug: "spaghetti-avond",
      label: "Koop tickets",
    });
  });
});
