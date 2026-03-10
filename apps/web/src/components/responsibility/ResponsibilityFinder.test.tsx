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
import type { ResponsibilityPath } from "@/types/responsibility";

/** Stub fetch to return the given paths as semantic search results. */
function mockSearchReturning(paths: ResponsibilityPath[]) {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: async () => ({
      results: paths.map((p) => ({
        id: p.id,
        slug: p.id,
        type: "responsibilityPath" as const,
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
          const allButtons = screen.queryAllByRole("button");

          // Filter to get only suggestion buttons
          // Exclude: dropdown button and clear button
          const suggestionButtons = allButtons.filter((button) => {
            const label = button.getAttribute("aria-label") || "";
            const text = button.textContent || "";

            // Skip clear button (has "clear" in aria-label)
            if (label.toLowerCase().includes("clear")) return false;

            // Skip dropdown button (contains "een..." or a role name)
            if (
              text.includes("een...") ||
              /speler|ouder|trainer|supporter|niet-lid/i.test(text)
            ) {
              return false;
            }

            return true;
          });

          expect(suggestionButtons.length).toBeGreaterThan(0);
          expect(suggestionButtons.length).toBeLessThanOrEqual(6);
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
          const suggestionButtons = screen.queryAllByRole("button", {
            name: /ongeval/i,
          });
          expect(suggestionButtons.length).toBeGreaterThan(0);
        },
        { timeout: 3000 },
      );

      // Click outside using fireEvent for better compatibility with native click listener
      const outsideElement = screen.getByTestId("outside-element");
      fireEvent.click(outsideElement);

      // Wait for suggestions to disappear
      await waitFor(
        () => {
          const suggestionButtons = screen.queryAllByRole("button", {
            name: /ongeval/i,
          });
          expect(suggestionButtons).toHaveLength(0);
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
        "button",
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
        "button",
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
        "button",
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

      // Find a path with memberId from the actual data
      const pathWithMemberId = responsibilityPaths.find(
        (path) => path.primaryContact.memberId,
      );
      expect(pathWithMemberId).toBeDefined();
      expect(pathWithMemberId!.primaryContact.memberId).toBeDefined();
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
        "button",
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

      // Verify callback was called with the actual memberId from data
      expect(onMemberSelect).toHaveBeenCalledWith(
        pathWithMemberId!.primaryContact.memberId,
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
        "button",
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

    it("shows organigram link when onMemberSelect not provided", async () => {
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
        "button",
        { name: /sponsor/i },
        { timeout: 3000 },
      );
      await user.click(suggestions[0]);

      // Should show link instead of button (findByRole waits for it to appear)
      const organigramLink = await screen.findByRole("link", {
        name: /bekijk in organigram/i,
      });
      expect(organigramLink).toBeInTheDocument();
      expect(organigramLink).toHaveAttribute("href", "/club/organigram");
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

      // Should not show the autocomplete dropdown
      const buttons = screen.queryAllByRole("button");
      const suggestionButtons = buttons.filter((button) => {
        const label = button.getAttribute("aria-label") || "";
        const text = button.textContent || "";

        // Skip clear button (check both aria-label and textContent)
        if (
          label.toLowerCase().includes("clear") ||
          text.toLowerCase().includes("clear")
        )
          return false;

        // Skip dropdown button (check both textContent and aria-label)
        if (
          text.includes("een...") ||
          label.includes("een...") ||
          /speler|ouder|trainer|supporter|niet-lid/i.test(text) ||
          /speler|ouder|trainer|supporter|niet-lid/i.test(label)
        ) {
          return false;
        }

        return true;
      });

      // Should only have role dropdown and clear buttons, no suggestions
      expect(suggestionButtons.length).toBe(0);
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
        // Input value should be updated
        expect(input).toHaveValue("w");

        // New suggestions should appear (broad search yields results)
        const allButtons = screen.queryAllByRole("button");
        const suggestionButtons = allButtons.filter((button) => {
          const label = button.getAttribute("aria-label") || "";
          const text = button.textContent || "";

          // Skip clear button (check both aria-label and textContent)
          if (
            label.toLowerCase().includes("clear") ||
            text.toLowerCase().includes("clear")
          )
            return false;

          // Skip dropdown button (check both textContent and aria-label)
          if (
            text.includes("een...") ||
            label.includes("een...") ||
            /speler|ouder|trainer|supporter|niet-lid/i.test(text) ||
            /speler|ouder|trainer|supporter|niet-lid/i.test(label)
          ) {
            return false;
          }

          return true;
        });
        expect(suggestionButtons.length).toBeGreaterThan(0);
      });

      // Click on a new suggestion to change the selection
      const allButtons = screen.queryAllByRole("button");
      const suggestionButtons = allButtons.filter((button) => {
        const label = button.getAttribute("aria-label") || "";
        const text = button.textContent || "";
        if (
          label.toLowerCase().includes("clear") ||
          text.toLowerCase().includes("clear")
        )
          return false;
        if (
          text.includes("een...") ||
          label.includes("een...") ||
          /speler|ouder|trainer|supporter|niet-lid/i.test(text) ||
          /speler|ouder|trainer|supporter|niet-lid/i.test(label)
        ) {
          return false;
        }
        return true;
      });
      await user.click(suggestionButtons[0]);

      // After clicking new suggestion, the original result should be replaced
      await waitFor(() => {
        expect(screen.queryByText(testPath.question)).not.toBeInTheDocument();
        expect(screen.getByText(/Contactpersoon/i)).toBeInTheDocument();
      });
    });
  });
});
