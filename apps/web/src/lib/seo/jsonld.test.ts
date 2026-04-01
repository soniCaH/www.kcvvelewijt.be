import { describe, it, expect } from "vitest";

import {
  buildSportsClubJsonLd,
  buildNewsArticleJsonLd,
  buildBreadcrumbJsonLd,
  type NewsArticleInput,
} from "./jsonld";

describe("buildSportsClubJsonLd", () => {
  it("returns a valid SportsClub + Organization schema", () => {
    const result = buildSportsClubJsonLd();

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toEqual(["SportsClub", "Organization"]);
    expect(result.name).toBe("KCVV Elewijt");
    expect(result.url).toBe("https://www.kcvvelewijt.be");
    expect(result.sport).toBe("Soccer");
    expect(result.foundingDate).toBe("1924");
  });

  it("includes an absolute logo URL", () => {
    const result = buildSportsClubJsonLd();

    expect(result.logo).toMatch(/^https:\/\/www\.kcvvelewijt\.be\//);
  });

  it("includes sameAs as an array of URLs", () => {
    const result = buildSportsClubJsonLd();

    expect(Array.isArray(result.sameAs)).toBe(true);
    for (const url of result.sameAs as string[]) {
      expect(url).toMatch(/^https?:\/\//);
    }
  });

  it("includes a PostalAddress", () => {
    const result = buildSportsClubJsonLd();

    expect(result.address).toBeDefined();
    const address = result.address as {
      "@type": string;
      addressLocality: string;
      addressCountry: string;
    };
    expect(address["@type"]).toBe("PostalAddress");
    expect(address.addressLocality).toBeDefined();
    expect(address.addressCountry).toBe("BE");
  });
});

describe("buildNewsArticleJsonLd", () => {
  const input: NewsArticleInput = {
    headline: "Test Article Title",
    datePublished: "2026-03-15T10:00:00Z",
    dateModified: "2026-03-16T12:00:00Z",
    author: "KCVV Elewijt",
    image: "https://cdn.sanity.io/images/test/cover.webp",
    url: "https://www.kcvvelewijt.be/nieuws/test-article",
  };

  it("returns a valid NewsArticle schema", () => {
    const result = buildNewsArticleJsonLd(input);

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("NewsArticle");
    expect(result.headline).toBe("Test Article Title");
    expect(result.datePublished).toBe("2026-03-15T10:00:00Z");
    expect(result.dateModified).toBe("2026-03-16T12:00:00Z");
    expect(result.url).toBe("https://www.kcvvelewijt.be/nieuws/test-article");
  });

  it("includes author as an Organization", () => {
    const result = buildNewsArticleJsonLd(input);

    expect(result.author).toEqual({
      "@type": "Organization",
      name: "KCVV Elewijt",
    });
  });

  it("includes publisher with logo", () => {
    const result = buildNewsArticleJsonLd(input);

    const publisher = result.publisher as {
      "@type": string;
      name: string;
      logo: { "@type": string };
    };
    expect(publisher["@type"]).toBe("Organization");
    expect(publisher.name).toBe("KCVV Elewijt");
    expect(publisher.logo).toBeDefined();
    expect(publisher.logo["@type"]).toBe("ImageObject");
  });

  it("includes image as absolute URL", () => {
    const result = buildNewsArticleJsonLd(input);

    expect(result.image).toBe("https://cdn.sanity.io/images/test/cover.webp");
  });

  it("handles missing optional fields", () => {
    const minimal: NewsArticleInput = {
      headline: "Minimal Article",
      datePublished: "2026-01-01",
      url: "https://www.kcvvelewijt.be/nieuws/minimal",
    };
    const result = buildNewsArticleJsonLd(minimal);

    expect(result.headline).toBe("Minimal Article");
    expect(result.dateModified).toBeUndefined();
    expect(result.image).toBeUndefined();
    expect(result.author).toEqual({
      "@type": "Organization",
      name: "KCVV Elewijt",
    });
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("returns a valid BreadcrumbList schema", () => {
    const result = buildBreadcrumbJsonLd([
      { name: "Home", url: "https://www.kcvvelewijt.be" },
    ]);

    expect(result["@context"]).toBe("https://schema.org");
    expect(result["@type"]).toBe("BreadcrumbList");
  });

  it("creates ListItem elements with correct positions", () => {
    const result = buildBreadcrumbJsonLd([
      { name: "Home", url: "https://www.kcvvelewijt.be" },
      { name: "Nieuws", url: "https://www.kcvvelewijt.be/nieuws" },
      {
        name: "Test Article",
        url: "https://www.kcvvelewijt.be/nieuws/test-article",
      },
    ]);

    const items = result.itemListElement as Array<{
      "@type": string;
      position: number;
      name: string;
      item: string;
    }>;
    expect(items).toHaveLength(3);
    expect(items[0]).toEqual({
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://www.kcvvelewijt.be",
    });
    expect(items[1]).toEqual({
      "@type": "ListItem",
      position: 2,
      name: "Nieuws",
      item: "https://www.kcvvelewijt.be/nieuws",
    });
    expect(items[2]).toEqual({
      "@type": "ListItem",
      position: 3,
      name: "Test Article",
      item: "https://www.kcvvelewijt.be/nieuws/test-article",
    });
  });

  it("handles a single Home breadcrumb", () => {
    const result = buildBreadcrumbJsonLd([
      { name: "Home", url: "https://www.kcvvelewijt.be" },
    ]);

    const items = result.itemListElement as Array<{
      "@type": string;
      position: number;
    }>;
    expect(items).toHaveLength(1);
    expect(items[0].position).toBe(1);
  });
});
