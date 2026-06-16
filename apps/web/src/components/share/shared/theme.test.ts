import { describe, it, expect } from "vitest";
import { TOKENS } from "../constants";
import {
  opponentName,
  overlayGradient,
  resolvePalette,
  splitMatchName,
  toSameOriginImage,
} from "./theme";

describe("toSameOriginImage", () => {
  it("routes an allowlisted CDN host through the Next optimizer", () => {
    expect(
      toSameOriginImage(
        "https://cdn.sanity.io/images/x/y-350x350.jpg?w=400",
        1080,
      ),
    ).toBe(
      "/_next/image?url=https%3A%2F%2Fcdn.sanity.io%2Fimages%2Fx%2Fy-350x350.jpg%3Fw%3D400&w=1080&q=75",
    );
  });

  it("passes blob, data and relative URLs through unchanged", () => {
    expect(toSameOriginImage("blob:abc", 1080)).toBe("blob:abc");
    expect(toSameOriginImage("/images/ultras.jpg", 384)).toBe(
      "/images/ultras.jpg",
    );
  });

  it("passes non-allowlisted hosts through unchanged (optimizer would 400)", () => {
    expect(toSameOriginImage("https://example.com/a.png", 384)).toBe(
      "https://example.com/a.png",
    );
  });

  it("returns undefined for undefined", () => {
    expect(toSameOriginImage(undefined, 1080)).toBeUndefined();
  });
});

describe("resolvePalette", () => {
  it("uses the loud (cream + warm) palette for the dark register", () => {
    const p = resolvePalette("dark");
    expect(p.text).toBe(TOKENS.cream);
    expect(p.kicker).toBe(TOKENS.warm);
    expect(p.punct).toBe(TOKENS.warm);
    expect(p.numDiscBg).toBe(TOKENS.warm);
  });

  it("uses the same loud palette for the image register", () => {
    expect(resolvePalette("image")).toEqual(resolvePalette("dark"));
  });

  it("cream + neutral uses jersey accents with a warm period", () => {
    const p = resolvePalette("cream", "neutral");
    expect(p.kicker).toBe(TOKENS.jerseyDeep);
    expect(p.emphasis).toBe(TOKENS.jerseyDeep);
    expect(p.punct).toBe(TOKENS.warm);
  });

  it("cream + positive carries the accent through the punctuation", () => {
    const p = resolvePalette("cream", "positive");
    expect(p.punct).toBe(TOKENS.jerseyDeep);
  });

  it("cream + negative switches to the brick accent", () => {
    const p = resolvePalette("cream", "negative");
    expect(p.kicker).toBe(TOKENS.brick);
    expect(p.punct).toBe(TOKENS.brick);
    expect(p.numDiscBg).toBe(TOKENS.brick);
    expect(p.emphasis).toBe(TOKENS.inkSoft);
  });
});

describe("overlayGradient", () => {
  it("returns a stronger overlay for the shout variant", () => {
    expect(overlayGradient("shout")).toContain("0.92");
    expect(overlayGradient("calm")).toContain("0.86");
  });
});

describe("splitMatchName", () => {
  it("splits on an em-dash", () => {
    expect(splitMatchName("KCVV Elewijt — Eppegem")).toEqual({
      home: "KCVV Elewijt",
      away: "Eppegem",
    });
  });

  it("splits on a spaced hyphen", () => {
    expect(splitMatchName("KCVV Elewijt - Eppegem")).toEqual({
      home: "KCVV Elewijt",
      away: "Eppegem",
    });
  });

  it("falls back to the whole string when there is no separator", () => {
    expect(splitMatchName("KCVV Elewijt")).toEqual({
      home: "KCVV Elewijt",
      away: "",
    });
  });
});

describe("opponentName", () => {
  it("returns the away side when KCVV is home", () => {
    expect(opponentName("KCVV Elewijt — Eppegem")).toBe("Eppegem");
  });

  it("returns the home side when KCVV is away", () => {
    expect(opponentName("Eppegem — KCVV Elewijt")).toBe("Eppegem");
  });
});
