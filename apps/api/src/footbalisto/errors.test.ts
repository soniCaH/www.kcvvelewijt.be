import { describe, it, expect } from "vitest";
import {
  UpstreamUnavailableError,
  UpstreamClientError,
  UpstreamDecodeError,
  ResourceNotFoundError,
  shouldServeStale,
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

  it("UpstreamClientError has correct _tag and preserves status/url", () => {
    const err = new UpstreamClientError({
      message: "HTTP 401: Unauthorized",
      status: 401,
      url: "https://api.example.com/foo",
    });
    expect(err._tag).toBe("UpstreamClient");
    expect(err.message).toBe("HTTP 401: Unauthorized");
    expect(err.status).toBe(401);
    expect(err.url).toBe("https://api.example.com/foo");
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

describe("shouldServeStale", () => {
  it("returns true for UpstreamUnavailableError (transient)", () => {
    const err = new UpstreamUnavailableError({
      message: "PSD returned 503",
      status: 503,
    });
    expect(shouldServeStale(err)).toBe(true);
  });

  it("returns true for UpstreamUnavailableError with 429", () => {
    const err = new UpstreamUnavailableError({
      message: "PSD returned 429",
      status: 429,
    });
    expect(shouldServeStale(err)).toBe(true);
  });

  it("returns false for UpstreamClientError", () => {
    const err = new UpstreamClientError({
      message: "HTTP 401: Unauthorized",
      status: 401,
      url: "https://api.example.com/foo",
    });
    expect(shouldServeStale(err)).toBe(false);
  });

  it("returns false for UpstreamDecodeError", () => {
    const err = new UpstreamDecodeError({
      message: "Schema validation failed",
      cause: new Error("parse error"),
    });
    expect(shouldServeStale(err)).toBe(false);
  });

  it("returns false for ResourceNotFoundError", () => {
    const err = new ResourceNotFoundError({
      message: "Match not found",
      resourceType: "match",
      resourceId: 99,
    });
    expect(shouldServeStale(err)).toBe(false);
  });
});
