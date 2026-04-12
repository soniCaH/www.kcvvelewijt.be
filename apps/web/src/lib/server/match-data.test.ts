import { describe, it, expect, vi } from "vitest";

vi.mock("react", () => ({
  cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

vi.mock("@/lib/effect/runtime", () => ({
  runPromise: vi.fn(),
}));

vi.mock("@/lib/mappers", () => ({
  mapMatchesToUpcomingMatches: vi.fn(),
}));

import { runPromise } from "@/lib/effect/runtime";
import { mapMatchesToUpcomingMatches } from "@/lib/mappers";
import { getFirstTeamNextMatch } from "./match-data";

const runPromiseMock = vi.mocked(runPromise);
const mapperMock = vi.mocked(mapMatchesToUpcomingMatches);

describe("getFirstTeamNextMatch", () => {
  it("returns the first UpcomingMatch when BFF returns matches", async () => {
    const fakeMatch = { id: 42 };
    const fakeUpcoming = [
      { id: 42, status: "scheduled" },
      { id: 43, status: "finished" },
    ];

    runPromiseMock.mockResolvedValue([fakeMatch]);
    mapperMock.mockReturnValue(fakeUpcoming as never);

    const result = await getFirstTeamNextMatch();

    expect(result).toEqual({ id: 42, status: "scheduled" });
    expect(mapperMock).toHaveBeenCalledWith([fakeMatch]);
  });

  it("returns null when BFF returns empty array", async () => {
    runPromiseMock.mockResolvedValue([]);
    mapperMock.mockReturnValue([]);

    const result = await getFirstTeamNextMatch();

    expect(result).toBeNull();
  });

  it("returns null when BFF call fails", async () => {
    runPromiseMock.mockRejectedValue(new Error("BFF down"));

    const result = await getFirstTeamNextMatch();

    expect(result).toBeNull();
  });
});
