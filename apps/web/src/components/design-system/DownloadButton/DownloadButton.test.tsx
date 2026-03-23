import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DownloadButton } from "./DownloadButton";

describe("DownloadButton", () => {
  it("should render the provided label", () => {
    render(
      <DownloadButton
        href="https://example.com/file.pdf"
        label="Aangifte Jeugd 2024-2025"
      />,
    );
    expect(screen.getByText("Aangifte Jeugd 2024-2025")).toBeInTheDocument();
  });

  it("should fall back to filename from URL when no label provided", () => {
    render(
      <DownloadButton href="https://cdn.sanity.io/files/abc/production/aangifte-jeugd-a1b2c3d4.pdf" />,
    );
    expect(screen.getByText("aangifte-jeugd")).toBeInTheDocument();
  });

  it("should render formatted file size when provided", () => {
    render(
      <DownloadButton
        href="https://example.com/file.pdf"
        label="Test"
        fileSize={245600}
      />,
    );
    expect(screen.getByText("240 KB")).toBeInTheDocument();
  });

  it("should not render size badge when fileSize is omitted", () => {
    const { container } = render(
      <DownloadButton href="https://example.com/file.pdf" label="Test" />,
    );
    expect(container.querySelector("[data-testid='file-size']")).toBeNull();
  });

  it("should set href and target='_blank' correctly", () => {
    render(
      <DownloadButton href="https://example.com/file.pdf" label="Download" />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com/file.pdf");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("should render correct icon per MIME type (PDF = red)", () => {
    const { container } = render(
      <DownloadButton
        href="https://example.com/file.pdf"
        label="Test"
        mimeType="application/pdf"
      />,
    );
    const accentBar = container.querySelector("[data-testid='accent-bar']");
    expect(accentBar).toHaveStyle({ backgroundColor: "#ef4444" });
  });

  it("should fall back to URL extension when no mimeType provided", () => {
    const { container } = render(
      <DownloadButton
        href="https://example.com/document.xlsx"
        label="Spreadsheet"
      />,
    );
    const accentBar = container.querySelector("[data-testid='accent-bar']");
    expect(accentBar).toHaveStyle({ backgroundColor: "#16a34a" });
  });

  it("should render inline variant without card chrome", () => {
    const { container } = render(
      <DownloadButton
        href="https://example.com/file.pdf"
        label="Reglement"
        variant="inline"
      />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveClass("inline-flex");
    expect(container.querySelector("[data-testid='accent-bar']")).toBeNull();
  });

  it("should render description in card variant", () => {
    render(
      <DownloadButton
        href="https://example.com/file.pdf"
        label="Aangifte"
        description="Inschrijvingsformulier voor nieuwe jeugdspelers"
      />,
    );
    expect(
      screen.getByText("Inschrijvingsformulier voor nieuwe jeugdspelers"),
    ).toBeInTheDocument();
  });

  it("should use fileName extension for type detection as fallback", () => {
    const { container } = render(
      <DownloadButton
        href="https://example.com/download?id=123"
        label="Test"
        fileName="report.docx"
      />,
    );
    const accentBar = container.querySelector("[data-testid='accent-bar']");
    expect(accentBar).toHaveStyle({ backgroundColor: "#3b82f6" });
  });

  it("should show file type subtitle", () => {
    render(
      <DownloadButton
        href="https://example.com/file.pdf"
        label="Test"
        mimeType="application/pdf"
      />,
    );
    expect(screen.getByText("PDF-bestand")).toBeInTheDocument();
  });

  it("should fall back to file type label when URL has no readable name", () => {
    render(
      <DownloadButton
        href="https://example.com/a1b2c3d4e5f6g7h8.pdf"
        mimeType="application/pdf"
      />,
    );
    expect(screen.getByText("PDF-bestand")).toBeInTheDocument();
  });

  it("should format bytes correctly", () => {
    const { rerender } = render(
      <DownloadButton
        href="https://example.com/f.pdf"
        label="T"
        fileSize={500}
      />,
    );
    expect(screen.getByText("500 B")).toBeInTheDocument();

    rerender(
      <DownloadButton
        href="https://example.com/f.pdf"
        label="T"
        fileSize={4200000}
      />,
    );
    expect(screen.getByText("4.0 MB")).toBeInTheDocument();
  });
});
