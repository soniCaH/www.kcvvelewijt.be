import { describe, it, expect } from "vitest";
import { extractStableImageUrl, needsUpload } from "./image-upload-utils";

const BASE_URL = "https://kcvv.prosoccerdata.com";

describe("extractStableImageUrl", () => {
  it("strips profileAccessKey but retains ?v=N", () => {
    const result = extractStableImageUrl(
      "/api/v2/members/profilepicture/6453?profileAccessKey=abc123&v=1",
      BASE_URL,
    );
    expect(result).toBe(
      "https://kcvv.prosoccerdata.com/api/v2/members/profilepicture/6453?v=1",
    );
  });

  it("returns null for null URL", () => {
    expect(extractStableImageUrl(null, BASE_URL)).toBeNull();
  });

  it("returns URL without ?v= when v param is absent", () => {
    const result = extractStableImageUrl(
      "/api/v2/members/profilepicture/6453?profileAccessKey=newkey999",
      BASE_URL,
    );
    expect(result).toBe(
      "https://kcvv.prosoccerdata.com/api/v2/members/profilepicture/6453",
    );
  });

  it("handles URL with no query params at all", () => {
    const result = extractStableImageUrl(
      "/api/v2/members/profilepicture/6453",
      BASE_URL,
    );
    expect(result).toBe(
      "https://kcvv.prosoccerdata.com/api/v2/members/profilepicture/6453",
    );
  });

  it("retains v=0", () => {
    const result = extractStableImageUrl(
      "/api/v2/members/profilepicture/6453?profileAccessKey=key&v=0",
      BASE_URL,
    );
    expect(result).toBe(
      "https://kcvv.prosoccerdata.com/api/v2/members/profilepicture/6453?v=0",
    );
  });
});

describe("needsUpload", () => {
  it("returns true when no existing image (existingPsdImageUrl is null)", () => {
    expect(needsUpload("https://example.com/img?v=1", null)).toBe(true);
  });

  it("returns true when no existing image (existingPsdImageUrl is undefined)", () => {
    expect(needsUpload("https://example.com/img?v=1", undefined)).toBe(true);
  });

  it("returns true when stableUrl differs from existing (version change)", () => {
    expect(
      needsUpload("https://example.com/img?v=2", "https://example.com/img?v=1"),
    ).toBe(true);
  });

  it("returns false when stableUrl matches existing", () => {
    expect(
      needsUpload("https://example.com/img?v=1", "https://example.com/img?v=1"),
    ).toBe(false);
  });

  it("returns false when stableUrl is null (no profile picture)", () => {
    expect(needsUpload(null, null)).toBe(false);
  });

  it("returns false when stableUrl is null even if existing has image", () => {
    expect(needsUpload(null, "https://example.com/img?v=1")).toBe(false);
  });
});
