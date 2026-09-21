import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackEvent } from "@/lib/analytics/track-event";
import {
  trackAgendaCollapse,
  trackAgendaExpand,
  trackAgendaFilter,
  trackAgendaRowClick,
} from "./upcoming-matches-analytics";
import {
  prefixes,
  params,
} from "../../../../../../scripts/analytics-taxonomy.mjs";

vi.mock("@/lib/analytics/track-event", () => ({ trackEvent: vi.fn() }));

/** Every event name this module can emit, and every parameter key it sends. */
const EMITTED_EVENTS = [
  "match_agenda_filter",
  "match_agenda_expand",
  "match_agenda_collapse",
  "match_card_click",
];
const EMITTED_PARAMS = ["filter_type", "count", "match_id", "source"];

describe("upcoming-matches-analytics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fires match_agenda_filter with the facet and its resulting count", () => {
    trackAgendaFilter("U15", 3);
    expect(trackEvent).toHaveBeenCalledWith("match_agenda_filter", {
      filter_type: "u15",
      count: 3,
    });
  });

  // `filter_type` is one GA4 dimension shared with `empty_state_undo` and
  // `search_filter_changed`, which both send slugs — so the squad label is
  // slugged too, or `A-Ploeg` and `a-ploeg` split into two rows (#2719).
  it("slugs the squad label into the shared filter_type vocabulary", () => {
    trackAgendaFilter("A-Ploeg", 2);
    expect(trackEvent).toHaveBeenCalledWith("match_agenda_filter", {
      filter_type: "a-ploeg",
      count: 2,
    });
  });

  it("fires match_agenda_filter with the all-reset facet", () => {
    trackAgendaFilter("all", 12);
    expect(trackEvent).toHaveBeenCalledWith("match_agenda_filter", {
      filter_type: "all",
      count: 12,
    });
  });

  // Direction lives in the event name, not an `action` param: the only
  // registered dimension that fit is GA4's "Error action", and overloading it
  // would file agenda interactions under errors in every report.
  it("fires a distinct event per expand direction, with no action param", () => {
    trackAgendaExpand(12);
    expect(trackEvent).toHaveBeenCalledWith("match_agenda_expand", {
      count: 12,
    });
    trackAgendaCollapse(12);
    expect(trackEvent).toHaveBeenCalledWith("match_agenda_collapse", {
      count: 12,
    });
  });

  it("fires match_card_click tagged to the agenda surface", () => {
    trackAgendaRowClick(501);
    expect(trackEvent).toHaveBeenCalledWith("match_card_click", {
      match_id: 501,
      source: "home_agenda",
    });
  });

  // `team_slug` is deliberately absent — the agenda holds a squad label, not the
  // slug <FirstTeamsBlock> sends, and pushing one into the other poisons the
  // dimension for both surfaces.
  it("omits team_slug rather than sending a squad label in a slug dimension", () => {
    trackAgendaRowClick(501);
    const payload = vi.mocked(trackEvent).mock.calls[0]![1];
    expect(payload).not.toHaveProperty("team_slug");
  });

  // The point of this module is that it needs no GTM container change. If a
  // future edit introduces an unregistered prefix or parameter, that silently
  // stops reaching GA4 until someone publishes a new container version — so
  // assert it here rather than discovering it in a report.
  it("emits only event prefixes already in the GTM taxonomy", () => {
    for (const event of EMITTED_EVENTS) {
      expect(prefixes.some((p: string) => event.startsWith(p))).toBe(true);
    }
  });

  it("emits only parameters already registered as GA4 dimensions", () => {
    const registered = params.map(
      (p: { parameterName: string }) => p.parameterName,
    );
    for (const key of EMITTED_PARAMS) {
      expect(registered).toContain(key);
    }
  });
});
