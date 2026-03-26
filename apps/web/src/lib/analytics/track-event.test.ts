import { describe, it, expect, beforeEach } from "vitest";
import { trackEvent } from "./track-event";

describe("trackEvent", () => {
  beforeEach(() => {
    window.dataLayer = [];
  });

  it("pushes event with name to dataLayer", () => {
    trackEvent("test_event");

    expect(window.dataLayer).toHaveLength(1);
    expect(window.dataLayer![0]).toEqual({ event: "test_event" });
  });

  it("pushes event with name and params to dataLayer", () => {
    trackEvent("search_submitted", { query_text: "voetbal", query_length: 7 });

    expect(window.dataLayer![0]).toEqual({
      event: "search_submitted",
      query_text: "voetbal",
      query_length: 7,
    });
  });

  it("is a no-op when dataLayer does not exist", () => {
    delete window.dataLayer;

    expect(() => trackEvent("test_event")).not.toThrow();
    expect(window.dataLayer).toBeUndefined();
  });
});
