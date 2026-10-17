import { describe, it, expect, beforeEach, vi } from "vitest";
import { trackEvent } from "./track-event";

/** The entries `trackEvent` pushes besides the reset function in front of each event. */
const events = () =>
  (window.dataLayer ?? []).filter((e) => typeof e !== "function");

describe("trackEvent", () => {
  beforeEach(() => {
    window.dataLayer = [];
  });

  it("pushes event with name to dataLayer", () => {
    trackEvent("test_event");

    expect(events()).toEqual([{ event: "test_event" }]);
  });

  it("pushes event with name and params to dataLayer", () => {
    trackEvent("search_submitted", { query_text: "voetbal", query_length: 7 });

    expect(events()).toEqual([
      { event: "search_submitted", query_text: "voetbal", query_length: 7 },
    ]);
  });

  it("pushes a reset before each event so optional params never carry over", () => {
    trackEvent("a", { tier: "gold" });
    trackEvent("b");

    expect(window.dataLayer).toEqual([
      expect.any(Function),
      { event: "a", tier: "gold" },
      expect.any(Function),
      { event: "b" },
    ]);
  });

  it("pushes a function that calls reset() on the GTM data model", () => {
    trackEvent("a");
    const reset = vi.fn();

    (window.dataLayer![0] as (this: { reset(): void }) => void).call({ reset });

    expect(reset).toHaveBeenCalledOnce();
  });

  it("is a no-op when dataLayer does not exist", () => {
    delete window.dataLayer;

    expect(() => trackEvent("test_event")).not.toThrow();
    expect(window.dataLayer).toBeUndefined();
  });
});
