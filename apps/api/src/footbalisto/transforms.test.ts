import { describe, it, expect } from "vitest";
import { Effect, Logger } from "effect";
import { mapGameStatus, mapCompetitionLabel } from "./transforms";

describe("mapGameStatus", () => {
  it("returns an Effect that resolves to the correct status", async () => {
    const result = await Effect.runPromise(mapGameStatus(0, 3, 1));
    expect(result).toBe("finished");
  });

  it("returns 'scheduled' for status 0 with no goals", async () => {
    const result = await Effect.runPromise(mapGameStatus(0, null, null));
    expect(result).toBe("scheduled");
  });

  it("returns 'forfeited' for status 1", async () => {
    const result = await Effect.runPromise(mapGameStatus(1, null, null));
    expect(result).toBe("forfeited");
  });

  it("returns 'postponed' for status 2", async () => {
    const result = await Effect.runPromise(mapGameStatus(2, null, null));
    expect(result).toBe("postponed");
  });

  it("returns 'stopped' for status 3", async () => {
    const result = await Effect.runPromise(mapGameStatus(3, null, null));
    expect(result).toBe("stopped");
  });

  it("returns 'postponed' when cancelled regardless of status", async () => {
    const result = await Effect.runPromise(mapGameStatus(0, 3, 1, true));
    expect(result).toBe("postponed");
  });

  it("logs a warning for unknown status code", async () => {
    const messages: string[] = [];
    const TestLogger = Logger.make(({ message }) => {
      messages.push(String(message));
    });

    const result = await Effect.runPromise(
      mapGameStatus(99, null, null).pipe(
        Effect.provide(Logger.replace(Logger.defaultLogger, TestLogger)),
      ),
    );

    expect(result).toBe("scheduled");
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("Unknown PSD game status code: 99");
  });

  it("logs a warning for unknown status code when cancelled", async () => {
    const messages: string[] = [];
    const TestLogger = Logger.make(({ message }) => {
      messages.push(String(message));
    });

    const result = await Effect.runPromise(
      mapGameStatus(99, null, null, true).pipe(
        Effect.provide(Logger.replace(Logger.defaultLogger, TestLogger)),
      ),
    );

    expect(result).toBe("postponed");
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("Unknown PSD game status code: 99");
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
