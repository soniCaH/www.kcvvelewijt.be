import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  firstParam,
  narrowParam,
  readParam,
  writeHistoryFilterParam,
} from "./filterParam";

type Facet = "a" | "b" | "c";
const VALUES: readonly Facet[] = ["a", "b", "c"];

describe("narrowParam", () => {
  it("returns the raw value when it's a member of values", () => {
    expect(narrowParam("b", VALUES, "a")).toBe("b");
  });

  it("falls back on null", () => {
    expect(narrowParam(null, VALUES, "a")).toBe("a");
  });

  it("falls back on an unrecognised value", () => {
    expect(narrowParam("nonsense", VALUES, "a")).toBe("a");
  });
});

describe("readParam", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/evenementen");
  });

  it("reads a param from the live window.location.search", () => {
    window.history.replaceState({}, "", "/evenementen?type=b");
    expect(readParam("type")).toBe("b");
  });

  it("returns null when the param is absent", () => {
    expect(readParam("type")).toBeNull();
  });
});

describe("writeHistoryFilterParam", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/evenementen");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets the param and pushes a new history entry", () => {
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    writeHistoryFilterParam("type", "b", "a", { route: "/evenementen" });
    expect(pushStateSpy).toHaveBeenCalledWith(
      window.history.state,
      "",
      "/evenementen?type=b",
    );
  });

  it("deletes the param on a write back to the fallback", () => {
    window.history.replaceState({}, "", "/evenementen?type=b");
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    writeHistoryFilterParam("type", "a", "a", { route: "/evenementen" });
    expect(pushStateSpy).toHaveBeenCalledWith(
      window.history.state,
      "",
      "/evenementen",
    );
  });

  it("preserves an unrelated live URL param", () => {
    window.history.replaceState({}, "", "/evenementen?foo=bar");
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    writeHistoryFilterParam("type", "b", "a", { route: "/evenementen" });
    const [, , url] = pushStateSpy.mock.calls[0]! as [unknown, string, string];
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("foo")).toBe("bar");
    expect(params.get("type")).toBe("b");
  });

  it("appends the given hash", () => {
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    writeHistoryFilterParam("type", "b", "a", {
      route: "/evenementen",
      hash: "some-id",
    });
    expect(pushStateSpy).toHaveBeenCalledWith(
      window.history.state,
      "",
      "/evenementen?type=b#some-id",
    );
  });

  it("uses replaceState, not pushState, when replace is requested (#2783 review finding 3)", () => {
    const pushStateSpy = vi.spyOn(window.history, "pushState");
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    writeHistoryFilterParam("type", "b", "a", {
      route: "/evenementen",
      replace: true,
    });
    expect(replaceStateSpy).toHaveBeenCalledWith(
      window.history.state,
      "",
      "/evenementen?type=b",
    );
    expect(pushStateSpy).not.toHaveBeenCalled();
  });
});

describe("firstParam", () => {
  it("returns a plain value as is", () => {
    expect(firstParam("a")).toBe("a");
  });

  it("takes the first of a repeated value", () => {
    expect(firstParam(["a", "b"])).toBe("a");
  });

  it("passes undefined through", () => {
    expect(firstParam(undefined)).toBeUndefined();
  });
});
