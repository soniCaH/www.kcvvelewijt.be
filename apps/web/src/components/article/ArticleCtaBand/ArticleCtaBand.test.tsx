import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { ArticleCtaBand, type ArticleCallToAction } from "./ArticleCtaBand";

const COMPLETE: ArticleCallToAction = {
  question: "Kom eens gratis meetrainen?",
  emphasis: "gratis meetrainen",
  lead: "Elke dinsdag en donderdag, iedereen welkom — geen verplichtingen.",
  buttonLabel: "Schrijf je in",
};

describe("ArticleCtaBand", () => {
  it("renders the band when the field is complete, with the data-article-cta marker", () => {
    render(
      <ArticleCtaBand
        articleId="art-1"
        articleType="announcement"
        callToAction={{
          ...COMPLETE,
          href: "https://forms.gle/LXxf2Sd25rvpM14FA",
        }}
      />,
    );
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent(COMPLETE.question!);
    const link = screen.getByRole("link", { name: /schrijf je in/i });
    expect(link).toHaveAttribute("href", "https://forms.gle/LXxf2Sd25rvpM14FA");
    expect(link).toHaveAttribute("data-article-cta", "true");
  });

  it("returns null when callToAction is absent", () => {
    const { container } = render(
      <ArticleCtaBand articleId="art-1" articleType="announcement" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it.each([
    ["question", { ...COMPLETE, question: "" }],
    ["lead", { ...COMPLETE, lead: "" }],
    ["buttonLabel", { ...COMPLETE, buttonLabel: "" }],
  ] as const)("returns null when %s is missing", (_field, fields) => {
    const { container } = render(
      <ArticleCtaBand
        articleId="art-1"
        articleType="announcement"
        callToAction={{ ...fields, href: "https://forms.gle/abc" }}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns null when neither href nor reference is set", () => {
    const { container } = render(
      <ArticleCtaBand
        articleId="art-1"
        articleType="announcement"
        callToAction={COMPLETE}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("resolves an internal reference to its route via resolveInternalLinkHref", () => {
    render(
      <ArticleCtaBand
        articleId="art-1"
        articleType="announcement"
        callToAction={{
          ...COMPLETE,
          reference: { _type: "team", slug: "eerste-ploeg" },
        }}
      />,
    );
    const link = screen.getByRole("link", { name: /schrijf je in/i });
    expect(link).toHaveAttribute("href", "/ploegen/eerste-ploeg");
  });

  it("renders no band for an unresolvable internal reference (archived team)", () => {
    const { container } = render(
      <ArticleCtaBand
        articleId="art-1"
        articleType="announcement"
        callToAction={{
          ...COMPLETE,
          reference: { _type: "team", slug: "oud-elftal", archived: true },
        }}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders no band for a reference missing the identifier its route needs", () => {
    const { container } = render(
      <ArticleCtaBand
        articleId="art-1"
        articleType="announcement"
        callToAction={{ ...COMPLETE, reference: { _type: "player" } }}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a mailto href as a plain anchor (no new-tab target)", () => {
    render(
      <ArticleCtaBand
        articleId="art-1"
        articleType="announcement"
        callToAction={{ ...COMPLETE, href: "mailto:jeugd@kcvvelewijt.be" }}
      />,
    );
    const link = screen.getByRole("link", { name: /schrijf je in/i });
    expect(link).toHaveAttribute("href", "mailto:jeugd@kcvvelewijt.be");
    expect(link).not.toHaveAttribute("target");
  });

  it("opens an external http(s) href in a new tab with a safe rel", () => {
    render(
      <ArticleCtaBand
        articleId="art-1"
        articleType="announcement"
        callToAction={{
          ...COMPLETE,
          href: "https://forms.gle/LXxf2Sd25rvpM14FA",
        }}
      />,
    );
    const link = screen.getByRole("link", { name: /schrijf je in/i });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders a relative href (e.g. /club/word-lid) as a same-tab internal link", () => {
    render(
      <ArticleCtaBand
        articleId="art-1"
        articleType="announcement"
        callToAction={{ ...COMPLETE, href: "/club/word-lid" }}
      />,
    );
    const link = screen.getByRole("link", { name: /schrijf je in/i });
    expect(link).toHaveAttribute("href", "/club/word-lid");
    expect(link).not.toHaveAttribute("target");
  });
});
