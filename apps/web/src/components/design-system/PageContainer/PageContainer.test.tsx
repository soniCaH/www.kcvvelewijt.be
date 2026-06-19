import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageContainer } from "./PageContainer";

describe("PageContainer", () => {
  it("centers content at the default (--container-wide) body width with the canonical gutter", () => {
    render(<PageContainer>hello</PageContainer>);
    const el = screen.getByText("hello");
    expect(el.className).toContain("mx-auto");
    expect(el.className).toContain("w-full");
    expect(el.className).toContain("px-4");
    expect(el.className).toContain("md:px-8");
    expect(el.className).toContain("max-w-[var(--container-wide)]");
  });

  it("supports the prose width (reading column + forms/legal)", () => {
    render(<PageContainer width="prose">prose</PageContainer>);
    expect(screen.getByText("prose").className).toContain(
      "max-w-[var(--container-prose)]",
    );
  });

  it("supports the index width (card-grid listings)", () => {
    render(<PageContainer width="index">index</PageContainer>);
    expect(screen.getByText("index").className).toContain(
      "max-w-[var(--container-index)]",
    );
  });

  it("forwards an id for in-page nav anchors", () => {
    render(<PageContainer id="klassement">anchor</PageContainer>);
    expect(screen.getByText("anchor").id).toBe("klassement");
  });

  it("renders as a custom element via `as`", () => {
    render(<PageContainer as="section">section</PageContainer>);
    expect(screen.getByText("section").tagName).toBe("SECTION");
  });

  it("merges a passthrough className (e.g. vertical rhythm)", () => {
    render(<PageContainer className="py-12 lg:py-16">rhythm</PageContainer>);
    const el = screen.getByText("rhythm");
    expect(el.className).toContain("py-12");
    expect(el.className).toContain("lg:py-16");
  });
});
