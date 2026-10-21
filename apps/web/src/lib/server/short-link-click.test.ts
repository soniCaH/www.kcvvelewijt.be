import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendShortLinkClick } from "./short-link-click";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("GA4_MEASUREMENT_ID", "G-TEST123");
  vi.stubEnv("GA4_API_SECRET", "s3cret");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("sendShortLinkClick", () => {
  it("sends exactly one Measurement Protocol event for the link", async () => {
    await sendShortLinkClick("stage");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://www.google-analytics.com/mp/collect?measurement_id=G-TEST123&api_secret=s3cret",
    );
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      client_id: expect.any(String),
      events: [
        { name: "short_link_click", params: { short_link_name: "stage" } },
      ],
    });
  });

  it("forwards no visitor data: no IP, user agent or cookie, and a fresh client_id per hit", async () => {
    await sendShortLinkClick("stage");
    await sendShortLinkClick("stage");

    const [first, second] = fetchMock.mock.calls.map(([, init]) => init);
    for (const init of [first, second]) {
      const headers = Object.keys(init.headers ?? {}).map((h) =>
        h.toLowerCase(),
      );
      expect(headers).not.toContain("user-agent");
      expect(headers).not.toContain("x-forwarded-for");
      expect(headers).not.toContain("cookie");
      expect(JSON.parse(init.body)).not.toHaveProperty("user_id");
      expect(JSON.parse(init.body)).not.toHaveProperty("ip_override");
    }
    expect(JSON.parse(first.body).client_id).not.toBe(
      JSON.parse(second.body).client_id,
    );
  });

  it.each([["GA4_MEASUREMENT_ID"], ["GA4_API_SECRET"]])(
    "sends nothing and does not throw when %s is missing",
    async (name) => {
      vi.stubEnv(name, "");
      await expect(sendShortLinkClick("stage")).resolves.toBeUndefined();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("swallows a rejected fetch", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));
    await expect(sendShortLinkClick("stage")).resolves.toBeUndefined();
  });

  it("swallows a non-2xx answer", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 500 }));
    await expect(sendShortLinkClick("stage")).resolves.toBeUndefined();
  });
});
