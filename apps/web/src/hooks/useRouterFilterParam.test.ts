import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRouterFilterParam } from "./useRouterFilterParam";

type Facet = "a" | "b" | "c";
const VALUES: readonly Facet[] = ["a", "b", "c"];

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

describe("useRouterFilterParam", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    window.history.replaceState({}, "", "/kalender");
  });

  it("falls back when the param is absent", () => {
    const { result } = renderHook(() =>
      useRouterFilterParam("type", VALUES, {
        fallback: "a",
        route: "/kalender",
      }),
    );
    expect(result.current[0]).toBe("a");
  });

  it("narrows to the param when it's a recognised value", () => {
    mockSearchParams = new URLSearchParams("type=b");
    const { result } = renderHook(() =>
      useRouterFilterParam("type", VALUES, {
        fallback: "a",
        route: "/kalender",
      }),
    );
    expect(result.current[0]).toBe("b");
  });

  it("falls back on an unrecognised param value", () => {
    mockSearchParams = new URLSearchParams("type=nonsense");
    const { result } = renderHook(() =>
      useRouterFilterParam("type", VALUES, {
        fallback: "a",
        route: "/kalender",
      }),
    );
    expect(result.current[0]).toBe("a");
  });

  it("pushes the param with scroll:false on a new selection", () => {
    const { result } = renderHook(() =>
      useRouterFilterParam("type", VALUES, {
        fallback: "a",
        route: "/kalender",
      }),
    );
    act(() => result.current[1]("b"));
    expect(mockPush).toHaveBeenCalledWith("/kalender?type=b", {
      scroll: false,
    });
  });

  it("deletes the param on a write back to the fallback", () => {
    mockSearchParams = new URLSearchParams("type=b");
    const { result } = renderHook(() =>
      useRouterFilterParam("type", VALUES, {
        fallback: "a",
        route: "/kalender",
      }),
    );
    act(() => result.current[1]("a"));
    expect(mockPush).toHaveBeenCalledWith("/kalender", { scroll: false });
  });

  it("does not push when the selection matches the current value (dedup guard)", () => {
    mockSearchParams = new URLSearchParams("type=b");
    const { result } = renderHook(() =>
      useRouterFilterParam("type", VALUES, {
        fallback: "a",
        route: "/kalender",
      }),
    );
    act(() => result.current[1]("b"));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("preserves an unrelated param already on the live URL on write", () => {
    // The merge base is window.location.search (see the hook's docblock,
    // round 2 of the #2783 review), so it's the live URL — not
    // mockSearchParams — that has to carry the sibling param here.
    window.history.replaceState({}, "", "/kalender?view=week");
    mockSearchParams = new URLSearchParams("view=week");
    const { result } = renderHook(() =>
      useRouterFilterParam("type", VALUES, {
        fallback: "a",
        route: "/kalender",
      }),
    );
    act(() => result.current[1]("b"));
    const pushedUrl = mockPush.mock.calls[0]![0] as string;
    const params = new URLSearchParams(pushedUrl.split("?")[1]);
    expect(params.get("view")).toBe("week");
    expect(params.get("type")).toBe("b");
  });

  it("preserves a param written via history.replaceState that useSearchParams() never observed (PR #2783 review round 2)", () => {
    // The asymmetry IS the bug this locks in: HubMemberPanel writes
    // ?member=/?holder= via a raw window.history.replaceState, which
    // Next's useSearchParams() never observes — so the live URL and the
    // mocked useSearchParams() deliberately disagree here, exactly as they
    // do in the browser whenever the member panel is open on /hulp.
    window.history.replaceState({}, "", "/hulp?member=president");
    mockSearchParams = new URLSearchParams(); // useSearchParams() never saw the replaceState write
    const { result } = renderHook(() =>
      useRouterFilterParam("categorie", VALUES, {
        fallback: "a",
        route: "/hulp",
      }),
    );
    act(() => result.current[1]("b"));
    const pushedUrl = mockPush.mock.calls[0]![0] as string;
    const params = new URLSearchParams(pushedUrl.split("?")[1]);
    expect(params.get("member")).toBe("president");
    expect(params.get("categorie")).toBe("b");
  });
});
