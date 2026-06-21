import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { revalidatePath, revalidateTag, isValidSignature } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  isValidSignature: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath, revalidateTag }));
vi.mock("@sanity/webhook", () => ({
  isValidSignature,
  SIGNATURE_HEADER_NAME: "sanity-webhook-signature",
}));

import { POST } from "./route";

function makeRequest(body: unknown, signature = "sig"): Request {
  return new Request("http://localhost:3000/api/revalidate", {
    method: "POST",
    headers: { "sanity-webhook-signature": signature },
    body: JSON.stringify(body),
  });
}

describe("POST /api/revalidate", () => {
  let savedSecret: string | undefined;

  beforeEach(() => {
    savedSecret = process.env.SANITY_REVALIDATE_SECRET;
    process.env.SANITY_REVALIDATE_SECRET = "test-secret";
    revalidatePath.mockReset();
    revalidateTag.mockReset();
    isValidSignature.mockReset();
    isValidSignature.mockResolvedValue(true);
  });

  afterEach(() => {
    if (savedSecret !== undefined) {
      process.env.SANITY_REVALIDATE_SECRET = savedSecret;
    } else {
      delete process.env.SANITY_REVALIDATE_SECRET;
    }
  });

  it("returns 503 when the secret is not configured", async () => {
    delete process.env.SANITY_REVALIDATE_SECRET;
    const res = await POST(makeRequest({ _type: "article", slug: "x" }));
    expect(res.status).toBe(503);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects an invalid signature with 401", async () => {
    isValidSignature.mockResolvedValue(false);
    const res = await POST(makeRequest({ _type: "article", slug: "x" }));
    expect(res.status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("revalidates article path + tag on a valid payload", async () => {
    const res = await POST(makeRequest({ _type: "article", slug: "hello" }));
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/nieuws");
    expect(revalidatePath).toHaveBeenCalledWith("/nieuws/hello");
    expect(revalidateTag).toHaveBeenCalledWith("articles", "max");
  });

  it("routes players by psdId, not slug", async () => {
    const res = await POST(makeRequest({ _type: "player", psdId: 42 }));
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith("/spelers/42");
    expect(revalidateTag).toHaveBeenCalledWith("players", "max");
  });

  it("routes staff by psdId, not slug", async () => {
    const res = await POST(makeRequest({ _type: "staffMember", psdId: 900 }));
    expect(res.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith("/staf/900");
    expect(revalidateTag).toHaveBeenCalledWith("staff", "max");
  });

  it("busts the banners tag + homepage on a homePage/banner change", async () => {
    await POST(makeRequest({ _type: "homePage" }));
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidateTag).toHaveBeenCalledWith("banners", "max");
  });

  it("revalidates both old and new slug on a rename", async () => {
    await POST(
      makeRequest({ _type: "team", slug: "new", previousSlug: "old" }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/ploegen/new");
    expect(revalidatePath).toHaveBeenCalledWith("/ploegen/old");
    expect(revalidateTag).toHaveBeenCalledWith("teams", "max");
  });

  it("acks unknown types with 200 and revalidates nothing", async () => {
    const res = await POST(makeRequest({ _type: "mysteryType" }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ revalidated: false });
    expect(revalidatePath).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
