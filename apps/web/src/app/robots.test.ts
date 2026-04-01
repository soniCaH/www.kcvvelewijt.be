import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("robots.ts", () => {
  let savedVercelEnv: string | undefined;

  beforeEach(() => {
    savedVercelEnv = process.env.VERCEL_ENV;
  });

  afterEach(() => {
    if (savedVercelEnv !== undefined) {
      process.env.VERCEL_ENV = savedVercelEnv;
    } else {
      delete process.env.VERCEL_ENV;
    }
  });

  it("allows full crawl in production", async () => {
    process.env.VERCEL_ENV = "production";
    const { default: robots } = await import("./robots");
    const result = robots();

    expect(result).toEqual({
      rules: { userAgent: "*", allow: ["/", "/llms.txt"] },
      sitemap: "https://www.kcvvelewijt.be/sitemap.xml",
    });
  });

  it("disallows crawl in non-production environments", async () => {
    process.env.VERCEL_ENV = "preview";
    const { default: robots } = await import("./robots");
    const result = robots();

    expect(result).toEqual({
      rules: { userAgent: "*", disallow: "/" },
      sitemap: "https://www.kcvvelewijt.be/sitemap.xml",
    });
  });

  it("explicitly allows /llms.txt in production", async () => {
    process.env.VERCEL_ENV = "production";
    const { default: robots } = await import("./robots");
    const result = robots();
    const rules = result.rules as { allow: string[] };

    expect(rules.allow).toContain("/llms.txt");
  });
});
