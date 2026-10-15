import { describe, expect, it } from "vitest";
import { parsePsdId } from "./psd-id";

describe("parsePsdId", () => {
  it.each(["123", "1", "0", "007", "123456789"])("accepts %s", (raw) => {
    expect(parsePsdId(raw)).toBe(Number(raw));
  });

  it.each(["123abc", "-1", "1234567890", "", " 1", "1.5", "1e3", "0x10"])(
    "rejects %j",
    (raw) => {
      expect(parsePsdId(raw)).toBeNull();
    },
  );
});
