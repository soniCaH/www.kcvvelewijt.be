import { describe, it, expect } from "vitest";
import { computeReadingTime } from "./reading-time";

const block = (text: string) => ({
  _type: "block" as const,
  children: [{ text }],
});

describe("computeReadingTime", () => {
  it("returns undefined for a null body", () => {
    expect(computeReadingTime(null)).toBeUndefined();
    expect(computeReadingTime(undefined)).toBeUndefined();
  });

  it("returns undefined when the body is shorter than the estimation threshold", () => {
    expect(computeReadingTime([block("Te kort.")])).toBeUndefined();
  });

  it("returns 1 min for content at the lower estimation bound", () => {
    const body = [block(Array.from({ length: 50 }, () => "woord").join(" "))];
    expect(computeReadingTime(body)).toBe("1 min lezen");
  });

  it("returns 4 min for approximately 800 words", () => {
    const body = [block(Array.from({ length: 800 }, () => "woord").join(" "))];
    expect(computeReadingTime(body)).toBe("4 min lezen");
  });

  it("counts text inside qaBlock pairs (both question and nested answer blocks)", () => {
    const pairs = Array.from({ length: 10 }, (_, i) => ({
      question: `vraag nummer ${i} met wat extra woorden hier`,
      answer: [block(`antwoord op vraag ${i} met nog meer tekst eromheen`)],
    }));
    const body = [
      block("Een korte introductie met extra woorden hier voor context."),
      { _type: "qaBlock" as const, pairs },
    ];
    expect(computeReadingTime(body)).toBe("1 min lezen");
  });

  it("returns undefined when body array is empty", () => {
    expect(computeReadingTime([])).toBeUndefined();
  });
});
