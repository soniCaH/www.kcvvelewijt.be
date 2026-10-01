/**
 * Membership API Route Tests (#3348)
 *
 * The route is a thin proxy to the BFF `/forms/membership`. Only the outer
 * boundary is mocked — global `fetch` and `KCVV_API_URL`; the route itself
 * (and `NextResponse`) run for real. The behaviour that matters: the form
 * renders per-field errors from the BFF's 400 body, so that body and status
 * must pass through unchanged.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";

const TEST_BFF_URL = "http://localhost:8787";

function makeRequest(body: BodyInit): Request {
  return new Request("http://localhost:3000/api/membership", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("POST /api/membership", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.stubEnv("KCVV_API_URL", TEST_BFF_URL);
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns 503 with the Dutch 'not available' message when KCVV_API_URL is unset", async () => {
    vi.stubEnv("KCVV_API_URL", undefined);

    const response = await POST(makeRequest(JSON.stringify({ name: "Jan" })));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      error: "Inschrijvingen zijn momenteel niet beschikbaar.",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is not JSON, without calling the BFF", async () => {
    const response = await POST(makeRequest("not json {"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      ok: false,
      error: "Ongeldige aanvraag.",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("forwards the body to the BFF membership endpoint", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json({ ok: true }, { status: 200 }),
    );
    const payload = { firstName: "Jan", lastName: "Janssens" };

    const response = await POST(makeRequest(JSON.stringify(payload)));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      `${TEST_BFF_URL}/forms/membership`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
  });

  it("passes a BFF 400 field-error body and status through unchanged", async () => {
    const fieldErrors = {
      ok: false,
      errors: { email: "Ongeldig e-mailadres" },
    };
    vi.mocked(fetch).mockResolvedValueOnce(
      Response.json(fieldErrors, { status: 400 }),
    );

    const response = await POST(makeRequest(JSON.stringify({ email: "x" })));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(fieldErrors);
  });

  it.each([
    { bffStatus: 502, ok: false },
    { bffStatus: 200, ok: true },
  ])(
    "answers { ok: $ok } with the BFF status $bffStatus when the BFF body is not JSON",
    async ({ bffStatus, ok }) => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response("<html>Bad gateway</html>", { status: bffStatus }),
      );

      const response = await POST(makeRequest(JSON.stringify({})));

      expect(response.status).toBe(bffStatus);
      expect(await response.json()).toEqual({ ok });
    },
  );

  it("returns 500 and logs when fetch throws", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network down"));

    const response = await POST(makeRequest(JSON.stringify({})));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      error: "Inschrijving kon niet worden verzonden.",
    });
    expect(console.error).toHaveBeenCalledWith(
      "[Membership API] Proxy error:",
      expect.any(Error),
    );
  });
});
