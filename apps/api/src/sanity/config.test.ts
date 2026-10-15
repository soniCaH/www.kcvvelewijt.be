import { describe, expect, it } from "vitest";
import { makeTestEnv } from "../test-helpers/env-layer";
import { sanityClientConfig } from "./config";

describe("sanityClientConfig", () => {
  it("pins every BFF client to the published perspective (#3477)", () => {
    expect(sanityClientConfig(makeTestEnv()).perspective).toBe("published");
  });
});
