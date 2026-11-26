import { afterEach, describe, expect, it, vi } from "vitest";

import { readPublicEnv } from "./client";

describe("public env (#3879)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reads the public vars and NODE_ENV as they are", () => {
    vi.stubEnv("NEXT_PUBLIC_HOST", "example.test");
    vi.stubEnv("NEXT_PUBLIC_GTM_ID", undefined);
    expect(readPublicEnv()).toMatchObject({
      NODE_ENV: "test",
      NEXT_PUBLIC_HOST: "example.test",
      NEXT_PUBLIC_GTM_ID: undefined,
    });
  });
});
