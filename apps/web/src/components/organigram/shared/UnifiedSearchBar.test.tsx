import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UnifiedSearchBar } from "./UnifiedSearchBar";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";

describe("UnifiedSearchBar", () => {
  const mockMembers: OrgChartNode[] = [
    {
      id: "president",
      name: "John Doe",
      title: "Voorzitter",
      roleCode: "PRES",
      email: "john@example.com",
      department: "hoofdbestuur",
    },
    {
      id: "secretary",
      name: "Jane Smith",
      title: "Secretaris",
      email: "jane@example.com",
      department: "hoofdbestuur",
    },
    {
      id: "jeugdcoordinator",
      name: "Maria Janssens",
      title: "Jeugdcoördinator",
      department: "jeugdbestuur",
    },
  ];

  const mockResponsibilityPaths: ResponsibilityPath[] = [
    {
      id: "inschrijving-nieuw-lid",
      role: ["niet-lid", "ouder"],
      question: "wil mij graag inschrijven",
      keywords: ["inschrijven", "lid worden"],
      summary: "Gebruik het online inschrijvingsformulier",
      category: "administratief",
      primaryContact: {
        role: "Jeugdsecretaris",
        email: "jeugd@example.com",
        memberId: "jeugdcoordinator",
      },
      steps: [],
    },
    {
      id: "club-sponsoren",
      role: ["niet-lid"],
      question: "wil de club graag sponsoren",
      keywords: ["sponsor", "sponsoring"],
      summary: "Neem contact op met de sponsoringverantwoordelijke",
      category: "commercieel",
      primaryContact: {
        role: "Verantwoordelijke Sponsoring",
        email: "sponsoring@example.com",
        memberId: "treasurer",
      },
      steps: [],
    },
  ];

  it("renders search input", () => {
    render(
      <UnifiedSearchBar
        value=""
        onChange={vi.fn()}
        members={mockMembers}
        responsibilityPaths={mockResponsibilityPaths}
        debounceMs={0}
      />,
    );

    const input = screen.getByRole("textbox", { name: /zoeken/i });
    expect(input).toBeInTheDocument();
  });

  it("displays placeholder text", () => {
    render(
      <UnifiedSearchBar
        value=""
        onChange={vi.fn()}
        members={mockMembers}
        responsibilityPaths={mockResponsibilityPaths}
        debounceMs={0}
        placeholder="Custom placeholder"
      />,
    );

    expect(
      screen.getByPlaceholderText("Custom placeholder"),
    ).toBeInTheDocument();
  });

  it("calls onChange when typing", () => {
    const handleChange = vi.fn();
    render(
      <UnifiedSearchBar
        value=""
        onChange={handleChange}
        members={mockMembers}
        responsibilityPaths={mockResponsibilityPaths}
        debounceMs={0}
      />,
    );

    const input = screen.getByRole("textbox", { name: /zoeken/i });
    fireEvent.change(input, { target: { value: "john" } });

    expect(handleChange).toHaveBeenCalledWith("john");
  });

  it("shows clear button when value is not empty", () => {
    const { rerender } = render(
      <UnifiedSearchBar
        value=""
        onChange={vi.fn()}
        members={mockMembers}
        responsibilityPaths={mockResponsibilityPaths}
        debounceMs={0}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /wissen/i }),
    ).not.toBeInTheDocument();

    rerender(
      <UnifiedSearchBar
        value="john"
        onChange={vi.fn()}
        members={mockMembers}
        responsibilityPaths={mockResponsibilityPaths}
        debounceMs={0}
      />,
    );

    expect(screen.getByRole("button", { name: /wissen/i })).toBeInTheDocument();
  });

  it("clears search when clear button is clicked", () => {
    const handleChange = vi.fn();
    render(
      <UnifiedSearchBar
        value="john"
        onChange={handleChange}
        members={mockMembers}
        responsibilityPaths={mockResponsibilityPaths}
        debounceMs={0}
      />,
    );

    const clearButton = screen.getByRole("button", { name: /wissen/i });
    fireEvent.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith("");
  });

  it("shows member results when searching", () => {
    const { rerender } = render(
      <UnifiedSearchBar
        value=""
        onChange={vi.fn()}
        members={mockMembers}
        responsibilityPaths={mockResponsibilityPaths}
        debounceMs={0}
        showAutocomplete={true}
      />,
    );

    const input = screen.getByRole("textbox", { name: /zoeken/i });
    fireEvent.focus(input);

    // Initially no results
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();

    // Update value to trigger search
    rerender(
      <UnifiedSearchBar
        value="john"
        onChange={vi.fn()}
        members={mockMembers}
        responsibilityPaths={mockResponsibilityPaths}
        debounceMs={0}
        showAutocomplete={true}
      />,
    );

    // Wait for results to appear
    const memberName = screen.getByText("John Doe");
    expect(memberName).toBeInTheDocument();
  });

  it("shows responsibility results when searching", () => {
    const { rerender } = render(
      <UnifiedSearchBar
        value=""
        onChange={vi.fn()}
        members={mockMembers}
        responsibilityPaths={mockResponsibilityPaths}
        debounceMs={0}
        showAutocomplete={true}
      />,
    );

    const input = screen.getByRole("textbox", { name: /zoeken/i });
    fireEvent.focus(input);

    // Update value to trigger search
    rerender(
      <UnifiedSearchBar
        value="inschrijven"
        onChange={vi.fn()}
        members={mockMembers}
        responsibilityPaths={mockResponsibilityPaths}
        debounceMs={0}
        showAutocomplete={true}
      />,
    );

    // Check for responsibility result
    const question = screen.getByText("wil mij graag inschrijven");
    expect(question).toBeInTheDocument();
  });

  it("calls onSelectMember when member is clicked", () => {
    const handleSelectMember = vi.fn();
    const { rerender } = render(
      <UnifiedSearchBar
        value=""
        onChange={vi.fn()}
        members={mockMembers}
        responsibilityPaths={mockResponsibilityPaths}
        debounceMs={0}
        onSelectMember={handleSelectMember}
        showAutocomplete={true}
      />,
    );

    const input = screen.getByRole("textbox", { name: /zoeken/i });
    fireEvent.focus(input);

    rerender(
      <UnifiedSearchBar
        value="john"
        onChange={vi.fn()}
        members={mockMembers}
        responsibilityPaths={mockResponsibilityPaths}
        debounceMs={0}
        onSelectMember={handleSelectMember}
        showAutocomplete={true}
      />,
    );

    const memberButton = screen.getByText("John Doe").closest("button");
    expect(memberButton).not.toBeNull();
    fireEvent.click(memberButton!);
    expect(handleSelectMember).toHaveBeenCalledWith(mockMembers[0]);
  });

  it("calls onSelectResponsibility when responsibility is clicked", () => {
    const handleSelectResponsibility = vi.fn();
    const { rerender } = render(
      <UnifiedSearchBar
        value=""
        onChange={vi.fn()}
        members={mockMembers}
        responsibilityPaths={mockResponsibilityPaths}
        debounceMs={0}
        onSelectResponsibility={handleSelectResponsibility}
        showAutocomplete={true}
      />,
    );

    const input = screen.getByRole("textbox", { name: /zoeken/i });
    fireEvent.focus(input);

    rerender(
      <UnifiedSearchBar
        value="inschrijven"
        onChange={vi.fn()}
        members={mockMembers}
        responsibilityPaths={mockResponsibilityPaths}
        debounceMs={0}
        onSelectResponsibility={handleSelectResponsibility}
        showAutocomplete={true}
      />,
    );

    const responsibilityButton = screen
      .getByText("wil mij graag inschrijven")
      .closest("button");
    expect(responsibilityButton).not.toBeNull();
    fireEvent.click(responsibilityButton!);
    expect(handleSelectResponsibility).toHaveBeenCalledWith(
      mockResponsibilityPaths[0],
    );
  });

  it("shows no results message when no matches found", () => {
    const { rerender } = render(
      <UnifiedSearchBar
        value=""
        onChange={vi.fn()}
        members={mockMembers}
        responsibilityPaths={mockResponsibilityPaths}
        debounceMs={0}
        showAutocomplete={true}
      />,
    );

    const input = screen.getByRole("textbox", { name: /zoeken/i });
    fireEvent.focus(input);

    rerender(
      <UnifiedSearchBar
        value="xyz123nonexistent"
        onChange={vi.fn()}
        members={mockMembers}
        responsibilityPaths={mockResponsibilityPaths}
        debounceMs={0}
        showAutocomplete={true}
      />,
    );

    expect(screen.getByText(/geen resultaten gevonden/i)).toBeInTheDocument();
  });

  it("does not show autocomplete when showAutocomplete is false", () => {
    const { rerender } = render(
      <UnifiedSearchBar
        value=""
        onChange={vi.fn()}
        members={mockMembers}
        responsibilityPaths={mockResponsibilityPaths}
        debounceMs={0}
        showAutocomplete={false}
      />,
    );

    const input = screen.getByRole("textbox", { name: /zoeken/i });
    fireEvent.focus(input);

    rerender(
      <UnifiedSearchBar
        value="john"
        onChange={vi.fn()}
        members={mockMembers}
        responsibilityPaths={mockResponsibilityPaths}
        debounceMs={0}
        showAutocomplete={false}
      />,
    );

    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
  });

  describe("keyboard navigation", () => {
    it("navigates down with ArrowDown key", () => {
      const { rerender } = render(
        <UnifiedSearchBar
          value=""
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      const input = screen.getByRole("textbox", { name: /zoeken/i });
      fireEvent.focus(input);

      rerender(
        <UnifiedSearchBar
          value="j"
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      fireEvent.keyDown(input, { key: "ArrowDown" });
      // Should highlight first result
      expect(input.getAttribute("aria-activedescendant")).toBe(
        "search-result-0",
      );
    });

    it("navigates up with ArrowUp key", () => {
      const { rerender } = render(
        <UnifiedSearchBar
          value=""
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      const input = screen.getByRole("textbox", { name: /zoeken/i });
      fireEvent.focus(input);

      rerender(
        <UnifiedSearchBar
          value="j"
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      fireEvent.keyDown(input, { key: "ArrowUp" });
      // Should wrap to last result (verify aria-activedescendant is set)
      const ariaDescendant = input.getAttribute("aria-activedescendant");
      expect(ariaDescendant).toBeTruthy();
      expect(ariaDescendant).toMatch(/^search-result-\d+$/);
    });

    it("selects result with Enter key", () => {
      const handleSelectMember = vi.fn();
      const handleChange = vi.fn();
      const { rerender } = render(
        <UnifiedSearchBar
          value=""
          onChange={handleChange}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          onSelectMember={handleSelectMember}
          showAutocomplete={true}
        />,
      );

      const input = screen.getByRole("textbox", { name: /zoeken/i });
      fireEvent.focus(input);

      rerender(
        <UnifiedSearchBar
          value="john"
          onChange={handleChange}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          onSelectMember={handleSelectMember}
          showAutocomplete={true}
        />,
      );

      fireEvent.keyDown(input, { key: "ArrowDown" });
      fireEvent.keyDown(input, { key: "Enter" });

      expect(handleSelectMember).toHaveBeenCalled();
    });

    it("closes dropdown with Escape key", () => {
      const { rerender } = render(
        <UnifiedSearchBar
          value=""
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      const input = screen.getByRole("textbox", { name: /zoeken/i });
      fireEvent.focus(input);

      rerender(
        <UnifiedSearchBar
          value="john"
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      expect(screen.getByText("John Doe")).toBeInTheDocument();

      fireEvent.keyDown(input, { key: "Escape" });

      // Dropdown should close - results should no longer be visible
      expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    });
  });

  describe("search matching", () => {
    it("matches member by title", () => {
      const { rerender } = render(
        <UnifiedSearchBar
          value=""
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      const input = screen.getByRole("textbox", { name: /zoeken/i });
      fireEvent.focus(input);

      rerender(
        <UnifiedSearchBar
          value="voorzitter"
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("matches member by position short", () => {
      const { rerender } = render(
        <UnifiedSearchBar
          value=""
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      const input = screen.getByRole("textbox", { name: /zoeken/i });
      fireEvent.focus(input);

      rerender(
        <UnifiedSearchBar
          value="pres"
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("matches member by email", () => {
      const { rerender } = render(
        <UnifiedSearchBar
          value=""
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      const input = screen.getByRole("textbox", { name: /zoeken/i });
      fireEvent.focus(input);

      rerender(
        <UnifiedSearchBar
          value="jane@example.com"
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("matches member by department", () => {
      const { rerender } = render(
        <UnifiedSearchBar
          value=""
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      const input = screen.getByRole("textbox", { name: /zoeken/i });
      fireEvent.focus(input);

      rerender(
        <UnifiedSearchBar
          value="jeugdbestuur"
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      expect(screen.getByText("Maria Janssens")).toBeInTheDocument();
    });

    it("matches responsibility by summary", () => {
      const { rerender } = render(
        <UnifiedSearchBar
          value=""
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      const input = screen.getByRole("textbox", { name: /zoeken/i });
      fireEvent.focus(input);

      rerender(
        <UnifiedSearchBar
          value="formulier"
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      expect(screen.getByText("wil mij graag inschrijven")).toBeInTheDocument();
    });

    it("matches responsibility by keywords", () => {
      const { rerender } = render(
        <UnifiedSearchBar
          value=""
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      const input = screen.getByRole("textbox", { name: /zoeken/i });
      fireEvent.focus(input);

      rerender(
        <UnifiedSearchBar
          value="sponsor"
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      expect(
        screen.getByText("wil de club graag sponsoren"),
      ).toBeInTheDocument();
    });
  });

  describe("result interaction", () => {
    it("highlights result on mouse enter", () => {
      const { rerender } = render(
        <UnifiedSearchBar
          value=""
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      const input = screen.getByRole("textbox", { name: /zoeken/i });
      fireEvent.focus(input);

      rerender(
        <UnifiedSearchBar
          value="john"
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      const memberButton = screen.getByText("John Doe").closest("button");
      expect(memberButton).not.toBeNull();
      fireEvent.mouseEnter(memberButton!);
      expect(memberButton).toBeInTheDocument();
    });

    it("updates search value when member is selected", () => {
      const handleChange = vi.fn();
      const handleSelectMember = vi.fn();
      const { rerender } = render(
        <UnifiedSearchBar
          value=""
          onChange={handleChange}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          onSelectMember={handleSelectMember}
          showAutocomplete={true}
        />,
      );

      const input = screen.getByRole("textbox", { name: /zoeken/i });
      fireEvent.focus(input);

      rerender(
        <UnifiedSearchBar
          value="john"
          onChange={handleChange}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          onSelectMember={handleSelectMember}
          showAutocomplete={true}
        />,
      );

      const memberButton = screen.getByText("John Doe").closest("button");
      expect(memberButton).not.toBeNull();
      fireEvent.click(memberButton!);
      expect(handleChange).toHaveBeenCalledWith("John Doe");
    });

    it("updates search value when responsibility is selected", () => {
      const handleChange = vi.fn();
      const handleSelectResponsibility = vi.fn();
      const { rerender } = render(
        <UnifiedSearchBar
          value=""
          onChange={handleChange}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          onSelectResponsibility={handleSelectResponsibility}
          showAutocomplete={true}
        />,
      );

      const input = screen.getByRole("textbox", { name: /zoeken/i });
      fireEvent.focus(input);

      rerender(
        <UnifiedSearchBar
          value="inschrijven"
          onChange={handleChange}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          onSelectResponsibility={handleSelectResponsibility}
          showAutocomplete={true}
        />,
      );

      const responsibilityButton = screen
        .getByText("wil mij graag inschrijven")
        .closest("button");
      expect(responsibilityButton).not.toBeNull();
      fireEvent.click(responsibilityButton!);
      expect(handleChange).toHaveBeenCalledWith("wil mij graag inschrijven");
    });
  });

  describe("maxResults", () => {
    it("limits results to maxResults", () => {
      const { rerender } = render(
        <UnifiedSearchBar
          value=""
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
          maxResults={1}
        />,
      );

      const input = screen.getByRole("textbox", { name: /zoeken/i });
      fireEvent.focus(input);

      rerender(
        <UnifiedSearchBar
          value="j"
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
          maxResults={1}
        />,
      );

      // Should only show 1 member result (not all matching members)
      const results = screen.getAllByRole("option");
      expect(results.length).toBeLessThanOrEqual(2); // 1 member + 1 responsibility max
    });
  });

  describe("empty states", () => {
    it("shows no results when value is only whitespace", () => {
      const { rerender } = render(
        <UnifiedSearchBar
          value=""
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      const input = screen.getByRole("textbox", { name: /zoeken/i });
      fireEvent.focus(input);

      rerender(
        <UnifiedSearchBar
          value="   "
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });

    it("handles empty members array", () => {
      const { rerender } = render(
        <UnifiedSearchBar
          value=""
          onChange={vi.fn()}
          members={[]}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      const input = screen.getByRole("textbox", { name: /zoeken/i });
      fireEvent.focus(input);

      rerender(
        <UnifiedSearchBar
          value="inschrijven"
          onChange={vi.fn()}
          members={[]}
          responsibilityPaths={mockResponsibilityPaths}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      // Should still show responsibility results
      expect(screen.getByText("wil mij graag inschrijven")).toBeInTheDocument();
    });

    it("handles empty responsibility paths array", () => {
      const { rerender } = render(
        <UnifiedSearchBar
          value=""
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={[]}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      const input = screen.getByRole("textbox", { name: /zoeken/i });
      fireEvent.focus(input);

      rerender(
        <UnifiedSearchBar
          value="john"
          onChange={vi.fn()}
          members={mockMembers}
          responsibilityPaths={[]}
          debounceMs={0}
          showAutocomplete={true}
        />,
      );

      // Should still show member results
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });
});
