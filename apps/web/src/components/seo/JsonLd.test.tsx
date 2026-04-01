import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

import { JsonLd } from "./JsonLd";

describe("JsonLd", () => {
  it("renders a script tag with type application/ld+json", () => {
    const { container } = render(
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Thing" }} />,
    );

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();
  });

  it("serializes the data as JSON in the script tag", () => {
    const data = {
      "@context": "https://schema.org" as const,
      "@type": "Organization" as const,
      name: "Test Org",
    };
    const { container } = render(<JsonLd data={data} />);

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(JSON.parse(script!.innerHTML)).toEqual(data);
  });

  it("escapes < to prevent script tag breakout", () => {
    const data = {
      "@context": "https://schema.org" as const,
      "@type": "Thing" as const,
      name: "</script><script>alert('xss')</script>",
    };
    const { container } = render(<JsonLd data={data} />);

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script!.innerHTML).not.toContain("</script>");
    expect(script!.innerHTML).toContain("\\u003c");
  });

  it("renders only a single script element", () => {
    const { container } = render(
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Thing" }} />,
    );

    expect(container.children).toHaveLength(1);
    expect(container.children[0].tagName).toBe("SCRIPT");
  });
});
