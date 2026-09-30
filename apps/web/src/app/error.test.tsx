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

describe("500 error page", () => {
  const defaultError = new Error("Something went wrong");
  const mockRetry = vi.fn();

  beforeEach(() => {
    mockRetry.mockReset();
  });

  it("renders the locked 500 pun heading", () => {
    render(<ErrorPage error={defaultError} retry={mockRetry} />);
    expect(
      screen.getByRole("heading", { level: 1, name: /technische panne/i }),
    ).toBeInTheDocument();
  });

  it("renders the 500 body copy", () => {
    render(<ErrorPage error={defaultError} retry={mockRetry} />);
    expect(
      screen.getByText(/er ging iets mis aan onze kant/i),
    ).toBeInTheDocument();
  });

  it("renders a retry button wired to retry()", async () => {
    const user = userEvent.setup();
    render(<ErrorPage error={defaultError} retry={mockRetry} />);
    const retryButton = screen.getByRole("button", {
      name: "Probeer opnieuw",
    });
    await user.click(retryButton);
    expect(mockRetry).toHaveBeenCalledOnce();
  });

  it("renders a ghost link to the homepage", () => {
    render(<ErrorPage error={defaultError} retry={mockRetry} />);
    const homeLink = screen.getByRole("link", { name: "Naar de homepage" });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it("does not render header or footer landmarks", () => {
    const { container } = render(
      <ErrorPage error={defaultError} retry={mockRetry} />,
    );
    expect(container.querySelector("header")).toBeNull();
    expect(container.querySelector("footer")).toBeNull();
  });
});
