import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackKalenderItemClick } from "./calendar-analytics";
import { trackEvent } from "@/lib/analytics/track-event";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

describe("trackKalenderItemClick", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["match", "event", "article"] as const)(
    "fires kalender_item_click with source=%s",
    (source) => {
      trackKalenderItemClick(source);
      expect(trackEvent).toHaveBeenCalledWith("kalender_item_click", {
        source,
      });
    },
  );
});
