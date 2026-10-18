import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from "vitest";
import { openStructureRow } from "./open-row";

let scrollIntoView: MockInstance<Element["scrollIntoView"]>;

function mountRows() {
  document.body.innerHTML = `
    <ul>
      <li><details data-node-ids="tvjo jc-ob"><summary id="s1">TVJO</summary><p>card</p></details></li>
      <li><details data-node-ids="jc-ob-2"><summary id="s2">Other</summary></details></li>
    </ul>
    <ul><li id="card" data-key-node-id="sec" tabindex="-1">Secretaris</li></ul>`;
}

beforeEach(() => {
  scrollIntoView = vi
    .spyOn(Element.prototype, "scrollIntoView")
    .mockImplementation(() => {});
  mountRows();
});

afterEach(() => {
  scrollIntoView.mockRestore();
  document.body.innerHTML = "";
});

describe("openStructureRow", () => {
  it("opens the row, scrolls it into view and focuses its summary", () => {
    expect(openStructureRow("tvjo")).toBe(true);

    const row = document.querySelector("details");
    expect(row?.open).toBe(true);
    expect(document.activeElement).toBe(document.getElementById("s1"));
    expect(scrollIntoView).toHaveBeenCalledOnce();
    expect(scrollIntoView.mock.instances[0]).toBe(row);
  });

  it("finds a row through any of the boxes merged into it", () => {
    expect(openStructureRow("jc-ob")).toBe(true);
    expect(document.querySelector("details")?.open).toBe(true);
  });

  it("matches a box id whole, never by prefix", () => {
    expect(openStructureRow("jc-ob-2")).toBe(true);
    expect(document.querySelectorAll("details")[0]?.open).toBe(false);
    expect(document.querySelectorAll("details")[1]?.open).toBe(true);
  });

  it("scrolls to and focuses the key-figure card of a box that has no ledger row", () => {
    expect(openStructureRow("sec")).toBe(true);

    const card = document.getElementById("card");
    expect(document.activeElement).toBe(card);
    expect(scrollIntoView.mock.instances[0]).toBe(card);
    expect(document.querySelector("details")?.open).toBe(false);
  });

  it("returns false and touches nothing when no row carries the id", () => {
    expect(openStructureRow("missing")).toBe(false);
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(document.querySelector("details")?.open).toBe(false);
  });

  it("leaves an already-open row open and still brings it into view", () => {
    document.querySelector("details")?.setAttribute("open", "");

    expect(openStructureRow("tvjo")).toBe(true);
    expect(document.querySelector("details")?.open).toBe(true);
    expect(scrollIntoView).toHaveBeenCalledOnce();
  });
});
