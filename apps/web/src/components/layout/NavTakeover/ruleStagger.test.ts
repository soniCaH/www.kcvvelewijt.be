import { describe, it, expect } from "vitest";
import { ruleStepMs, RULE_START_CAP_MS } from "./ruleStagger";

describe("ruleStepMs", () => {
  it("keeps the 30ms step for today's 9 rows — the last rule starts at 240ms", () => {
    expect(ruleStepMs(9)).toBe(30);
    expect(ruleStepMs(9) * (9 - 1)).toBe(240);
  });

  it("shrinks the step for 12 rows so the last rule never starts after 270ms", () => {
    expect(ruleStepMs(12)).toBeLessThan(30);
    expect(ruleStepMs(12) * (12 - 1)).toBeLessThanOrEqual(RULE_START_CAP_MS);
    expect(ruleStepMs(12) * (12 - 1)).toBeGreaterThan(RULE_START_CAP_MS - 1);
  });

  it("holds the cap exactly at 10 rows and never grows past 30ms", () => {
    expect(ruleStepMs(10)).toBe(30);
    expect(ruleStepMs(1)).toBe(30);
    expect(ruleStepMs(0)).toBe(30);
  });
});
