import { describe, it, expect } from "vitest";
import {
  UpstreamUnavailableError,
  UpstreamDecodeError,
  ResourceNotFoundError,
} from "../footbalisto/errors";
import { mapBffErrorToHttpError } from "./error-mapping";
import {
  HttpServiceUnavailable,
  HttpBadGateway,
  HttpNotFound,
} from "@kcvv/api-contract";

describe("mapBffErrorToHttpError", () => {
  it("maps UpstreamUnavailableError to HttpServiceUnavailable", () => {
    const err = new UpstreamUnavailableError({
      message: "PSD returned 429",
      status: 429,
    });
    const result = mapBffErrorToHttpError(err);
    expect(result).toBeInstanceOf(HttpServiceUnavailable);
    expect(result.error).toBe("Service temporarily unavailable");
  });

  it("maps UpstreamDecodeError to HttpBadGateway", () => {
    const err = new UpstreamDecodeError({
      message: "Schema validation failed",
    });
    const result = mapBffErrorToHttpError(err);
    expect(result).toBeInstanceOf(HttpBadGateway);
    expect(result.error).toBe("Bad gateway");
  });

  it("maps ResourceNotFoundError to HttpNotFound", () => {
    const err = new ResourceNotFoundError({
      message: "Match not found",
      resourceType: "match",
      resourceId: 99,
    });
    const result = mapBffErrorToHttpError(err);
    expect(result).toBeInstanceOf(HttpNotFound);
    expect(result.error).toBe("Not found");
  });
});
