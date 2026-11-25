import { describe, it, expect, beforeEach, afterEach } from "vitest";

// Safe despite the env mutation below: `robots()` reads
// `process.env.VERCEL_ENV` inside its body at call time, so nothing is captured
// when the module is evaluated and there is nothing to re-evaluate. (The
// previous in-body `await import()` bought nothing either — no
// `vi.resetModules()`, so it returned the same cached module every time.)
import robots from "./robots";

describe("robots.ts", () => {
  const saved: { value?: string } = {};

  beforeEach(() => {
    saved.value = process.env.VERCEL_ENV;
  });

  afterEach(() => {
    if (saved.value !== undefined) {
      process.env.VERCEL_ENV = saved.value;
    } else {
      delete process.env.VERCEL_ENV;
    }
  });

  it("allows the site and disallows the opponent pages in production", () => {
    process.env.VERCEL_ENV = "production";
    const result = robots();

    expect(result).toEqual({
      rules: {
        userAgent: "*",
        allow: ["/", "/llms.txt"],
        disallow: ["/tegenstander/"],
      },
      sitemap: "https://www.kcvvelewijt.be/sitemap.xml",
    });
  });

  it("disallows crawl in non-production environments", () => {
    process.env.VERCEL_ENV = "preview";
    const result = robots();

    expect(result).toEqual({
      rules: { userAgent: "*", disallow: "/" },
      sitemap: "https://www.kcvvelewijt.be/sitemap.xml",
    });
  });

  it("explicitly allows /llms.txt in production", () => {
    process.env.VERCEL_ENV = "production";
    const result = robots();
    const rules = result.rules as { allow: string[] };

    expect(rules.allow).toContain("/llms.txt");
  });
});
