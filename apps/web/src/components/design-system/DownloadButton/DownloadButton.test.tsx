import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DownloadButton } from "./DownloadButton";

describe("DownloadButton", () => {
  it("renders the provided label", () => {
    render(
      <DownloadButton
        href="https://example.com/file.pdf"
        label="Aangifte Jeugd 2024-2025"
      />,
    );
    expect(screen.getByText("Aangifte Jeugd 2024-2025")).toBeInTheDocument();
  });

  it("falls back to filename from URL when no label provided", () => {
    render(
      <DownloadButton href="https://cdn.sanity.io/files/abc/production/aangifte-jeugd-a1b2c3d4.pdf" />,
    );
    expect(screen.getByText("aangifte-jeugd")).toBeInTheDocument();
  });

  it("renders formatted file size when provided", () => {
    render(
      <DownloadButton
        href="https://example.com/file.pdf"
        label="Test"
        fileSize={245600}
      />,
    );
    expect(screen.getByText("240 KB")).toBeInTheDocument();
  });

  it("does not render size badge when fileSize is omitted", () => {
    render(<DownloadButton href="https://example.com/file.pdf" label="Test" />);
    expect(screen.queryByTestId("file-size")).toBeNull();
  });

  it("sets href and target='_blank' correctly", () => {
    render(
      <DownloadButton href="https://example.com/file.pdf" label="Download" />,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com/file.pdf");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("card variant: stamp colour reflects file type (PDF = red)", () => {
    render(
      <DownloadButton
        href="https://example.com/file.pdf"
        label="Test"
        mimeType="application/pdf"
      />,
    );
    const stamp = screen.getByTestId("file-type-stamp");
    expect(stamp).toHaveStyle({ borderColor: "#c0392b" });
    expect(stamp).toHaveStyle({ color: "#c0392b" });
    expect(stamp.textContent).toContain("PDF");
  });

  it("card variant: falls back to URL extension when no mimeType provided", () => {
    render(
      <DownloadButton
        href="https://example.com/document.xlsx"
        label="Spreadsheet"
      />,
    );
    const stamp = screen.getByTestId("file-type-stamp");
    expect(stamp).toHaveStyle({ borderColor: "#15803d" });
    expect(stamp.textContent).toContain("XLSX");
  });

  it("inline variant: renders a file-type pill instead of the stamp + CTA", () => {
    render(
      <DownloadButton
        href="https://example.com/file.pdf"
        label="Reglement"
        variant="inline"
      />,
    );
    expect(screen.getByTestId("file-type-pill")).toBeInTheDocument();
    expect(screen.queryByTestId("file-type-stamp")).toBeNull();
    expect(screen.queryByTestId("download-cta")).toBeNull();
  });

  it("inline variant: pill uses file-type colour for the background", () => {
    render(
      <DownloadButton
        href="https://example.com/file.pdf"
        label="Reglement"
        mimeType="application/pdf"
        variant="inline"
      />,
    );
    const pill = screen.getByTestId("file-type-pill");
    expect(pill).toHaveStyle({ backgroundColor: "#c0392b" });
    expect(pill.textContent).toBe("PDF");
  });

  it("card variant: renders description below the label", () => {
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

  it("uses fileName extension for type detection as fallback", () => {
    render(
      <DownloadButton
        href="https://example.com/download?id=123"
        label="Test"
        fileName="report.docx"
      />,
    );
    const stamp = screen.getByTestId("file-type-stamp");
    expect(stamp).toHaveStyle({ borderColor: "#2563b3" });
    expect(stamp.textContent).toContain("DOCX");
  });

  it("card variant: renders the file type subtitle in the meta line", () => {
    render(
      <DownloadButton
        href="https://example.com/file.pdf"
        label="Test"
        mimeType="application/pdf"
      />,
    );
    expect(screen.getByText("PDF-bestand")).toBeInTheDocument();
  });

  it("card variant: falls back to file type subtitle when URL has no readable name", () => {
    render(
      <DownloadButton
        href="https://example.com/a1b2c3d4e5f6g7h8.pdf"
        mimeType="application/pdf"
      />,
    );
    // Label slot falls through to the subtitle ("PDF-bestand"); the
    // stamp + meta-row also carry the subtitle, so >= 1 instance is fine.
    expect(screen.getAllByText("PDF-bestand").length).toBeGreaterThan(0);
  });

  it("formats bytes correctly", () => {
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

  it("detects MP3 audio via mime type", () => {
    render(
      <DownloadButton
        href="https://example.com/cast.mp3"
        label="Podcast"
        mimeType="audio/mpeg"
      />,
    );
    expect(screen.getByTestId("file-type-stamp").textContent).toContain("MP3");
  });

  it("detects MP4 video via mime type", () => {
    render(
      <DownloadButton
        href="https://example.com/clip.mp4"
        label="Clip"
        mimeType="video/mp4"
      />,
    );
    expect(screen.getByTestId("file-type-stamp").textContent).toContain("MP4");
  });
});
