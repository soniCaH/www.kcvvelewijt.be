import { describe, expect, it } from "vitest";
import { parsePsdId } from "./psd-id";

describe("parsePsdId", () => {
  it.each(["123", "1", "3602", "999999999", "123456789"])(
    "accepts %s",
    (raw) => {
      expect(parsePsdId(raw)).toBe(Number(raw));
    },
  );

  // A leading zero is not a PSD id (#3483): `/wedstrijd/03602` would otherwise
  // render match 3602 under a second, self-canonical URL.
  it.each(["0", "03602", "000000001", "007"])(
    "rejects the leading-zero id %j",
    (raw) => {
      expect(parsePsdId(raw)).toBeNull();
    },
  );

  it.each(["123abc", "-1", "1234567890", "", " 1", "1.5", "1e3", "0x10"])(
    "rejects %j",
    (raw) => {
      expect(parsePsdId(raw)).toBeNull();
    },
  );
});
