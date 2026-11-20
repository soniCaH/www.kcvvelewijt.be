/**
 * #3812: the event day in the mails comes from `Intl` with the `nl-BE` locale.
 * Node has full ICU; this proves the deployed runtime formats it the same way,
 * so the approved copy ("zaterdag 19 december") holds in production too.
 */
import { describe, it, expect } from "vitest";
import { formatEventDay } from "./darts-emails";

describe("formatEventDay in workerd", () => {
  it("writes the day the way the approved copy does", () => {
    expect(formatEventDay("2026-12-19")).toBe("zaterdag 19 december");
  });
});
