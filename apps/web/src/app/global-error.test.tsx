import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GlobalError from "./global-error";

vi.mock("next/font/google", () => ({
  IBM_Plex_Mono: () => ({ variable: "mock-plex-mono" }),
}));

vi.mock("next/link", () => ({
  useLinkStatus: () => ({ pending: false }),
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

/**
 * `global-error.tsx` replaces the root layout, so it renders its own
 * `<html>`/`<body>`. React 19 mounts a whole document into `document`.
 */
function renderDocument(retry: () => void) {
  return render(<GlobalError error={new Error("boom")} retry={retry} />, {
    container: document,
  });
}

describe("global-error boundary", () => {
  const mockRetry = vi.fn();

  beforeEach(() => {
    mockRetry.mockReset();
  });

  it("renders the locked 500 heading and body", () => {
    renderDocument(mockRetry);
    expect(
      screen.getByRole("heading", { level: 1, name: /technische panne/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/er ging iets mis aan onze kant/i),
    ).toBeInTheDocument();
  });

  it("wires Probeer opnieuw to retry()", async () => {
    const user = userEvent.setup();
    renderDocument(mockRetry);
    await user.click(screen.getByRole("button", { name: "Probeer opnieuw" }));
    expect(mockRetry).toHaveBeenCalledOnce();
  });

  it("renders a ghost link to the homepage", () => {
    renderDocument(mockRetry);
    expect(
      screen.getByRole("link", { name: "Naar de homepage" }),
    ).toHaveAttribute("href", "/");
  });

  it("owns the document: lang=nl, a title, the mono font variable", () => {
    renderDocument(mockRetry);
    expect(document.documentElement).toHaveAttribute("lang", "nl");
    expect(document.documentElement).toHaveClass("mock-plex-mono");
    expect(document.title).toMatch(/KCVV Elewijt/);
  });
});
