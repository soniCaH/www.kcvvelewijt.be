import { describe, expect, it } from "vitest";
import {
  selectStaffToUnset,
  selectUnreferencedPortraitAssets,
  type AssetRow,
  type StaffRow,
} from "./plan";

describe("selectStaffToUnset", () => {
  it("selects the staff documents that hold a birth date, drafts included", () => {
    const rows: StaffRow[] = [
      { _id: "staffMember-psd-1", _rev: "a", birthDate: "1975-04-12" },
      { _id: "drafts.staffMember-psd-2", _rev: "b", birthDate: "1980-01-01" },
      { _id: "staffMember-psd-3", _rev: "c", birthDate: null },
      { _id: "staffMember-psd-4", _rev: "d" },
    ];
    expect(selectStaffToUnset(rows).map((r) => r._id)).toEqual([
      "staffMember-psd-1",
      "drafts.staffMember-psd-2",
    ]);
  });
});

describe("selectUnreferencedPortraitAssets", () => {
  const asset = (
    originalFilename: string | null | undefined,
    refs: number,
  ): AssetRow => ({
    _id: `image-${originalFilename ?? "none"}-${refs}`,
    _rev: "r",
    originalFilename,
    refs,
  });

  it("selects PSD portrait assets with no reference", () => {
    const rows = [
      asset("player-psd-42.jpg", 0),
      asset("staffMember-psd-8.jpg", 0),
    ];
    expect(selectUnreferencedPortraitAssets(rows)).toEqual(rows);
  });

  it("keeps a portrait asset that is still referenced", () => {
    expect(
      selectUnreferencedPortraitAssets([asset("player-psd-42.jpg", 1)]),
    ).toEqual([]);
  });

  it("never selects an asset that is not a PSD portrait", () => {
    expect(
      selectUnreferencedPortraitAssets([
        asset("hero-banner.jpg", 0),
        asset("team-psd-3.jpg", 0),
        asset("xplayer-psd-1.jpg", 0),
        asset(null, 0),
        asset(undefined, 0),
      ]),
    ).toEqual([]);
  });
});
