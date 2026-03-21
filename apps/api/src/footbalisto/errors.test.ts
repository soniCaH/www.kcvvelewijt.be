import { describe, it, expect } from "vitest";
import {
  UpstreamUnavailableError,
  UpstreamDecodeError,
  ResourceNotFoundError,
} from "./errors";

describe("Typed BFF errors", () => {
  it("UpstreamUnavailableError has correct _tag and preserves status", () => {
    const err = new UpstreamUnavailableError({
      message: "PSD returned 429",
      status: 429,
    });
    expect(err._tag).toBe("UpstreamUnavailable");
    expect(err.message).toBe("PSD returned 429");
    expect(err.status).toBe(429);
  });

  it("UpstreamDecodeError has correct _tag and preserves cause", () => {
    const cause = new Error("parse error");
    const err = new UpstreamDecodeError({
      message: "Schema validation failed",
      cause,
    });
    expect(err._tag).toBe("UpstreamDecode");
    expect(err.message).toBe("Schema validation failed");
    expect(err.cause).toBe(cause);
  });

  it("ResourceNotFoundError has correct _tag with resource info", () => {
    const err = new ResourceNotFoundError({
      message: "Match not found",
      resourceType: "match",
      resourceId: 99,
    });
    expect(err._tag).toBe("ResourceNotFound");
    expect(err.message).toBe("Match not found");
    expect(err.resourceType).toBe("match");
    expect(err.resourceId).toBe(99);
  });
});
