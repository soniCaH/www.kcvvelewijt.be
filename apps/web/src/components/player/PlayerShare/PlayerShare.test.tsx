/**
 * PlayerShare Component Tests
 */

import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PlayerShare } from "./PlayerShare";

// Mock clipboard API using Object.defineProperty
const mockWriteText = vi.fn().mockResolvedValue(undefined);

// Mock window.open
const mockWindowOpen = vi.fn();

// Store original globals for restoration
const originalClipboard = navigator.clipboard;
const originalWindowOpen = window.open;

describe("PlayerShare", () => {
  const defaultProps = {
    playerName: "Chiel Bertens",
    playerSlug: "chiel-bertens",
    teamName: "Eerste Ploeg",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    });
    // Mock window.open
    window.open = mockWindowOpen;
  });

  afterEach(() => {
    // Restore original globals
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
    window.open = originalWindowOpen;
  });

  describe("default variant", () => {
    it("renders share heading", () => {
      render(<PlayerShare {...defaultProps} />);

      expect(screen.getByText("Deel dit profiel")).toBeInTheDocument();
    });

    it("renders player name and team", () => {
      render(<PlayerShare {...defaultProps} />);

      expect(
        screen.getByText("Chiel Bertens • Eerste Ploeg"),
      ).toBeInTheDocument();
    });

    it("renders QR code when showQR is true", () => {
      render(<PlayerShare {...defaultProps} showQR />);

      // QR code renders, so download button should be present
      expect(
        screen.getByRole("button", { name: /download qr/i }),
      ).toBeInTheDocument();
    });

    it("does not render QR code when showQR is false", () => {
      render(<PlayerShare {...defaultProps} showQR={false} />);

      expect(
        screen.queryByRole("button", { name: "Download QR code" }),
      ).not.toBeInTheDocument();
    });

    it("renders copy link button", () => {
      render(<PlayerShare {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /kopieer/i }),
      ).toBeInTheDocument();
    });

    it("renders Facebook share button", () => {
      render(<PlayerShare {...defaultProps} />);

      expect(
        screen.getByRole("button", { name: /facebook/i }),
      ).toBeInTheDocument();
    });

    it("renders download QR button when QR is shown", () => {
      render(<PlayerShare {...defaultProps} showQR />);

      expect(
        screen.getByRole("button", { name: /download qr/i }),
      ).toBeInTheDocument();
    });
  });

  describe("copy link functionality", () => {
    it("copies link to clipboard when clicked", async () => {
      render(<PlayerShare {...defaultProps} />);

      const copyButton = screen.getByRole("button", { name: /kopieer/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          "https://www.kcvvelewijt.be/player/chiel-bertens",
        );
      });
    });

    it("shows copied confirmation after clicking", async () => {
      render(<PlayerShare {...defaultProps} />);

      const copyButton = screen.getByRole("button", { name: /kopieer/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/gekopieerd/i)).toBeInTheDocument();
      });
    });

    it("uses custom baseUrl when provided", async () => {
      render(
        <PlayerShare {...defaultProps} baseUrl="https://custom.example.com" />,
      );

      const copyButton = screen.getByRole("button", { name: /kopieer/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          "https://custom.example.com/player/chiel-bertens",
        );
      });
    });
  });

  describe("social sharing", () => {
    it("opens Facebook share dialog when clicked", () => {
      render(<PlayerShare {...defaultProps} />);

      const facebookButton = screen.getByRole("button", {
        name: /facebook/i,
      });
      fireEvent.click(facebookButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining("facebook.com/sharer"),
        "_blank",
        "noopener,noreferrer,width=600,height=400",
      );
    });
  });

  describe("compact variant", () => {
    it("renders compact layout", () => {
      render(<PlayerShare {...defaultProps} variant="compact" />);

      // Compact variant doesn't have the "Deel dit profiel" heading
      expect(screen.queryByText("Deel dit profiel")).not.toBeInTheDocument();
    });

    it("still has copy and share functionality", () => {
      render(<PlayerShare {...defaultProps} variant="compact" />);

      expect(
        screen.getByRole("button", { name: /kopieer/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /facebook/i }),
      ).toBeInTheDocument();
    });

    it("shows copied confirmation in compact variant", async () => {
      render(<PlayerShare {...defaultProps} variant="compact" />);

      const copyButton = screen.getByRole("button", { name: /kopieer/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText(/gekopieerd/i)).toBeInTheDocument();
      });
    });

    it("copies link to clipboard in compact variant", async () => {
      render(<PlayerShare {...defaultProps} variant="compact" />);

      const copyButton = screen.getByRole("button", { name: /kopieer/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          "https://www.kcvvelewijt.be/player/chiel-bertens",
        );
      });
    });

    it("opens Facebook share dialog in compact variant", () => {
      render(<PlayerShare {...defaultProps} variant="compact" />);

      const facebookButton = screen.getByRole("button", {
        name: /facebook/i,
      });
      fireEvent.click(facebookButton);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining("facebook.com/sharer"),
        "_blank",
        "noopener,noreferrer,width=600,height=400",
      );
    });
  });

  describe("printable variant", () => {
    it("renders printable layout with player name", () => {
      render(<PlayerShare {...defaultProps} variant="printable" />);

      expect(screen.getByText("Chiel Bertens")).toBeInTheDocument();
    });

    it("shows profile URL in printable variant", () => {
      render(<PlayerShare {...defaultProps} variant="printable" />);

      expect(
        screen.getByText("https://www.kcvvelewijt.be/player/chiel-bertens"),
      ).toBeInTheDocument();
    });

    it("renders QR code in printable variant", () => {
      render(<PlayerShare {...defaultProps} variant="printable" showQR />);

      // Printable variant with QR should show the profile URL
      expect(
        screen.getByText("https://www.kcvvelewijt.be/player/chiel-bertens"),
      ).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("renders loading skeleton when isLoading is true", () => {
      render(<PlayerShare {...defaultProps} isLoading />);

      expect(screen.getByLabelText("Delen laden...")).toBeInTheDocument();
    });

    it("does not render buttons in loading state", () => {
      render(<PlayerShare {...defaultProps} isLoading />);

      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has accessible labels on all buttons", () => {
      render(<PlayerShare {...defaultProps} showQR />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });

    it("has aria-hidden on decorative SVG icons", () => {
      const { container } = render(<PlayerShare {...defaultProps} />);

      const decorativeIcons = container.querySelectorAll(
        'svg[aria-hidden="true"]',
      );
      expect(decorativeIcons.length).toBeGreaterThan(0);
    });
  });

  describe("ref forwarding", () => {
    it("forwards ref to the root element", () => {
      const ref = { current: null };
      render(<PlayerShare {...defaultProps} ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("forwards ref in loading state", () => {
      const ref = { current: null };
      render(<PlayerShare {...defaultProps} isLoading ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it("forwards ref in printable variant", () => {
      const ref = { current: null };
      render(<PlayerShare {...defaultProps} variant="printable" ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe("className merging", () => {
    it("applies custom className to root element", () => {
      const { container } = render(
        <PlayerShare {...defaultProps} className="custom-class" />,
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });

    it("applies custom className in compact variant", () => {
      const { container } = render(
        <PlayerShare
          {...defaultProps}
          variant="compact"
          className="custom-class"
        />,
      );

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("error handling", () => {
    it("handles clipboard write errors gracefully", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockWriteText.mockRejectedValueOnce(new Error("Clipboard not available"));

      render(<PlayerShare {...defaultProps} />);

      const copyButton = screen.getByRole("button", { name: /kopieer/i });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith(
          "Failed to copy:",
          expect.any(Error),
        );
      });

      consoleError.mockRestore();
    });
  });

  describe("copy timeout behavior", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("clears existing timeout on rapid copy clicks", async () => {
      render(<PlayerShare {...defaultProps} />);

      const copyButton = screen.getByRole("button", { name: /kopieer/i });

      // First click
      await act(async () => {
        fireEvent.click(copyButton);
      });

      // Verify copied state is shown
      expect(screen.getByText(/gekopieerd/i)).toBeInTheDocument();

      // Second click before timeout expires (should clear first timeout)
      await act(async () => {
        fireEvent.click(copyButton);
      });

      // Still showing copied
      expect(screen.getByText(/gekopieerd/i)).toBeInTheDocument();

      // Advance time to trigger the timeout
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // After timeout, copied state should be cleared
      expect(screen.queryByText(/gekopieerd/i)).not.toBeInTheDocument();
    });

    it("cleans up timeout on unmount", async () => {
      const { unmount } = render(<PlayerShare {...defaultProps} />);

      const copyButton = screen.getByRole("button", { name: /kopieer/i });

      // Trigger copy to set up timeout
      await act(async () => {
        fireEvent.click(copyButton);
      });

      // Unmount before timeout completes - should not throw
      unmount();

      // Advance timers - should not cause any errors
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });
    });
  });

  describe("QR code download", () => {
    it("handles download when QR ref is available", () => {
      const mockClick = vi.fn();
      const mockToDataURL = vi
        .fn()
        .mockReturnValue("data:image/png;base64,abc");
      const mockDrawImage = vi.fn();
      const mockGetContext = vi.fn().mockReturnValue({
        drawImage: mockDrawImage,
      });

      // Mock createElement to return controlled elements
      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = vi
        .spyOn(document, "createElement")
        .mockImplementation((tagName) => {
          if (tagName === "canvas") {
            const canvas = originalCreateElement("canvas");
            canvas.getContext = mockGetContext;
            canvas.toDataURL = mockToDataURL;
            return canvas;
          }
          if (tagName === "a") {
            const link = originalCreateElement("a");
            link.click = mockClick;
            return link;
          }
          return originalCreateElement(tagName);
        });

      // Mock XMLSerializer as a proper class
      const mockSerializeToString = vi.fn().mockReturnValue("<svg></svg>");
      const OriginalXMLSerializer = window.XMLSerializer;
      window.XMLSerializer = class MockXMLSerializer {
        serializeToString = mockSerializeToString;
      } as unknown as typeof XMLSerializer;

      // Mock Image to capture onload and trigger it
      const OriginalImage = window.Image;
      const capturedCallbacks: { onload: (() => void) | null } = {
        onload: null,
      };
      window.Image = class MockImage {
        width = 128;
        height = 128;
        src = "";
        onload: (() => void) | null = null;

        constructor() {
          // Capture onload when set
          Object.defineProperty(this, "onload", {
            set: (fn: () => void) => {
              capturedCallbacks.onload = fn;
            },
            get: () => capturedCallbacks.onload,
          });
        }
      } as unknown as typeof Image;

      render(<PlayerShare {...defaultProps} showQR />);

      const downloadButton = screen.getByRole("button", {
        name: /download qr/i,
      });
      fireEvent.click(downloadButton);

      // Verify XMLSerializer was called
      expect(mockSerializeToString).toHaveBeenCalled();

      // Trigger the image onload
      if (capturedCallbacks.onload) {
        capturedCallbacks.onload();
      }

      // Verify canvas operations and download link click
      expect(mockGetContext).toHaveBeenCalledWith("2d");
      expect(mockDrawImage).toHaveBeenCalled();
      expect(mockToDataURL).toHaveBeenCalledWith("image/png");
      expect(mockClick).toHaveBeenCalled();

      // Restore mocks
      window.XMLSerializer = OriginalXMLSerializer;
      window.Image = OriginalImage;
      createElementSpy.mockRestore();
    });

    it("does nothing when showQR is false (no download button)", () => {
      render(<PlayerShare {...defaultProps} showQR={false} />);

      expect(
        screen.queryByRole("button", { name: /download qr/i }),
      ).not.toBeInTheDocument();
    });
  });
});
