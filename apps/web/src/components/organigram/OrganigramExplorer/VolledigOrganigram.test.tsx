/**
 * VolledigOrganigram unit tests — the full box-chart (#2054).
 */

import { afterEach, describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VolledigOrganigram } from "./VolledigOrganigram";
import { explorerFixture } from "./organigram-explorer.fixture";

describe("VolledigOrganigram", () => {
  it("renders the whole reporting tree from the root", () => {
    render(<VolledigOrganigram nodes={explorerFixture} />);
    const chart = screen.getByTestId("volledig-organigram");
    expect(chart).toHaveTextContent("KCVV Elewijt");
    expect(chart).toHaveTextContent("Voorzitter");
    expect(chart).toHaveTextContent("TVJO");
    expect(chart).toHaveTextContent("Lid Ethische Commissie"); // depth 5 leaf
  });

  it("makes each node a drill button when onNodeClick is provided", async () => {
    const onNodeClick = vi.fn();
    render(
      <VolledigOrganigram nodes={explorerFixture} onNodeClick={onNodeClick} />,
    );
    await userEvent.click(
      screen.getByRole("button", {
        name: /^Open Voorzitter .* in de verkenner$/,
      }),
    );
    expect(onNodeClick).toHaveBeenCalledWith("voorzitter", expect.anything());
  });

  it("stays static (no node buttons) without onNodeClick", () => {
    render(<VolledigOrganigram nodes={explorerFixture} />);
    expect(
      screen.queryByRole("button", { name: /in de verkenner/ }),
    ).not.toBeInTheDocument();
  });

  it("calls onOpenExplorer when the 'Blader door het organigram' button is clicked", async () => {
    const onOpenExplorer = vi.fn();
    render(
      <VolledigOrganigram
        nodes={explorerFixture}
        onOpenExplorer={onOpenExplorer}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /Blader door het organigram/ }),
    );
    expect(onOpenExplorer).toHaveBeenCalled();
  });

  it("marks vacant positions", () => {
    render(<VolledigOrganigram nodes={explorerFixture} />);
    const vacant = screen
      .getAllByText("vacature")
      .map((el) => el.closest("[data-state]"));
    expect(vacant.length).toBeGreaterThan(0);
    expect(vacant[0]).toHaveAttribute("data-state", "vacant");
  });

  it("offers no PDF: the list in the clubboek is what prints", () => {
    render(<VolledigOrganigram nodes={explorerFixture} />);
    expect(
      screen.queryByRole("button", { name: /Download als PDF/ }),
    ).not.toBeInTheDocument();
  });
});

describe("VolledigOrganigram — parent cycles (#3478)", () => {
  it("renders every node of a parent cycle and the subtree below it", () => {
    const cyclic = [
      { id: "club", title: "KCVV Elewijt", parentId: null, members: [] },
      { id: "a", title: "Cyclus A", parentId: "b", members: [] },
      { id: "b", title: "Cyclus B", parentId: "a", members: [] },
      { id: "leaf", title: "Onder de cyclus", parentId: "b", members: [] },
    ];
    render(<VolledigOrganigram nodes={cyclic} />);
    const chart = screen.getByTestId("volledig-organigram");
    expect(chart).toHaveTextContent("Cyclus A");
    expect(chart).toHaveTextContent("Cyclus B");
    expect(chart).toHaveTextContent("Onder de cyclus");
  });
});

describe("VolledigOrganigram — keeping the root centred", () => {
  // happy-dom has no layout: stand in for it. The track is 300px wide, the root
  // branch starts 1000px in and is 200px wide, so centring means scrollLeft 950.
  // Every observer the chart mounts (the scroll arrows watch the track too).
  let observers: Array<() => void> = [];
  const resize = () => observers.forEach((callback) => callback());
  let rootLeft = 1000;

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    observers = [];
    rootLeft = 1000;
  });

  function mountWithLayout() {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          observers.push(callback);
        }
        observe() {}
        disconnect() {}
      },
    );
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const isTrack = this.classList.contains("vo-chart");
        const scrolled = isTrack
          ? 0
          : -this.closest<HTMLElement>(".vo-chart")!.scrollLeft;
        return isTrack
          ? ({ left: 0, width: 300 } as DOMRect)
          : ({ left: rootLeft + scrolled, width: 200 } as DOMRect);
      },
    );
    const scrollTo = vi
      .spyOn(HTMLElement.prototype, "scrollTo")
      .mockImplementation(function (this: HTMLElement, options?: unknown) {
        this.scrollLeft = (options as ScrollToOptions).left ?? 0;
      });
    const view = render(<VolledigOrganigram nodes={explorerFixture} />);
    const track = view.container.querySelector<HTMLElement>(".vo-chart");
    if (!track) throw new Error("track missing");
    return { scrollTo, track };
  }

  it("centres the root on arrival and again when the layout changes", () => {
    const { scrollTo, track } = mountWithLayout();
    expect(track.scrollLeft).toBe(950);

    rootLeft = 1400; // e.g. a late font swap widened the chart
    resize();

    expect(scrollTo).toHaveBeenCalledTimes(2);
    expect(track.scrollLeft).toBe(1350);
  });

  it("stops centring once the visitor has scrolled the chart themselves", () => {
    const { scrollTo, track } = mountWithLayout();

    track.scrollLeft = 120; // an arrow or a drag moved it
    fireEvent.scroll(track);
    resize();

    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(track.scrollLeft).toBe(120);
  });

  it("keeps centring when the scroll event is only our own", () => {
    const { scrollTo, track } = mountWithLayout();

    fireEvent.scroll(track); // scrollLeft still where we put it
    resize();

    expect(scrollTo).toHaveBeenCalledTimes(2);
  });
});
