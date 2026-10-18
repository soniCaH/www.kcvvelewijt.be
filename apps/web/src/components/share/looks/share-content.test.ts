import { describe, expect, it } from "vitest";
import { TOKENS } from "../constants";
import { EVENT_TYPE_FILL } from "@/components/event/event-type-style";
import { buildMatchContent, eventColour, shareCover } from "./share-content";

const URL = "https://cdn.sanity.io/images/p/d/cover-2000x1000.jpg";

describe("shareCover", () => {
  it("keeps an uncropped cover whole, hotspot as is (centre without one)", () => {
    expect(
      shareCover({
        coverUrl: URL,
        hotspot: null,
        crop: null,
        dimensions: null,
      }),
    ).toEqual({ url: URL, hotspot: { x: 0.5, y: 0.5 } });
  });

  it("applies the editor's crop as rect= and moves the hotspot into the crop", () => {
    expect(
      shareCover({
        coverUrl: URL,
        hotspot: { x: 0.5, y: 0.5 },
        crop: { left: 0.25, right: 0.25, top: 0, bottom: 0.5 },
        dimensions: { width: 2000, height: 1000 },
      }),
    ).toEqual({
      url: `${URL}?rect=500,0,1000,500`,
      hotspot: { x: 0.5, y: 1 },
    });
  });

  it("no URL is no cover", () => {
    expect(
      shareCover({
        coverUrl: null,
        hotspot: null,
        crop: null,
        dimensions: null,
      }),
    ).toBeNull();
  });
});

describe("buildMatchContent", () => {
  const base = {
    matchName: "KCVV Elewijt — FC Opponent",
    score: "2 - 1",
    minute: "67",
    competition: "3de Provinciale B",
    dateTime: "Zaterdag · 20:00",
    awayLogo: "https://cdn.example.com/opp.png",
    squad: "A",
    playerName: "Jan Janssen",
    mood: "win" as const,
  };

  // The spec's first-pass moment table (#3535): one row per TemplateId.
  it.each([
    ["kickoff", "Aftrap", TOKENS.jerseyDeepDark, "dateblock"],
    ["square-pre-game", "Aftrap", TOKENS.jerseyDeepDark, "dateblock"],
    ["halftime", "Rust", TOKENS.inkSoft, "halftime"],
    ["full-time", "Eindstand", TOKENS.warm, "whistle"],
    ["square-result", "Eindstand", TOKENS.warm, "whistle"],
    ["goal-kcvv", "Goal", TOKENS.jerseyDeep, "minuteBall"],
    ["goal-opponent", "Tegengoal", TOKENS.cream, "minute"],
    ["yellow-card-kcvv", "Gele kaart", TOKENS.warm, "card"],
    ["yellow-card-opponent", "Gele kaart", TOKENS.warm, "card"],
    ["red-card-kcvv", "Rode kaart", TOKENS.brick, "card"],
    ["red-card-opponent", "Rode kaart", TOKENS.brick, "card"],
  ] as const)("%s → %s", (template, label, fill, detail) => {
    const c = buildMatchContent({ ...base, template });
    expect(c).toMatchObject({
      kind: "match",
      typeKey: template,
      label,
      fill,
      detail,
      squad: "A",
    });
  });

  it("a draw or a loss ends in ink", () => {
    expect(
      buildMatchContent({ ...base, template: "full-time", mood: "draw" }).fill,
    ).toBe(TOKENS.ink);
    expect(
      buildMatchContent({ ...base, template: "square-result", mood: "loss" })
        .fill,
    ).toBe(TOKENS.ink);
  });

  it("kickoff: crests hero, the hour in the block; goal: score hero, the scorer as title", () => {
    const kickoff = buildMatchContent({ ...base, template: "kickoff" });
    expect(kickoff.hero).toMatchObject({ kind: "crests" });
    expect(kickoff.dateBlock).toEqual({ day: "20:00", month: "Zaterdag" });
    expect(kickoff.info).toEqual(["Zaterdag · 20:00", "3de Provinciale B"]);

    const goal = buildMatchContent({ ...base, template: "goal-kcvv" });
    expect(goal.hero).toEqual({ kind: "score", score: "2–1" });
    expect(goal.title).toEqual([{ text: "Jan Janssen", accent: false }]);
    expect(goal.minute).toBe("67");

    const against = buildMatchContent({ ...base, template: "goal-opponent" });
    expect(against.title).toEqual([{ text: "FC Opponent", accent: false }]);
  });

  it.each([
    ["Za 18.10 · 20:00", { day: "20:00", month: "Za 18.10" }],
    ["20:00", { day: "20:00", month: "Aftrap" }],
    ["Zaterdag 20u00", { day: "20:00", month: "Aftrap" }],
    ["Zaterdag · 9.30", { day: "09:30", month: "Zaterdag" }],
  ])("kickoff block for %j", (dateTime, block) => {
    expect(
      buildMatchContent({ ...base, template: "kickoff", dateTime }).dateBlock,
    ).toEqual(block);
  });

  it("a kickoff with no hour has no block; no photo is null, an own photo is kept", () => {
    const c = buildMatchContent({ ...base, template: "kickoff", dateTime: "" });
    expect(c.detail).toBe("none");
    expect(c.photo).toBeNull();
    expect(
      buildMatchContent({ ...base, template: "halftime", photo: "blob:x" })
        .photo,
    ).toMatchObject({ src: "blob:x", source: "own" });
  });
});

describe("event colours", () => {
  it("every EVENT_TYPE_FILL class resolves to a capture-safe colour", () => {
    for (const fillClass of Object.values(EVENT_TYPE_FILL)) {
      expect(eventColour(fillClass, "bg"), fillClass).toBeDefined();
      expect(eventColour(fillClass, "text"), fillClass).toBeDefined();
    }
  });
});
