/**
 * SearchForm Component Tests
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchForm } from "./SearchForm";

describe("SearchForm", () => {
  describe("Rendering", () => {
    it("should render search input", () => {
      render(<SearchForm onSearch={vi.fn()} />);

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });

    it("should render submit button", () => {
      render(<SearchForm onSearch={vi.fn()} />);

      const button = screen.getByRole("button", { name: /^zoeken$/i });
      expect(button).toBeInTheDocument();
    });

    it("should display default placeholder", () => {
      render(<SearchForm onSearch={vi.fn()} />);

      const input = screen.getByPlaceholderText(
        "Zoek nieuws, spelers, teams...",
      );
      expect(input).toBeInTheDocument();
    });

    it("should display custom placeholder", () => {
      render(
        <SearchForm onSearch={vi.fn()} placeholder="Custom placeholder" />,
      );

      const input = screen.getByPlaceholderText("Custom placeholder");
      expect(input).toBeInTheDocument();
    });
  });

  describe("Input Interactions", () => {
    it("should update input value when typing", async () => {
      const user = userEvent.setup();
      render(<SearchForm onSearch={vi.fn()} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test query");

      expect(input).toHaveValue("test query");
    });

    it("should sync with initialValue prop", () => {
      render(<SearchForm onSearch={vi.fn()} initialValue="initial query" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveValue("initial query");
    });

    it("should update when initialValue changes", () => {
      const { rerender } = render(
        <SearchForm onSearch={vi.fn()} initialValue="first" />,
      );

      let input = screen.getByRole("textbox");
      expect(input).toHaveValue("first");

      rerender(<SearchForm onSearch={vi.fn()} initialValue="second" />);

      input = screen.getByRole("textbox");
      expect(input).toHaveValue("second");
    });

    it("should be disabled when isLoading is true", () => {
      render(<SearchForm onSearch={vi.fn()} isLoading={true} />);

      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("should not be disabled by default", () => {
      render(<SearchForm onSearch={vi.fn()} />);

      const input = screen.getByRole("textbox");
      expect(input).not.toBeDisabled();
    });

    it("should have autofocus on input", () => {
      render(<SearchForm onSearch={vi.fn()} />);

      const input = screen.getByRole("textbox");
      // autofocus is a boolean prop in React, so input should be focused on render
      expect(document.activeElement).toBe(input);
    });
  });

  describe("Validation", () => {
    it("should disable submit button when input is empty", () => {
      render(<SearchForm onSearch={vi.fn()} />);

      const button = screen.getByRole("button", { name: /^zoeken$/i });
      expect(button).toBeDisabled();
    });

    it("should disable submit button when input has only whitespace", async () => {
      const user = userEvent.setup();
      render(<SearchForm onSearch={vi.fn()} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "   ");

      const button = screen.getByRole("button", { name: /^zoeken$/i });
      expect(button).toBeDisabled();
    });

    it("should disable submit button when input has less than 2 characters", async () => {
      const user = userEvent.setup();
      render(<SearchForm onSearch={vi.fn()} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "a");

      const button = screen.getByRole("button", { name: /^zoeken$/i });
      expect(button).toBeDisabled();
    });

    it("should enable submit button when input has 2 or more characters", async () => {
      const user = userEvent.setup();
      render(<SearchForm onSearch={vi.fn()} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "ab");

      const button = screen.getByRole("button", { name: /^zoeken$/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe("Clear Button", () => {
    it("should not show clear button when input is empty", () => {
      render(<SearchForm onSearch={vi.fn()} />);

      const clearButton = screen.queryByRole("button", {
        name: /wis zoekopdracht/i,
      });
      expect(clearButton).not.toBeInTheDocument();
    });

    it("should show clear button when input has value", async () => {
      const user = userEvent.setup();
      render(<SearchForm onSearch={vi.fn()} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const clearButton = screen.getByRole("button", {
        name: /wis zoekopdracht/i,
      });
      expect(clearButton).toBeInTheDocument();
    });

    it("should clear input when clear button is clicked", async () => {
      const user = userEvent.setup();
      render(<SearchForm onSearch={vi.fn()} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const clearButton = screen.getByRole("button", {
        name: /wis zoekopdracht/i,
      });
      await user.click(clearButton);

      expect(input).toHaveValue("");
    });

    it("should call onSearch with empty string when clear button is clicked", async () => {
      const user = userEvent.setup();
      const handleSearch = vi.fn();
      render(<SearchForm onSearch={handleSearch} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const clearButton = screen.getByRole("button", {
        name: /wis zoekopdracht/i,
      });
      await user.click(clearButton);

      expect(handleSearch).toHaveBeenCalledWith("");
    });

    it("should have correct aria-label for accessibility", async () => {
      const user = userEvent.setup();
      render(<SearchForm onSearch={vi.fn()} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const clearButton = screen.getByRole("button", {
        name: /wis zoekopdracht/i,
      });
      expect(clearButton).toHaveAttribute("aria-label", "Wis zoekopdracht");
    });
  });

  describe("Form Submission", () => {
    it("should call onSearch with trimmed value when form is submitted", async () => {
      const user = userEvent.setup();
      const handleSearch = vi.fn();
      render(<SearchForm onSearch={handleSearch} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "  test query  ");

      const button = screen.getByRole("button", { name: /^zoeken$/i });
      await user.click(button);

      expect(handleSearch).toHaveBeenCalledWith("test query");
    });

    it("should call onSearch when Enter key is pressed", async () => {
      const user = userEvent.setup();
      const handleSearch = vi.fn();
      render(<SearchForm onSearch={handleSearch} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test query");
      await user.keyboard("{Enter}");

      expect(handleSearch).toHaveBeenCalledWith("test query");
    });

    it("should not call onSearch when input is less than 2 characters", async () => {
      const user = userEvent.setup();
      const handleSearch = vi.fn();
      render(<SearchForm onSearch={handleSearch} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "a");

      const button = screen.getByRole("button", { name: /^zoeken$/i });
      // Button should be disabled, so click won't work
      expect(button).toBeDisabled();
      expect(handleSearch).not.toHaveBeenCalled();
    });

    it("should not call onSearch when input is only whitespace", async () => {
      const user = userEvent.setup();
      const handleSearch = vi.fn();
      render(<SearchForm onSearch={handleSearch} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "   ");

      const button = screen.getByRole("button", { name: /^zoeken$/i });
      // Button should be disabled, so click won't work
      expect(button).toBeDisabled();
      expect(handleSearch).not.toHaveBeenCalled();
    });

    it("should prevent default form submission", async () => {
      const user = userEvent.setup();
      const handleSearch = vi.fn();

      const { container } = render(<SearchForm onSearch={handleSearch} />);
      const form = container.querySelector("form");

      // Capture the submit event to verify preventDefault was called
      let submitEvent: Event | null = null;
      form?.addEventListener("submit", (e) => {
        submitEvent = e;
      });

      const input = screen.getByRole("textbox");
      await user.type(input, "test");
      await user.keyboard("{Enter}");

      // Verify the form's onSubmit handler prevented default browser behavior
      expect(submitEvent).not.toBeNull();
      expect(submitEvent!.defaultPrevented).toBe(true);
      expect(handleSearch).toHaveBeenCalledWith("test");
    });
  });

  describe("Loading State", () => {
    it("should disable input when isLoading is true", () => {
      render(<SearchForm onSearch={vi.fn()} isLoading={true} />);

      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("should disable submit button when isLoading is true", () => {
      render(
        <SearchForm onSearch={vi.fn()} isLoading={true} initialValue="test" />,
      );

      const button = screen.getByRole("button", { name: /^zoeken$/i });
      expect(button).toBeDisabled();
    });

    it("should enable submit button when not loading and input is valid", async () => {
      const user = userEvent.setup();
      render(<SearchForm onSearch={vi.fn()} isLoading={false} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const button = screen.getByRole("button", { name: /^zoeken$/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("should have proper form structure", () => {
      const { container } = render(<SearchForm onSearch={vi.fn()} />);

      const form = container.querySelector("form");
      expect(form).toBeInTheDocument();
    });

    it("should allow keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<SearchForm onSearch={vi.fn()} />);

      // Tab should focus the input (autofocus makes it focused already)
      const input = screen.getByRole("textbox");
      expect(input).toHaveFocus();

      await user.type(input, "test");
      await user.tab();

      // Next tab should focus the clear button
      const clearButton = screen.getByRole("button", {
        name: /wis zoekopdracht/i,
      });
      expect(clearButton).toHaveFocus();

      await user.tab();

      // Next tab should focus the submit button
      const submitButton = screen.getByRole("button", { name: /^zoeken$/i });
      expect(submitButton).toHaveFocus();
    });

    it("should work with keyboard Enter on submit button", async () => {
      const user = userEvent.setup();
      const handleSearch = vi.fn();
      render(<SearchForm onSearch={handleSearch} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      const button = screen.getByRole("button", { name: /^zoeken$/i });
      button.focus();
      await user.keyboard("{Enter}");

      expect(handleSearch).toHaveBeenCalledWith("test");
    });
  });
});
