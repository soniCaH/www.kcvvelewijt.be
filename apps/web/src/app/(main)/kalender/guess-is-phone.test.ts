import { describe, it, expect } from "vitest";
import { guessIsPhone } from "./guess-is-phone";

describe("guessIsPhone (#3480)", () => {
  const req = (headers: Record<string, string>) => ({
    get: (name: string) => headers[name.toLowerCase()] ?? null,
  });

  it("trusts the sec-ch-ua-mobile client hint when it is sent", () => {
    expect(guessIsPhone(req({ "sec-ch-ua-mobile": "?1" }))).toBe(true);
    expect(guessIsPhone(req({ "sec-ch-ua-mobile": "?0" }))).toBe(false);
  });

  it("lets the hint beat the user agent", () => {
    expect(
      guessIsPhone(
        req({
          "sec-ch-ua-mobile": "?0",
          "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
        }),
      ),
    ).toBe(false);
  });

  it.each([
    [
      "iPhone Safari",
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    ],
    [
      "Android Chrome",
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
    ],
  ])("falls back to the user agent without a hint: %s", (_name, ua) => {
    expect(guessIsPhone(req({ "user-agent": ua }))).toBe(true);
  });

  it.each([
    [
      "desktop Chrome",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    ],
    [
      "iPad Chrome (carries Mobile/15E148 like an iPhone)",
      "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1",
    ],
    [
      "iPad (a tablet gets the desktop layout)",
      "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/604.1",
    ],
    [
      "Android tablet",
      "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    ],
  ])("is false for %s", (_name, ua) => {
    expect(guessIsPhone(req({ "user-agent": ua }))).toBe(false);
  });

  it("is false when the request carries neither header", () => {
    expect(guessIsPhone(req({}))).toBe(false);
  });
});
