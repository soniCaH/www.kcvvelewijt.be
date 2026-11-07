import { describe, it, expect, vi, beforeEach } from "vitest";

const { disable } = vi.hoisted(() => ({ disable: vi.fn() }));

vi.mock("next/headers", () => ({
  draftMode: async () => ({ isEnabled: true, disable }),
}));

import { GET } from "./route";

const disableUrl = (pathname?: string) => {
  const url = new URL("https://www.kcvvelewijt.be/api/preview/disable");
  if (pathname !== undefined)
    url.searchParams.set("sanity-preview-pathname", pathname);
  return new Request(url);
};

describe("GET /api/preview/disable", () => {
  beforeEach(() => disable.mockReset());

  it("disables preview mode and redirects to the given same-site path", async () => {
    const res = await GET(disableUrl("/nieuws/mijn-artikel"));
    expect(disable).toHaveBeenCalledOnce();
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(
      "https://www.kcvvelewijt.be/nieuws/mijn-artikel",
    );
  });

  it("falls back to the homepage for an off-site target", async () => {
    const res = await GET(disableUrl("//evil.example"));
    expect(disable).toHaveBeenCalledOnce();
    expect(res.headers.get("location")).toBe("https://www.kcvvelewijt.be/");
  });

  it.each([
    ["/.//evil.example"],
    ["/%2e//evil.example"],
    ["/a/..//evil.example"],
    ["/./\\evil.example"],
  ])(
    "never redirects off-site for the dot-segment target %s",
    async (target) => {
      const res = await GET(disableUrl(target));
      expect(new URL(res.headers.get("location")!).origin).toBe(
        "https://www.kcvvelewijt.be",
      );
    },
  );

  it("falls back to the homepage without a target", async () => {
    const res = await GET(disableUrl());
    expect(res.headers.get("location")).toBe("https://www.kcvvelewijt.be/");
  });
});
