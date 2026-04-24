import { describe, expect, it } from "vitest";
import { parseEmbedUrl } from "./parseEmbedUrl";

describe("parseEmbedUrl", () => {
  describe("YouTube", () => {
    it("parses a standard watch URL (youtube.com/watch?v=)", () => {
      expect(
        parseEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
      ).toEqual({
        provider: "youtube",
        videoId: "dQw4w9WgXcQ",
      });
    });

    it("parses the bare-host variant (youtube.com/watch?v=)", () => {
      expect(parseEmbedUrl("https://youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
        provider: "youtube",
        videoId: "dQw4w9WgXcQ",
      });
    });

    it("parses the short URL form (youtu.be/<id>)", () => {
      expect(parseEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({
        provider: "youtube",
        videoId: "dQw4w9WgXcQ",
      });
    });

    it("tolerates trailing query parameters on youtu.be URLs", () => {
      expect(
        parseEmbedUrl("https://youtu.be/dQw4w9WgXcQ?t=120&feature=share"),
      ).toEqual({ provider: "youtube", videoId: "dQw4w9WgXcQ" });
    });

    it("parses embed/shorts/live URLs", () => {
      expect(
        parseEmbedUrl("https://www.youtube.com/embed/dQw4w9WgXcQ"),
      ).toEqual({
        provider: "youtube",
        videoId: "dQw4w9WgXcQ",
      });
      expect(
        parseEmbedUrl("https://www.youtube.com/shorts/abc-DEF_123"),
      ).toEqual({
        provider: "youtube",
        videoId: "abc-DEF_123",
      });
      expect(
        parseEmbedUrl("https://www.youtube.com/live/Some_Live-ID123"),
      ).toEqual({
        provider: "youtube",
        videoId: "Some_Live-ID123",
      });
    });

    it("returns null when the v= param is missing or empty", () => {
      expect(parseEmbedUrl("https://www.youtube.com/watch")).toBeNull();
      expect(parseEmbedUrl("https://www.youtube.com/watch?v=")).toBeNull();
    });

    it("returns null when the v= param is malformed", () => {
      expect(
        parseEmbedUrl("https://www.youtube.com/watch?v=has spaces"),
      ).toBeNull();
    });
  });

  describe("Vimeo", () => {
    it("parses a numeric-ID URL (vimeo.com/<id>)", () => {
      expect(parseEmbedUrl("https://vimeo.com/123456789")).toEqual({
        provider: "vimeo",
        videoId: "123456789",
      });
    });

    it("parses the www.vimeo.com host variant", () => {
      expect(parseEmbedUrl("https://www.vimeo.com/987654321")).toEqual({
        provider: "vimeo",
        videoId: "987654321",
      });
    });

    it("ignores trailing segments (album slug, review hash)", () => {
      expect(parseEmbedUrl("https://vimeo.com/123456789/abc123def")).toEqual({
        provider: "vimeo",
        videoId: "123456789",
      });
    });

    it("returns null for non-numeric Vimeo paths (channels/staffpicks)", () => {
      expect(parseEmbedUrl("https://vimeo.com/channels/staffpicks")).toBeNull();
    });

    it("returns null when the first path segment is empty", () => {
      expect(parseEmbedUrl("https://vimeo.com/")).toBeNull();
      expect(parseEmbedUrl("https://vimeo.com")).toBeNull();
    });
  });

  describe("rejection", () => {
    it("returns null for unsupported hosts", () => {
      expect(parseEmbedUrl("https://dailymotion.com/video/x123abc")).toBeNull();
      expect(
        parseEmbedUrl("https://evil.example.com/watch?v=dQw4w9WgXcQ"),
      ).toBeNull();
    });

    it("returns null for non-HTTPS schemes", () => {
      expect(
        parseEmbedUrl("http://www.youtube.com/watch?v=dQw4w9WgXcQ"),
      ).toBeNull();
    });

    it("returns null for malformed input", () => {
      expect(parseEmbedUrl("not a url")).toBeNull();
      expect(parseEmbedUrl("")).toBeNull();
      expect(parseEmbedUrl("   ")).toBeNull();
    });

    it("returns null for non-string inputs (defensive)", () => {
      // @ts-expect-error -- runtime guard against GROQ returning unexpected shapes
      expect(parseEmbedUrl(null)).toBeNull();
      // @ts-expect-error -- runtime guard against GROQ returning unexpected shapes
      expect(parseEmbedUrl(undefined)).toBeNull();
      // @ts-expect-error -- runtime guard against GROQ returning unexpected shapes
      expect(parseEmbedUrl(42)).toBeNull();
    });
  });
});
