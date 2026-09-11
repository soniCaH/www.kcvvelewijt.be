import { describe, it, expect } from "vitest";
import { HttpApiSchema } from "@effect/platform";
import {
  HttpServiceUnavailable,
  HttpBadGateway,
  HttpNotFound,
  HttpBadRequest,
} from "./http-errors";

// `@effect/platform` reads the status @effect/platform actually serves from
// a dedicated annotation set via `HttpApiSchema.annotations({ status })` —
// not from a plain third-argument schema annotation. A bare `{ status }`
// third argument to `S.TaggedError` type-checks but is inert: every error
// class silently falls back to the default 500. `tsc` cannot see this, so
// only a runtime assertion against `HttpApiSchema.getStatusError` pins it.
describe("HTTP error classes declare their status for @effect/platform", () => {
  it("HttpServiceUnavailable resolves to 503", () => {
    expect(HttpApiSchema.getStatusError(HttpServiceUnavailable)).toBe(503);
  });

  it("HttpBadGateway resolves to 502", () => {
    expect(HttpApiSchema.getStatusError(HttpBadGateway)).toBe(502);
  });

  it("HttpNotFound resolves to 404", () => {
    expect(HttpApiSchema.getStatusError(HttpNotFound)).toBe(404);
  });

  it("HttpBadRequest resolves to 400", () => {
    expect(HttpApiSchema.getStatusError(HttpBadRequest)).toBe(400);
  });
});
