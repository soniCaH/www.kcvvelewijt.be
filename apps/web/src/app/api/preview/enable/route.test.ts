import { describe, it, expect, vi, beforeEach } from "vitest";

const { validatePreviewUrl, enable, config } = vi.hoisted(() => ({
  validatePreviewUrl: vi.fn(),
  enable: vi.fn(),
  config: vi.fn(),
}));

vi.mock("@sanity/preview-url-secret", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sanity/preview-url-secret")>()),
  validatePreviewUrl,
}));
vi.mock("next/headers", () => ({
  draftMode: async () => ({ isEnabled: false, enable }),
}));
vi.mock("@/lib/sanity/client", () => ({
  sanityClient: { config: () => config() },
}));

import { GET } from "./route";

const enableUrl = (pathname: string | null, secret = "s3cret") => {
  const url = new URL("https://www.kcvvelewijt.be/api/preview/enable");
  url.searchParams.set("sanity-preview-secret", secret);
  if (pathname !== null)
    url.searchParams.set("sanity-preview-pathname", pathname);
  return new Request(url);
};

describe("GET /api/preview/enable", () => {
  beforeEach(() => {
    enable.mockReset();
    validatePreviewUrl.mockReset();
    validatePreviewUrl.mockResolvedValue({ isValid: true });
    config.mockReset();
    config.mockReturnValue({ projectId: "p", dataset: "d", token: "t" });
  });

  it.each([
    ["project id", { projectId: "", dataset: "d", token: "t" }],
    ["read token", { projectId: "p", dataset: "d", token: undefined }],
  ])("returns 503 without the %s", async (_label, cfg) => {
    config.mockReturnValue(cfg);
    const res = await GET(enableUrl("/nieuws/x"));
    expect(res.status).toBe(503);
    expect(enable).not.toHaveBeenCalled();
  });

  it("returns 401 and sets no cookie for a bad or expired secret", async () => {
    validatePreviewUrl.mockResolvedValue({ isValid: false });
    const res = await GET(enableUrl("/nieuws/x"));
    expect(res.status).toBe(401);
    expect(enable).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBeNull();
  });

  it("returns 401 for a missing secret", async () => {
    validatePreviewUrl.mockResolvedValue({ isValid: false });
    const res = await GET(enableUrl("/nieuws/x", ""));
    expect(res.status).toBe(401);
    expect(enable).not.toHaveBeenCalled();
  });

  it.each([
    ["a protocol-relative URL", "//evil.example/x"],
    ["an absolute URL", "https://evil.example/x"],
    ["a backslash host", "/\\evil.example"],
    ["a relative path", "nieuws/x"],
    ["no target", null],
  ])("returns 400 and sets no cookie for %s", async (_label, target) => {
    const res = await GET(enableUrl(target));
    expect(res.status).toBe(400);
    expect(enable).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBeNull();
  });

  it("enables preview mode and redirects 307 to the path for a valid secret", async () => {
    const res = await GET(enableUrl("/nieuws/mijn-artikel?x=1"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "https://www.kcvvelewijt.be/nieuws/mijn-artikel?x=1",
    );
    expect(enable).toHaveBeenCalledOnce();
  });
});
