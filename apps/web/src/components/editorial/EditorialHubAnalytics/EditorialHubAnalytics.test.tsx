import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { EditorialHubAnalytics } from "./EditorialHubAnalytics";

const trackEvent = vi.fn();
vi.mock("@/lib/analytics/track-event", () => ({
  trackEvent: (name: string, params?: Record<string, unknown>) =>
    trackEvent(name, params),
}));

describe("EditorialHubAnalytics", () => {
  beforeEach(() => trackEvent.mockClear());

  it("fires the event with card_type + tag + article_id_hashed for a news card", () => {
    render(
      <EditorialHubAnalytics eventName="jeugd_card_click">
        <a
          data-card-type="news"
          data-tag="Jeugd"
          data-article-id-hashed="abc123"
          href="#"
        >
          News card
        </a>
      </EditorialHubAnalytics>,
    );

    screen.getByText("News card").click();

    expect(trackEvent).toHaveBeenCalledWith("jeugd_card_click", {
      card_type: "news",
      tag: "Jeugd",
      article_id_hashed: "abc123",
    });
  });

  it("omits article_id_hashed for a nav card", () => {
    render(
      <EditorialHubAnalytics eventName="jeugd_card_click">
        <a data-card-type="nav" data-tag="Visie" href="#">
          Nav card
        </a>
      </EditorialHubAnalytics>,
    );

    screen.getByText("Nav card").click();

    expect(trackEvent).toHaveBeenCalledWith("jeugd_card_click", {
      card_type: "nav",
      tag: "Visie",
    });
  });

  it("uses the provided eventName (reusable across hubs)", () => {
    render(
      <EditorialHubAnalytics eventName="club_card_click">
        <a data-card-type="nav" data-tag="" href="#">
          Club card
        </a>
      </EditorialHubAnalytics>,
    );

    screen.getByText("Club card").click();

    expect(trackEvent).toHaveBeenCalledWith("club_card_click", {
      card_type: "nav",
      tag: "",
    });
  });

  it("ignores clicks outside a card", () => {
    render(
      <EditorialHubAnalytics eventName="jeugd_card_click">
        <span>not a card</span>
      </EditorialHubAnalytics>,
    );

    screen.getByText("not a card").click();
    expect(trackEvent).not.toHaveBeenCalled();
  });
});
