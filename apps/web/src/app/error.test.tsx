import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorPage from "./error";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Global Error page", () => {
  const defaultError = new Error("Something went wrong");
  const mockReset = vi.fn();

  beforeEach(() => {
    mockReset.mockReset();
  });

  it("renders the locked 500 pun heading", () => {
    render(<ErrorPage error={defaultError} reset={mockReset} />);
    expect(
      screen.getByRole("heading", { level: 1, name: /technische panne/i }),
    ).toBeInTheDocument();
  });

  it("renders the 500 body copy", () => {
    render(<ErrorPage error={defaultError} reset={mockReset} />);
    expect(
      screen.getByText(/er ging iets mis aan onze kant/i),
    ).toBeInTheDocument();
  });

  it("renders a retry button wired to reset()", async () => {
    const user = userEvent.setup();
    render(<ErrorPage error={defaultError} reset={mockReset} />);
    const retryButton = screen.getByRole("button", {
      name: "Probeer opnieuw",
    });
    await user.click(retryButton);
    expect(mockReset).toHaveBeenCalledOnce();
  });

  it("renders a ghost link to the homepage", () => {
    render(<ErrorPage error={defaultError} reset={mockReset} />);
    const homeLink = screen.getByRole("link", { name: "Naar de homepage" });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("does not render header or footer landmarks", () => {
    const { container } = render(
      <ErrorPage error={defaultError} reset={mockReset} />,
    );
    expect(container.querySelector("header")).toBeNull();
    expect(container.querySelector("footer")).toBeNull();
  });
});
