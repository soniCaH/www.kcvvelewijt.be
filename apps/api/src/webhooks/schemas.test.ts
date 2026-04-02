import { describe, it, expect } from "vitest";
import { Schema as S } from "effect";
import { WebhookPayload } from "./schemas";

describe("WebhookPayload schema", () => {
  const decode = S.decodeUnknownEither(WebhookPayload);

  it("decodes a valid payload with _id and _type", () => {
    const result = decode({ _id: "doc-1", _type: "article" });
    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right._id).toBe("doc-1");
      expect(result.right._type).toBe("article");
    }
  });

  it("decodes a payload with optional _rev", () => {
    const result = decode({ _id: "doc-1", _type: "article", _rev: "rev-1" });
    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right._rev).toBe("rev-1");
    }
  });

  it("rejects payload missing _id", () => {
    const result = decode({ _type: "article" });
    expect(result._tag).toBe("Left");
  });

  it("rejects payload missing _type", () => {
    const result = decode({ _id: "doc-1" });
    expect(result._tag).toBe("Left");
  });

  it("rejects non-object payload", () => {
    const result = decode("not-an-object");
    expect(result._tag).toBe("Left");
  });

  it("rejects null payload", () => {
    const result = decode(null);
    expect(result._tag).toBe("Left");
  });

  it("strips unknown fields", () => {
    const result = decode({ _id: "doc-1", _type: "article", extra: "field" });
    expect(result._tag).toBe("Right");
    if (result._tag === "Right") {
      expect(result.right).not.toHaveProperty("extra");
    }
  });
});
