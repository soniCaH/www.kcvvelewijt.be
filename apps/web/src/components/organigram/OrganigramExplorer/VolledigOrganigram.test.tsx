/**
 * VolledigOrganigram unit tests — the full box-chart (#2054).
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
      screen.getByRole("button", { name: "Open Voorzitter in de verkenner" }),
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
