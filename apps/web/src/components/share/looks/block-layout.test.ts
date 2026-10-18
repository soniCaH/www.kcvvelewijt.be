import { describe, expect, it } from "vitest";
import { moveBlock, placeBlock, SNAP_PX } from "./block-layout";

// A block whose centre sits 100px left of the canvas centre (1080 / 2 = 540).
const base = {
  from: { x: 0, y: 0 },
  centre: 440,
  width: 1080,
  scale: 0.25,
};

describe("moveBlock", () => {
  it("divides the pointer delta by the preview scale", () => {
    expect(moveBlock({ ...base, dx: 10, dy: -5, snap: false })).toEqual({
      x: 40,
      y: -20,
      snapped: false,
    });
  });

  it("adds the delta to where the block already was", () => {
    expect(
      moveBlock({
        ...base,
        from: { x: 30, y: 50 },
        centre: 470,
        dx: 2,
        dy: 2,
        snap: false,
      }),
    ).toEqual({ x: 38, y: 58, snapped: false });
  });

  it("snaps the block's centre onto the canvas centre inside the threshold", () => {
    // 24.5 / 0.25 = 98 → centre at 538, 2px off the canvas centre.
    expect(moveBlock({ ...base, dx: 24.5, dy: 0, snap: true })).toEqual({
      x: 100,
      y: 0,
      snapped: true,
    });
  });

  it("does not snap outside the threshold", () => {
    const dx = (100 - SNAP_PX - 4) * 0.25;
    expect(moveBlock({ ...base, dx, dy: 0, snap: true })).toEqual({
      x: 100 - SNAP_PX - 4,
      y: 0,
      snapped: false,
    });
  });

  it("never snaps with Midden off", () => {
    expect(moveBlock({ ...base, dx: 24.5, dy: 0, snap: false })).toEqual({
      x: 98,
      y: 0,
      snapped: false,
    });
  });
});

describe("placeBlock", () => {
  it("moves the block to the last key, keeps its layer, stores only x/y/layer", () => {
    const next = placeBlock(
      {
        a: { x: 1, y: 1, layer: "achter" },
        b: { x: 0, y: 0, layer: "voor" },
      },
      "a",
      { x: 5, y: 6, snapped: true } as { x: number; y: number },
    );
    expect(Object.keys(next)).toEqual(["b", "a"]);
    expect(next.a).toEqual({ x: 5, y: 6, layer: "achter" });
  });
});
