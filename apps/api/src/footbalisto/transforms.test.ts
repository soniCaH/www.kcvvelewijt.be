import { describe, it, expect } from "vitest";
import {
  mapGameStatus,
  isUnknownGameStatus,
  mapCompetitionLabel,
} from "./transforms";

describe("mapGameStatus", () => {
  it("returns 'finished' for status 0 with goals", () => {
    expect(mapGameStatus(0, 3, 1)).toBe("finished");
  });

  it("returns 'scheduled' for status 0 with no goals", () => {
    expect(mapGameStatus(0, null, null)).toBe("scheduled");
  });

  it("returns 'forfeited' for status 1", () => {
    expect(mapGameStatus(1, null, null)).toBe("forfeited");
  });

  it("returns 'postponed' for status 2", () => {
    expect(mapGameStatus(2, null, null)).toBe("postponed");
  });

  it("returns 'stopped' for status 3", () => {
    expect(mapGameStatus(3, null, null)).toBe("stopped");
  });

  it("returns 'postponed' when cancelled regardless of status", () => {
    expect(mapGameStatus(0, 3, 1, true)).toBe("postponed");
  });

  it("falls back to 'scheduled' for unknown status code", () => {
    expect(mapGameStatus(99, null, null)).toBe("scheduled");
  });

  it("returns 'postponed' for unknown status code when cancelled", () => {
    expect(mapGameStatus(99, null, null, true)).toBe("postponed");
  });
});

describe("isUnknownGameStatus", () => {
  it("returns false for known codes 0–3", () => {
    expect(isUnknownGameStatus(0)).toBe(false);
    expect(isUnknownGameStatus(1)).toBe(false);
    expect(isUnknownGameStatus(2)).toBe(false);
    expect(isUnknownGameStatus(3)).toBe(false);
  });

  it("returns true for unknown codes", () => {
    expect(isUnknownGameStatus(99)).toBe(true);
    expect(isUnknownGameStatus(-1)).toBe(true);
  });
});

describe("mapCompetitionLabel", () => {
  it("maps LEAGUE to 'Competitie'", () => {
    expect(mapCompetitionLabel("LEAGUE", "3de Nationale")).toBe("Competitie");
  });

  it("maps CUP to the PSD name when available", () => {
    expect(mapCompetitionLabel("CUP", "Beker van Brabant")).toBe(
      "Beker van Brabant",
    );
  });

  it("maps CUP to 'Beker' when name is null", () => {
    expect(mapCompetitionLabel("CUP", null)).toBe("Beker");
  });

  it("maps FRIENDLY to 'Vriendschappelijk'", () => {
    expect(mapCompetitionLabel("FRIENDLY", null)).toBe("Vriendschappelijk");
  });

  it("falls back to raw type for unknown types", () => {
    expect(mapCompetitionLabel("INTERLAND", null)).toBe("INTERLAND");
  });
});
