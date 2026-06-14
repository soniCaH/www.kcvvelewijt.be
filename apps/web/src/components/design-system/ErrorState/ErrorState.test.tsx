import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState, type ErrorStateAction } from "./ErrorState";

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

const notFoundActions: ErrorStateAction[] = [
  { label: "Naar de homepage", href: "/", variant: "primary" },
  { label: "Zoeken", href: "/zoeken", variant: "ghost" },
];

function renderNotFound() {
  return render(
    <ErrorState
      code="404"
      codeLine="Fout 404 · pagina niet gevonden"
      pun="Buiten de lijnen"
      body="Deze pagina staat niet (meer) op het veld."
      actions={notFoundActions}
    />,
  );
}

describe("ErrorState", () => {
  it("renders the mono code line", () => {
    renderNotFound();
    expect(
      screen.getByText("Fout 404 · pagina niet gevonden"),
    ).toBeInTheDocument();
  });

  it("renders the pun as an h1 with a trailing period", () => {
    const { container } = renderNotFound();
    const heading = screen.getByRole("heading", {
      level: 1,
      name: /buiten de lijnen/i,
    });
    expect(heading).toBeInTheDocument();
    // textContent concatenates inline nodes without the a11y-name spacing,
    // so the locked trailing period is verifiable here verbatim.
    expect(container.querySelector("h1")).toHaveTextContent(
      "Buiten de lijnen.",
    );
  });

  it("emphasises the last word of the pun by default", () => {
    const { container } = renderNotFound();
    const em = container.querySelector("h1 em");
    expect(em).not.toBeNull();
    expect(em).toHaveTextContent("lijnen");
  });

  it("emphasises an explicit punAccent when supplied", () => {
    const { container } = render(
      <ErrorState
        code="500"
        codeLine="Fout 500 · er ging iets mis"
        pun="Technische panne"
        punAccent="panne"
        body="Er ging iets mis aan onze kant."
        actions={[{ label: "Naar de homepage", href: "/" }]}
      />,
    );
    const em = container.querySelector("h1 em");
    expect(em).toHaveTextContent("panne");
  });

  it("renders the body copy", () => {
    renderNotFound();
    expect(
      screen.getByText("Deze pagina staat niet (meer) op het veld."),
    ).toBeInTheDocument();
  });

  it("renders the HTTP code as the jersey shirt number", () => {
    renderNotFound();
    const figure = screen.getByRole("figure", { name: "KCVV-shirt" });
    expect(figure).toBeInTheDocument();
    expect(within(figure).getByText("404")).toBeInTheDocument();
  });

  it("renders link actions with their hrefs", () => {
    renderNotFound();
    expect(
      screen.getByRole("link", { name: "Naar de homepage" }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Zoeken" })).toHaveAttribute(
      "href",
      "/zoeken",
    );
  });

  it("renders a button action and fires its onClick (e.g. reset)", async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    render(
      <ErrorState
        code="500"
        codeLine="Fout 500 · er ging iets mis"
        pun="Technische panne"
        body="Er ging iets mis aan onze kant."
        actions={[
          { label: "Probeer opnieuw", onClick: reset, variant: "primary" },
          { label: "Naar de homepage", href: "/", variant: "ghost" },
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Probeer opnieuw" }));
    expect(reset).toHaveBeenCalledOnce();
  });

  it("is self-contained — renders no header or footer landmarks", () => {
    const { container } = renderNotFound();
    expect(container.querySelector("header")).toBeNull();
    expect(container.querySelector("footer")).toBeNull();
  });

  it("defaults to the primary variant when an action omits one", () => {
    render(
      <ErrorState
        code="404"
        codeLine="Fout 404 · pagina niet gevonden"
        pun="Buiten de lijnen"
        body="Deze pagina staat niet (meer) op het veld."
        actions={[{ label: "Naar de homepage", href: "/" }]}
      />,
    );
    const link = screen.getByRole("link", { name: "Naar de homepage" });
    expect(link.className).toContain("bg-jersey-deep");
  });

  it("renders exactly the supplied actions", () => {
    renderNotFound();
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("emits the analytics marker on link and button actions when supplied", () => {
    render(
      <ErrorState
        code="500"
        codeLine="Fout 500 · er ging iets mis"
        pun="Technische panne"
        body="Er ging iets mis aan onze kant."
        actions={[
          {
            label: "Probeer opnieuw",
            onClick: vi.fn(),
            analyticsAction: "retry",
          },
          { label: "Naar de homepage", href: "/", analyticsAction: "home" },
        ]}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Probeer opnieuw" }),
    ).toHaveAttribute("data-error-action", "retry");
    expect(
      screen.getByRole("link", { name: "Naar de homepage" }),
    ).toHaveAttribute("data-error-action", "home");
  });

  it("omits the analytics marker when an action does not supply one", () => {
    renderNotFound();
    expect(
      screen.getByRole("link", { name: "Naar de homepage" }),
    ).not.toHaveAttribute("data-error-action");
  });
});
