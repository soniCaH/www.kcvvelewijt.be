import { Either } from "effect";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  readBffEnv,
  readBffEnvOrThrow,
  readOptionalServerEnv,
  readSanityEnv,
  readSanityEnvOrThrow,
} from "./server";

describe("server env (#3879)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("importing it with no env set does not throw; reading it does", async () => {
    vi.stubEnv("KCVV_API_URL", undefined);
    vi.stubEnv("BFF_SHARED_SECRET", undefined);
    vi.resetModules();
    const fresh = await vi.importActual<typeof import("./server")>("./server");
    expect(fresh.readBffEnvOrThrow).toThrow(/KCVV_API_URL is not set/);
  });

  it("reading an unset KCVV_API_URL throws a message that names it", () => {
    vi.stubEnv("KCVV_API_URL", undefined);
    expect(readBffEnvOrThrow).toThrow(/KCVV_API_URL is not set/);
  });

  it("treats a blank KCVV_API_URL as missing", () => {
    vi.stubEnv("KCVV_API_URL", "  ");
    expect(readBffEnvOrThrow).toThrow(/KCVV_API_URL is not set/);
  });

  it("names BFF_SHARED_SECRET when only that one is missing or blank", () => {
    vi.stubEnv("KCVV_API_URL", "http://localhost:8787");
    vi.stubEnv("BFF_SHARED_SECRET", " ");
    expect(readBffEnvOrThrow).toThrow(/BFF_SHARED_SECRET is not set/);
  });

  it("trims what it returns", () => {
    vi.stubEnv("KCVV_API_URL", " http://localhost:8787 ");
    vi.stubEnv("BFF_SHARED_SECRET", " secret ");
    expect(readBffEnvOrThrow()).toEqual({
      KCVV_API_URL: "http://localhost:8787",
      BFF_SHARED_SECRET: "secret",
    });
  });

  it("decodes once per distinct env, and again when a var changes", () => {
    vi.stubEnv("KCVV_API_URL", "http://a");
    const first = readBffEnv();
    expect(readBffEnv()).toBe(first);
    vi.stubEnv("KCVV_API_URL", "http://b");
    expect(readBffEnv()).not.toBe(first);
  });

  it("reads the optional vars as they are, unset ones as undefined", () => {
    vi.stubEnv("GA4_MEASUREMENT_ID", "G-TEST");
    vi.stubEnv("GA4_API_SECRET", undefined);
    expect(readOptionalServerEnv()).toMatchObject({
      GA4_MEASUREMENT_ID: "G-TEST",
      GA4_API_SECRET: undefined,
    });
  });

  it("requires the Sanity project id, not the dataset", () => {
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "abc");
    vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", undefined);
    expect(readSanityEnvOrThrow().NEXT_PUBLIC_SANITY_DATASET).toBeUndefined();

    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "");
    expect(Either.isLeft(readSanityEnv())).toBe(true);
    expect(readSanityEnvOrThrow).toThrow(/NEXT_PUBLIC_SANITY_PROJECT_ID/);
  });
});
