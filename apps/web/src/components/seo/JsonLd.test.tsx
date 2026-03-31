import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

import { JsonLd } from "./JsonLd";

describe("JsonLd", () => {
  it("renders a script tag with type application/ld+json", () => {
    const data = { "@context": "https://schema.org", "@type": "Thing" };
    const { container } = render(<JsonLd data={data} />);

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).not.toBeNull();
  });

  it("serializes the data as JSON in the script tag", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Test Org",
    };
    const { container } = render(<JsonLd data={data} />);

    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(JSON.parse(script!.innerHTML)).toEqual(data);
  });

  it("renders only a single script element", () => {
    const data = { "@context": "https://schema.org" };
    const { container } = render(<JsonLd data={data} />);

    expect(container.children).toHaveLength(1);
    expect(container.children[0].tagName).toBe("SCRIPT");
  });
});
