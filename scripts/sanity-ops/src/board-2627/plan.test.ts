import { describe, expect, it } from "vitest";
import {
  NODE_CREATES,
  NODE_UPDATES,
  STAFF,
  STAFF_CREATES,
  TOPIC_UPDATES,
  preflight,
  type Snapshot,
} from "./plan";

/** A snapshot of the dataset exactly as it was before the update ran. */
function beforeSnapshot(): Snapshot {
  const staff: Snapshot["staff"] = {};
  for (const [id, name] of Object.entries(STAFF))
    staff[id] = { name, archived: false };
  for (const s of STAFF_CREATES) delete staff[s._id];

  const nodes: Snapshot["nodes"] = {};
  for (const n of NODE_UPDATES) nodes[n.id] = { rev: "r1" };
  for (const n of NODE_CREATES) nodes[n.parent] = { rev: "r1" };

  const topics: Snapshot["topics"] = {};
  for (const t of TOPIC_UPDATES) {
    topics[t.id] = {
      rev: "r1",
      values: Object.fromEntries(t.changes.map((c) => [c.path, c.from])),
    };
  }
  return { staff, nodes, topics, pending: [] };
}

/** The same dataset after a successful run: every topic field holds its new value. */
function afterSnapshot(): Snapshot {
  const snap = beforeSnapshot();
  for (const t of TOPIC_UPDATES) {
    snap.topics[t.id] = {
      rev: "r2",
      values: Object.fromEntries(t.changes.map((c) => [c.path, c.to])),
    };
  }
  for (const s of STAFF_CREATES)
    snap.staff[s._id] = { name: `${s.firstName} ${s.lastName}` };
  for (const n of NODE_CREATES) snap.nodes[n._id] = { rev: "r1" };
  return snap;
}

describe("preflight", () => {
  it("passes on the dataset as it was before the update", () => {
    expect(preflight(beforeSnapshot())).toEqual([]);
  });

  it("passes again after the update ran, so a re-run is safe", () => {
    expect(preflight(afterSnapshot())).toEqual([]);
  });

  it("refuses when a person id now belongs to someone else", () => {
    const snap = beforeSnapshot();
    snap.staff["staffMember-psd-823"] = { name: "Someone Else" };
    expect(preflight(snap)).toEqual([
      'staffMember-psd-823 is "Someone Else", expected "Paul Vanhamme"',
    ]);
  });

  it("refuses when a person is missing or archived", () => {
    const snap = beforeSnapshot();
    delete snap.staff["staffMember-psd-12849"];
    snap.staff["staffMember-psd-824"] = {
      name: "Koen Van Loock",
      archived: true,
    };
    expect(preflight(snap)).toEqual([
      "staffMember-psd-824 (Koen Van Loock) is archived",
      "staffMember-psd-12849 (Isabelle Sterckx) does not exist",
    ]);
  });

  it("refuses when a position to update does not exist", () => {
    const snap = beforeSnapshot();
    delete snap.nodes["organigramNode-secretaris"];
    expect(preflight(snap)).toEqual([
      "organigramNode-secretaris does not exist",
    ]);
  });

  it("refuses to overwrite a help-topic text that someone edited since", () => {
    const snap = beforeSnapshot();
    snap.topics["responsibility-vragen-als-afgevaardigde"]!.values.summary =
      "Edited by hand.";
    expect(preflight(snap)).toEqual([
      'responsibility-vragen-als-afgevaardigde summary is "Edited by hand.", expected the old or the new text',
    ]);
  });

  it("refuses while a touched document has a draft or a release version", () => {
    const snap = beforeSnapshot();
    snap.pending = ["versions.rABC.organigramNode-kledij"];
    expect(preflight(snap)).toEqual([
      "versions.rABC.organigramNode-kledij exists — publish or discard it in Studio first",
    ]);
  });

  it("refuses when a new position's parent does not exist", () => {
    const snap = beforeSnapshot();
    delete snap.nodes["organigramNode-jeugdvoorzitter"];
    expect(preflight(snap)).toEqual([
      "parent organigramNode-jeugdvoorzitter does not exist",
    ]);
  });
});

describe("the plan", () => {
  it("only places people it knows by name", () => {
    const placed = [...NODE_UPDATES, ...NODE_CREATES].flatMap((n) => n.members);
    expect(placed.filter((id) => !(id in STAFF))).toEqual([]);
  });

  it("puts nobody in a position who left it", () => {
    const placed = new Set(
      [...NODE_UPDATES, ...NODE_CREATES].flatMap((n) => n.members),
    );
    const left = [
      "staffMember-psd-10061", // Sven De Smedt
      "staffMember-psd-10049", // Dennis Thyssens
      "staffMember-psd-6551", // Jurgen Vergalle
      "staffMember-psd-5640", // Dieter Van Dionant
      "staffMember-psd-160", // Rudy Bautmans, off GC (stays Voorzitter, which this plan leaves alone)
      "staffMember-psd-10928", // Igor Michiels
      "staffMember-psd-10927", // Mike Vermoes
    ];
    expect(left.filter((id) => placed.has(id))).toEqual([]);
  });
});
