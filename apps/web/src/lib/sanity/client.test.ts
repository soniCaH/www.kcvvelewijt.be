import { describe, it, expect, vi } from "vitest";

// Real SanityClient, no network: `config()` only reads what was passed in.
vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "test-project");

import { sanityClient, sanityPreviewClient } from "./client";

describe("Sanity clients (#3619)", () => {
  it("keeps the visitor client on the published perspective and the CDN", () => {
    expect(sanityClient.config()).toMatchObject({
      perspective: "published",
      useCdn: true,
    });
  });

  it("reads unpublished changes through the drafts perspective, without the CDN", () => {
    expect(sanityPreviewClient.config()).toMatchObject({
      perspective: "drafts",
      useCdn: false,
    });
  });
});
