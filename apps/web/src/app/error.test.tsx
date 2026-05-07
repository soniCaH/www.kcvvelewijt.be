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

  it("renders a Dutch error heading", () => {
    render(<ErrorPage error={defaultError} reset={mockReset} />);
    expect(
      screen.getByRole("heading", { name: /er ging iets mis/i }),
    ).toBeInTheDocument();
  });

  it("renders a description", () => {
    render(<ErrorPage error={defaultError} reset={mockReset} />);
    expect(
      screen.getByText(/er is een onverwachte fout opgetreden/i),
    ).toBeInTheDocument();
  });

  it("renders a retry button that calls reset", async () => {
    const user = userEvent.setup();
    render(<ErrorPage error={defaultError} reset={mockReset} />);
    const retryButton = screen.getByRole("button", {
      name: /probeer opnieuw/i,
    });
    await user.click(retryButton);
    expect(mockReset).toHaveBeenCalledOnce();
  });

  it("renders a link to the homepage", () => {
    render(<ErrorPage error={defaultError} reset={mockReset} />);
    const homeLink = screen.getByRole("link", { name: /naar home/i });
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
