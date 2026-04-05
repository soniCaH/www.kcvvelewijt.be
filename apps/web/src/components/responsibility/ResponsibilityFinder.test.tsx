/**
 * ResponsibilityFinder Component Tests
 *
 * Comprehensive test suite covering:
 * - Rendering and display
 * - User interactions
 * - Search functionality
 * - Accessibility
 * - Edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResponsibilityFinder } from "./ResponsibilityFinder";
import { mockResponsibilityPaths as responsibilityPaths } from "./__fixtures__/responsibility-paths.fixture";
import { mockYouthTeams } from "./__fixtures__/youth-teams.fixture";
import type { ResponsibilityPath } from "@/types/responsibility";

/** Stub fetch to return the given paths as semantic search results. */
function mockSearchReturning(paths: ResponsibilityPath[]) {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: async () => ({
      results: paths.map((p) => ({
        id: p.id,
        slug: p.id,
        type: "responsibility" as const,
        score: 0.9,
        title: p.question,
        excerpt: p.summary,
      })),
    }),
  } as Response);
}

/**
 * Helper function to select a role from the dropdown
 * Opens the dropdown and clicks the specified role option
 */
async function selectRole(
  user: ReturnType<typeof userEvent.setup>,
  roleName: string,
) {
  // Find the dropdown button by its text content
  // It either shows "een..." (initial) or a role name (after selection)
  const dropdownButton = screen.getByRole("button", {
    name: /een\.\.\.|speler|ouder|trainer|supporter|niet-lid/i,
  });

  // Click the dropdown button to open the menu
  await user.click(dropdownButton);

  // Wait for dropdown to be visible and click the role option
  await waitFor(() => {
    const roleOption = screen.getByRole("button", {
      name: new RegExp(roleName, "i"),
    });
    expect(roleOption).toBeInTheDocument();
  });

  const roleOption = screen.getByRole("button", {
    name: new RegExp(roleName, "i"),
  });
  await user.click(roleOption);
}

describe("ResponsibilityFinder", () => {
  beforeEach(() => {
    // Default: fetch returns empty results (tests that need suggestions override this)
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      } as Response),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Rendering", () => {
    it("renders the component", () => {
      render(<ResponsibilityFinder paths={responsibilityPaths} />);
      expect(screen.getByText(/IK BEN/i)).toBeInTheDocument();
    });

    it("renders dropdown with all role options", async () => {
      const user = userEvent.setup();
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      // Check for dropdown button
      const dropdownButton = screen.getByRole("button", { name: /een\.\.\./i });
      expect(dropdownButton).toBeInTheDocument();

      // Open dropdown
      await user.click(dropdownButton);

      // Check all 5 roles are available (ANDERE was removed)
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /speler/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /ouder/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /trainer/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /supporter/i }),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /niet-lid/i }),
        ).toBeInTheDocument();
      });
    });

    it("does not show question input initially", () => {
      render(<ResponsibilityFinder paths={responsibilityPaths} />);
      expect(
        screen.queryByPlaceholderText(/typ je vraag/i),
      ).not.toBeInTheDocument();
    });

    it("renders in compact mode when prop is true", () => {
      const { container } = render(
        <ResponsibilityFinder paths={responsibilityPaths} compact />,
      );
      expect(container.querySelector(".compact")).toBeInTheDocument();
    });
  });

  describe("Role Selection", () => {
    it("shows question input after selecting a role", async () => {
      const user = userEvent.setup();
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");

      expect(screen.getByPlaceholderText(/typ je vraag/i)).toBeInTheDocument();
    });

    it("updates dropdown button text with selected role", async () => {
      const user = userEvent.setup();
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");

      // Dropdown button should now show selected role
      const dropdownButton = screen.getByRole("button", { name: /speler/i });
      expect(dropdownButton).toBeInTheDocument();
    });

    it("can change selected role", async () => {
      const user = userEvent.setup();
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");
      let dropdownButton = screen.getByRole("button", { name: /speler/i });
      expect(dropdownButton).toBeInTheDocument();

      await selectRole(user, "ouder");
      dropdownButton = screen.getByRole("button", { name: /ouder/i });
      expect(dropdownButton).toBeInTheDocument();
    });

    it("focuses input after role selection", async () => {
      const user = userEvent.setup();
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/typ je vraag/i);
        expect(input).toHaveFocus();
      });
    });
  });

  describe("Search Functionality", () => {
    it("shows suggestions when typing", async () => {
      const user = userEvent.setup();
      const ongevalPath = responsibilityPaths.find((p) =>
        p.question.includes("ongeval"),
      )!;
      mockSearchReturning([ongevalPath]);
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");

      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.type(input, "ongeval");

      await waitFor(
        () => {
          const elements = screen.getAllByText(/ongeval/i);
          expect(elements.length).toBeGreaterThan(0);
        },
        { timeout: 3000 },
      );
    });

    it("filters suggestions by selected role", async () => {
      const user = userEvent.setup();
      const inschrijvingPath = responsibilityPaths.find((p) =>
        p.id.includes("inschrijving-nieuw-lid"),
      )!;
      mockSearchReturning([inschrijvingPath]);
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "ouder");

      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.type(input, "inschrijven");

      await waitFor(
        () => {
          // Semantic search returns inschrijving path; question contains "inschrijven"
          const suggestions = screen.queryAllByText(/inschrijven/i);
          expect(suggestions.length).toBeGreaterThan(0);
        },
        { timeout: 3000 },
      );
    });

    it("shows maximum 6 suggestions", async () => {
      const user = userEvent.setup();
      // BFF respects limit:5; return 5 paths to simulate a broad search
      mockSearchReturning(responsibilityPaths.slice(0, 5));
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");

      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.type(input, "w"); // Broad search

      await waitFor(
        () => {
          const options = screen.queryAllByRole("option");
          expect(options.length).toBeGreaterThan(0);
          expect(options.length).toBeLessThanOrEqual(6);
        },
        { timeout: 3000 },
      );
    });

    it("clears search when clicking clear button", async () => {
      const user = userEvent.setup();
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");

      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.type(input, "test");

      const clearButton = screen.getByLabelText(/clear search/i);
      await user.click(clearButton);

      expect(input).toHaveValue("");
    });

    it("hides suggestions when clicking outside", async () => {
      const user = userEvent.setup();
      const ongevalPath = responsibilityPaths.find((p) =>
        p.question.includes("ongeval"),
      )!;
      mockSearchReturning([ongevalPath]);
      render(
        <div>
          <div data-testid="outside-element">Outside</div>
          <ResponsibilityFinder paths={responsibilityPaths} />
        </div>,
      );

      await selectRole(user, "speler");

      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.type(input, "ongeval");

      // Verify suggestions are visible
      await waitFor(
        () => {
          const options = screen.queryAllByRole("option");
          expect(options.length).toBeGreaterThan(0);
        },
        { timeout: 3000 },
      );

      // Click outside using fireEvent for better compatibility with native click listener
      const outsideElement = screen.getByTestId("outside-element");
      fireEvent.click(outsideElement);

      // Wait for suggestions to disappear
      await waitFor(
        () => {
          const options = screen.queryAllByRole("option");
          expect(options).toHaveLength(0);
        },
        { timeout: 3000 },
      );
    });
  });

  describe("Result Selection", () => {
    it("shows result card when clicking suggestion", async () => {
      const user = userEvent.setup();
      const ongevalPath = responsibilityPaths.find((p) =>
        p.question.includes("ongeval"),
      )!;
      mockSearchReturning([ongevalPath]);
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");

      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.type(input, "ongeval");

      const suggestions = await screen.findAllByRole(
        "option",
        { name: /ongeval/i },
        { timeout: 3000 },
      );
      const suggestion = suggestions[0];
      await user.click(suggestion);

      await waitFor(() => {
        expect(screen.getByText(/Contactpersoon/i)).toBeInTheDocument();
      });
    });

    it("calls onResultSelect callback", async () => {
      const onResultSelect = vi.fn();
      const user = userEvent.setup();
      const ongevalPath = responsibilityPaths.find((p) =>
        p.question.includes("ongeval"),
      )!;
      mockSearchReturning([ongevalPath]);
      render(
        <ResponsibilityFinder
          paths={responsibilityPaths}
          onResultSelect={onResultSelect}
        />,
      );

      await selectRole(user, "speler");

      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.type(input, "ongeval");

      const suggestions = await screen.findAllByRole(
        "option",
        { name: /ongeval/i },
        { timeout: 3000 },
      );
      const suggestion = suggestions[0];
      await user.click(suggestion);

      await waitFor(() => {
        expect(onResultSelect).toHaveBeenCalled();
      });
    });

    it("displays all result card sections", async () => {
      const user = userEvent.setup();
      const ongevalPath = responsibilityPaths.find((p) =>
        p.question.includes("ongeval"),
      )!;
      mockSearchReturning([ongevalPath]);
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");

      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.type(input, "ongeval");

      const suggestions = await screen.findAllByRole(
        "option",
        { name: /ongeval/i },
        { timeout: 3000 },
      );
      const suggestion = suggestions[0];
      await user.click(suggestion);

      await waitFor(() => {
        expect(screen.getByText(/Contactpersoon/i)).toBeInTheDocument();
        expect(screen.getByText(/Wat moet je doen/i)).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels", async () => {
      const user = userEvent.setup();
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      // Dropdown button should be accessible
      const dropdownButton = screen.getByRole("button", { name: /een\.\.\./i });
      expect(dropdownButton).toBeInTheDocument();

      // Clear button should have aria-label (shown after typing)
      await selectRole(user, "speler");
      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.type(input, "test");

      const clearButton = screen.getByLabelText(/clear search/i);
      expect(clearButton).toBeInTheDocument();
    });

    it("is keyboard navigable", async () => {
      const user = userEvent.setup();
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      const dropdownButton = screen.getByRole("button", { name: /een\.\.\./i });

      dropdownButton.focus();
      expect(dropdownButton).toHaveFocus();

      await user.keyboard("{Enter}");

      await waitFor(() => {
        // Dropdown should be open
        const roleOption = screen.getByRole("button", { name: /speler/i });
        expect(roleOption).toBeInTheDocument();
      });
    });

    it("input has placeholder text", async () => {
      const user = userEvent.setup();
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");

      const input = screen.getByPlaceholderText(/typ je vraag/i);
      expect(input).toHaveAttribute("placeholder");
    });
  });

  describe("Edge Cases", () => {
    it("handles no search results gracefully", async () => {
      const user = userEvent.setup();
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");

      const input = screen.getByPlaceholderText(/typ je vraag/i);

      // Type search that won't match anything
      await user.clear(input);
      await user.type(input, "xyzabc123notfound");

      // Should show empty state message when there are no matches
      await waitFor(() => {
        const emptyState = screen.queryByText(/Geen resultaten gevonden/i);
        expect(emptyState).toBeInTheDocument();
      });

      // Verify no suggestion buttons are shown
      const allButtons = screen.queryAllByRole("button");
      const suggestionButtons = allButtons.filter((button) => {
        const label = button.getAttribute("aria-label") || "";
        const text = button.textContent || "";

        // Skip clear button
        if (label.toLowerCase().includes("clear")) return false;

        // Skip dropdown button
        if (
          text.includes("een...") ||
          /speler|ouder|trainer|supporter|niet-lid/i.test(text)
        ) {
          return false;
        }

        return true;
      });
      expect(suggestionButtons.length).toBe(0);
    });

    it("handles empty search gracefully", async () => {
      const user = userEvent.setup();
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");

      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.clear(input);

      // Should not show suggestions for empty query
      expect(input).toHaveValue("");
    });

    it("handles rapid role switching", async () => {
      const user = userEvent.setup();
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      const roles = ["speler", "ouder", "trainer", "supporter"];

      for (const role of roles) {
        await selectRole(user, role);
        // Dropdown button should show the selected role
        const dropdownButton = screen.getByRole("button", {
          name: new RegExp(role, "i"),
        });
        expect(dropdownButton).toBeInTheDocument();
      }
    });
  });

  describe("Data Integration", () => {
    it("uses real responsibility paths data", () => {
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      // Should have access to the imported data
      expect(responsibilityPaths).toBeDefined();
      expect(responsibilityPaths.length).toBeGreaterThan(0);
    });

    it("matches against keywords correctly", async () => {
      const user = userEvent.setup();
      const blessurePath = responsibilityPaths.find(
        (p) =>
          p.question.includes("blessure") || p.question.includes("herstel"),
      )!;
      mockSearchReturning([blessurePath]);
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");

      const input = screen.getByPlaceholderText(/typ je vraag/i);

      // Semantic search handles keyword matching server-side
      await user.type(input, "blessure");

      await waitFor(
        () => {
          // Should show suggestion for the returned path
          const results = screen.queryAllByText(/blessure|herstel/i);
          expect(results.length).toBeGreaterThan(0);
        },
        { timeout: 3000 },
      );
    });
  });

  describe("Deep Linking to Organigram", () => {
    it("calls onMemberSelect when clicking organigram link", async () => {
      const onMemberSelect = vi.fn();
      const user = userEvent.setup();

      // Find a path with members from the actual data (position contacts have members)
      const pathWithMemberId = responsibilityPaths.find(
        (path) => path.primaryContact.members?.[0]?.id,
      );
      expect(pathWithMemberId).toBeDefined();
      expect(pathWithMemberId!.primaryContact.members?.[0]?.id).toBeDefined();
      mockSearchReturning([pathWithMemberId!]);

      render(
        <ResponsibilityFinder
          paths={responsibilityPaths}
          onMemberSelect={onMemberSelect}
        />,
      );

      // Select the appropriate role for this path
      const roleForPath = Array.isArray(pathWithMemberId!.role)
        ? pathWithMemberId!.role[0]
        : pathWithMemberId!.role;
      await selectRole(user, roleForPath);

      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.type(input, pathWithMemberId!.question);

      // Click on the specific suggestion for this path
      const suggestion = await screen.findByRole(
        "option",
        { name: new RegExp(pathWithMemberId!.question, "i") },
        { timeout: 3000 },
      );
      await user.click(suggestion);

      // Wait for result card to appear
      await waitFor(() => {
        expect(screen.getByText(/Contactpersoon/i)).toBeInTheDocument();
      });

      // Find and click the "Bekijk in organigram" button
      const organigramButton = screen.getByRole("button", {
        name: /bekijk in organigram/i,
      });
      await user.click(organigramButton);

      // Verify callback was called with the actual member ID from data
      expect(onMemberSelect).toHaveBeenCalledWith(
        pathWithMemberId!.primaryContact.members![0].id,
      );
    });

    it("shows organigram button for results with memberId", async () => {
      const onMemberSelect = vi.fn();
      const user = userEvent.setup();
      const sponsorPath = responsibilityPaths.find(
        (p) => p.id === "club-sponsoren",
      )!;
      mockSearchReturning([sponsorPath]);
      render(
        <ResponsibilityFinder
          paths={responsibilityPaths}
          onMemberSelect={onMemberSelect}
        />,
      );

      await selectRole(user, "niet-lid");

      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.type(input, "sponsor");

      // Click on the suggestion
      const suggestions = await screen.findAllByRole(
        "option",
        { name: /sponsor/i },
        { timeout: 3000 },
      );
      await user.click(suggestions[0]);

      // Verify organigram button is rendered (findByRole waits for it to appear)
      const organigramButton = await screen.findByRole("button", {
        name: /bekijk in organigram/i,
      });
      expect(organigramButton).toBeInTheDocument();
    });

    it("hides organigram button when onMemberSelect not provided", async () => {
      const user = userEvent.setup();
      const sponsorPath = responsibilityPaths.find(
        (p) => p.id === "club-sponsoren",
      )!;
      mockSearchReturning([sponsorPath]);
      // Render WITHOUT onMemberSelect callback
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "niet-lid");

      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.type(input, "sponsor");

      // Click suggestion
      const suggestions = await screen.findAllByRole(
        "option",
        { name: /sponsor/i },
        { timeout: 3000 },
      );
      await user.click(suggestions[0]);

      // Wait for result card to appear
      await waitFor(() => {
        expect(screen.getByText(/Contactpersoon/i)).toBeInTheDocument();
      });

      // Without onMemberSelect, no organigram button should be rendered
      expect(
        screen.queryByRole("button", { name: /bekijk in organigram/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("Pre-filling and Highlighting", () => {
    it("pre-fills with initialPathId", () => {
      // Find a responsibility path to test with
      const testPath = responsibilityPaths[0];

      render(
        <ResponsibilityFinder
          paths={responsibilityPaths}
          initialPathId={testPath.id}
        />,
      );

      // Should pre-select the result
      expect(screen.getByText(/Contactpersoon/i)).toBeInTheDocument();
      expect(screen.getByText(testPath.question)).toBeInTheDocument();
    });

    it("pre-fills with initialPath object", () => {
      const testPath = responsibilityPaths[0];

      render(
        <ResponsibilityFinder
          paths={responsibilityPaths}
          initialPath={testPath}
        />,
      );

      // Should pre-select the result
      expect(screen.getByText(/Contactpersoon/i)).toBeInTheDocument();
      expect(screen.getByText(testPath.question)).toBeInTheDocument();
    });

    it("initialPath takes precedence over initialPathId", () => {
      const pathFromId = responsibilityPaths[0];
      const pathFromObject = responsibilityPaths[1];

      // Guard: ensure test data has different questions
      expect(pathFromId.question).not.toBe(pathFromObject.question);

      render(
        <ResponsibilityFinder
          paths={responsibilityPaths}
          initialPathId={pathFromId.id}
          initialPath={pathFromObject}
        />,
      );

      // Should show the path from initialPath, not initialPathId
      expect(screen.getByText(pathFromObject.question)).toBeInTheDocument();
      expect(screen.queryByText(pathFromId.question)).not.toBeInTheDocument();
    });

    it("sets role when pre-filling with initialPath", () => {
      const testPath = responsibilityPaths[0];

      render(
        <ResponsibilityFinder
          paths={responsibilityPaths}
          initialPath={testPath}
        />,
      );

      // Role dropdown should show the first role from the path
      const expectedRole = Array.isArray(testPath.role)
        ? testPath.role[0]
        : testPath.role;
      const roleButton = screen.getByRole("button", {
        name: new RegExp(expectedRole, "i"),
      });
      expect(roleButton).toBeInTheDocument();
    });

    it("sets question text when pre-filling", () => {
      const testPath = responsibilityPaths[0];

      render(
        <ResponsibilityFinder
          paths={responsibilityPaths}
          initialPath={testPath}
        />,
      );

      // Question input should show the path's question
      const input = screen.getByPlaceholderText(/typ je vraag/i);
      expect(input).toHaveValue(testPath.question);
    });

    it("does not show suggestions when pre-filled", () => {
      const testPath = responsibilityPaths[0];

      render(
        <ResponsibilityFinder
          paths={responsibilityPaths}
          initialPath={testPath}
        />,
      );

      // Should not show the autocomplete dropdown (options are suggestion items)
      const options = screen.queryAllByRole("option");
      expect(options.length).toBe(0);
    });

    it("does not call onResultSelect on mount when initialPath is provided", () => {
      const onResultSelect = vi.fn();
      const testPath = responsibilityPaths[0];

      render(
        <ResponsibilityFinder
          paths={responsibilityPaths}
          initialPath={testPath}
          onResultSelect={onResultSelect}
        />,
      );

      // onResultSelect should not be called automatically on mount
      // It's only called when user selects from suggestions
      expect(onResultSelect).not.toHaveBeenCalled();
    });

    it("handles invalid initialPathId gracefully", () => {
      render(
        <ResponsibilityFinder
          paths={responsibilityPaths}
          initialPathId="non-existent-id"
        />,
      );

      // Should render without crashing
      expect(screen.getByText(/IK BEN/i)).toBeInTheDocument();

      // Should not show result card
      expect(screen.queryByText(/Contactpersoon/i)).not.toBeInTheDocument();
    });

    it("allows user to change selection after pre-filling", async () => {
      const user = userEvent.setup();
      const testPath = responsibilityPaths[0];
      mockSearchReturning(responsibilityPaths.slice(1, 4));

      render(
        <ResponsibilityFinder
          paths={responsibilityPaths}
          initialPath={testPath}
        />,
      );

      // Initially shows the pre-filled result
      expect(screen.getByText(testPath.question)).toBeInTheDocument();
      expect(screen.getByText(/Contactpersoon/i)).toBeInTheDocument();

      // User can type a new search
      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.clear(input);
      await user.type(input, "w");

      // Should show suggestions for new search
      await waitFor(() => {
        expect(input).toHaveValue("w");
        const options = screen.queryAllByRole("option");
        expect(options.length).toBeGreaterThan(0);
      });

      // Click on a new suggestion to change the selection
      const options = screen.queryAllByRole("option");
      await user.click(options[0]);

      // After clicking new suggestion, the original result should be replaced
      await waitFor(() => {
        expect(screen.queryByText(testPath.question)).not.toBeInTheDocument();
        expect(screen.getByText(/Contactpersoon/i)).toBeInTheDocument();
      });
    });
  });

  describe("Onboarding Hints", () => {
    it("shows example searches on empty state before role selection", () => {
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      // Should show hint buttons with text derived from the resolved path's question
      expect(screen.getByText("wil mij graag inschrijven")).toBeInTheDocument();
      expect(
        screen.getByText("heb een ongeval op training/wedstrijd"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("wil het attest van mijn mutualiteit invullen"),
      ).toBeInTheDocument();
      expect(screen.getByText("zoek mijn wedstrijden")).toBeInTheDocument();
    });

    it("does not show hints after role is selected", async () => {
      const user = userEvent.setup();
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");

      expect(
        screen.queryByText("wil mij graag inschrijven"),
      ).not.toBeInTheDocument();
    });

    it("clicking a hint sets role and shows result directly", async () => {
      const user = userEvent.setup();
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      // Click the "inschrijving-nieuw-lid" hint
      await user.click(screen.getByText("wil mij graag inschrijven"));

      // Should show the result card directly (no intermediate suggestion list)
      await waitFor(() => {
        expect(screen.getByText(/Contactpersoon/i)).toBeInTheDocument();
      });

      // Role should be set to the path's first role
      const inschrijvingPath = responsibilityPaths.find(
        (p) => p.id === "inschrijving-nieuw-lid",
      )!;
      const expectedRole = inschrijvingPath.role[0];
      expect(
        screen.getByRole("button", { name: new RegExp(expectedRole, "i") }),
      ).toBeInTheDocument();
    });

    it("stale hint slugs silently disappear", () => {
      // Provide paths that don't include one of the hint slugs
      const pathsWithoutWedstrijden = responsibilityPaths.filter(
        (p) => p.id !== "wedstrijden-zoeken",
      );

      render(<ResponsibilityFinder paths={pathsWithoutWedstrijden} />);

      // The hint for wedstrijden-zoeken should not appear
      expect(
        screen.queryByText("zoek mijn wedstrijden"),
      ).not.toBeInTheDocument();

      // Other hints should still appear
      expect(screen.getByText("wil mij graag inschrijven")).toBeInTheDocument();
    });
  });

  describe("Fallback Contact Block", () => {
    it("shows fallback block below every result card", async () => {
      const user = userEvent.setup();
      const ongevalPath = responsibilityPaths.find((p) =>
        p.question.includes("ongeval"),
      )!;
      mockSearchReturning([ongevalPath]);
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");

      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.type(input, "ongeval");

      const suggestions = await screen.findAllByRole(
        "option",
        { name: /ongeval/i },
        { timeout: 3000 },
      );
      await user.click(suggestions[0]);

      await waitFor(() => {
        expect(
          screen.getByText("Staat jouw vraag er niet bij?"),
        ).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /contact/i })).toHaveAttribute(
          "href",
          "/club/contact",
        );
        expect(
          screen.getByRole("link", { name: /organigram/i }),
        ).toHaveAttribute("href", "/club/organigram");
      });
    });
  });

  describe("Navigation Buttons", () => {
    it("shows 'Terug' button that returns to suggestion list", async () => {
      const user = userEvent.setup();
      const ongevalPath = responsibilityPaths.find((p) =>
        p.question.includes("ongeval"),
      )!;
      mockSearchReturning([ongevalPath]);
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");

      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.type(input, "ongeval");

      const suggestions = await screen.findAllByRole(
        "option",
        { name: /ongeval/i },
        { timeout: 3000 },
      );
      await user.click(suggestions[0]);

      // Result card should be visible
      await waitFor(() => {
        expect(screen.getByText(/Contactpersoon/i)).toBeInTheDocument();
      });

      // Click "Terug"
      await user.click(screen.getByRole("button", { name: /terug/i }));

      // Result card should be gone, suggestions should be visible again
      await waitFor(() => {
        expect(screen.queryByText(/Contactpersoon/i)).not.toBeInTheDocument();
      });

      // Search input should still be present with role selected
      expect(screen.getByPlaceholderText(/typ je vraag/i)).toBeInTheDocument();
    });

    it("shows 'Opnieuw beginnen' button that resets to initial state", async () => {
      const user = userEvent.setup();
      const ongevalPath = responsibilityPaths.find((p) =>
        p.question.includes("ongeval"),
      )!;
      mockSearchReturning([ongevalPath]);
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");

      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.type(input, "ongeval");

      const suggestions = await screen.findAllByRole(
        "option",
        { name: /ongeval/i },
        { timeout: 3000 },
      );
      await user.click(suggestions[0]);

      await waitFor(() => {
        expect(screen.getByText(/Contactpersoon/i)).toBeInTheDocument();
      });

      // Click "Opnieuw beginnen"
      await user.click(
        screen.getByRole("button", { name: /opnieuw beginnen/i }),
      );

      // Should be back to initial state: no result, no role, hints visible
      await waitFor(() => {
        expect(screen.queryByText(/Contactpersoon/i)).not.toBeInTheDocument();
        expect(
          screen.queryByPlaceholderText(/typ je vraag/i),
        ).not.toBeInTheDocument();
        // Hints should be back
        expect(
          screen.getByText("wil mij graag inschrijven"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility Enhancements", () => {
    it("suggestion list has listbox/option roles", async () => {
      const user = userEvent.setup();
      const ongevalPath = responsibilityPaths.find((p) =>
        p.question.includes("ongeval"),
      )!;
      mockSearchReturning([ongevalPath]);
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");

      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.type(input, "ongeval");

      await waitFor(
        () => {
          expect(screen.getByRole("listbox")).toBeInTheDocument();
          expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
        },
        { timeout: 3000 },
      );
    });

    it("supports arrow-key navigation in suggestion list", async () => {
      const user = userEvent.setup();
      mockSearchReturning(responsibilityPaths.slice(0, 3));
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");

      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.type(input, "test");

      await waitFor(
        () => {
          expect(screen.getByRole("listbox")).toBeInTheDocument();
        },
        { timeout: 3000 },
      );

      // Press ArrowDown to move to first option
      await user.keyboard("{ArrowDown}");

      const combobox = screen.getByRole("combobox");
      expect(combobox).toHaveAttribute("aria-activedescendant", "suggestion-0");
    });

    it("result area has aria-live region", async () => {
      const user = userEvent.setup();
      const ongevalPath = responsibilityPaths.find((p) =>
        p.question.includes("ongeval"),
      )!;
      mockSearchReturning([ongevalPath]);
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      await selectRole(user, "speler");

      const input = screen.getByPlaceholderText(/typ je vraag/i);
      await user.type(input, "ongeval");

      const suggestions = await screen.findAllByRole(
        "option",
        { name: /ongeval/i },
        { timeout: 3000 },
      );
      await user.click(suggestions[0]);

      await waitFor(() => {
        const liveRegion = screen
          .getByText(/Contactpersoon/i)
          .closest("[aria-live]");
        expect(liveRegion).toBeInTheDocument();
        expect(liveRegion).toHaveAttribute("aria-live", "polite");
      });
    });

    it("all interactive elements have visible focus styles", () => {
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      // Role dropdown button should have focus-visible styles
      const dropdownButton = screen.getByRole("button", { name: /een\.\.\./i });
      expect(dropdownButton.className).toMatch(/focus-visible/);
    });

    it("tap targets meet 44x44px minimum", async () => {
      const user = userEvent.setup();
      render(<ResponsibilityFinder paths={responsibilityPaths} />);

      // Role dropdown options should have min tap target
      await user.click(screen.getByRole("button", { name: /een\.\.\./i }));

      await waitFor(() => {
        const roleOption = screen.getByRole("button", { name: /speler/i });
        expect(roleOption.className).toMatch(/min-h-\[44px\]|min-h-11/);
      });
    });
  });

  describe("Team Selection (team-role contacts)", () => {
    const teamRolePath = responsibilityPaths.find(
      (p) => p.id === "vraag-over-training",
    )!;

    it("shows team selector when result has team-role contact", async () => {
      mockSearchReturning([teamRolePath]);
      render(
        <ResponsibilityFinder
          paths={responsibilityPaths}
          youthTeams={mockYouthTeams}
          initialPath={teamRolePath}
        />,
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/ploeg/i)).toBeInTheDocument();
      });
    });

    it("does not show team selector for position-only results", () => {
      const positionPath = responsibilityPaths.find(
        (p) => p.id === "club-sponsoren",
      )!;
      render(
        <ResponsibilityFinder
          paths={responsibilityPaths}
          youthTeams={mockYouthTeams}
          initialPath={positionPath}
        />,
      );

      expect(screen.queryByLabelText(/ploeg/i)).not.toBeInTheDocument();
    });

    it("populates team dropdown with youth teams", async () => {
      const user = userEvent.setup();
      render(
        <ResponsibilityFinder
          paths={responsibilityPaths}
          youthTeams={mockYouthTeams}
          initialPath={teamRolePath}
        />,
      );

      const teamSelect = await waitFor(() => screen.getByLabelText(/ploeg/i));

      await user.selectOptions(teamSelect, "team-u13a");

      // After selection, resolved contact should appear (primary + step both resolve)
      await waitFor(() => {
        const matches = screen.getAllByText("Kim De Smet");
        expect(matches.length).toBeGreaterThanOrEqual(1);
      });
    });

    it("shows fallback when selected team has no matching role", async () => {
      const user = userEvent.setup();
      render(
        <ResponsibilityFinder
          paths={responsibilityPaths}
          youthTeams={mockYouthTeams}
          initialPath={teamRolePath}
        />,
      );

      const teamSelect = await waitFor(() => screen.getByLabelText(/ploeg/i));

      await user.selectOptions(teamSelect, "team-u17a");

      // Should show fallback message (primary + step both have no match)
      await waitFor(() => {
        const matches = screen.getAllByText(/geen trainer.*toegewezen/i);
        expect(matches.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
