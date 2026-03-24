/**
 * PlayerShare Component
 *
 * Share card with QR code for social sharing of player profiles.
 *
 * Features:
 * - QR code generation linking to player profile
 * - Copy profile URL to clipboard
 * - Social share buttons (Facebook, X/Twitter)
 * - Download QR code as image
 * - Multiple display variants (default, compact, printable)
 */

"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils/cn";

export interface PlayerShareProps extends HTMLAttributes<HTMLDivElement> {
  /** Player full name */
  playerName: string;
  /** Player URL slug for profile link */
  playerSlug: string;
  /** Team name */
  teamName: string;
  /** Whether to show QR code */
  showQR?: boolean;
  /** Display variant */
  variant?: "default" | "compact" | "printable";
  /** Loading state */
  isLoading?: boolean;
  /** Base URL for sharing (defaults to kcvvelewijt.be) */
  baseUrl?: string;
}

export const PlayerShare = forwardRef<HTMLDivElement, PlayerShareProps>(
  (
    {
      playerName,
      playerSlug,
      teamName,
      showQR = true,
      variant = "default",
      isLoading = false,
      baseUrl = "https://www.kcvvelewijt.be",
      className,
      ...props
    },
    ref,
  ) => {
    const [copied, setCopied] = useState(false);
    const qrRef = useRef<HTMLDivElement>(null);
    const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const profileUrl = `${baseUrl}/player/${playerSlug}`;

    // Clean up timeout on unmount
    useEffect(() => {
      return () => {
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
      };
    }, []);

    const handleCopyLink = useCallback(async () => {
      try {
        await navigator.clipboard.writeText(profileUrl);
        setCopied(true);
        // Clear any existing timeout
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
        copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }, [profileUrl]);

    const handleShareFacebook = useCallback(() => {
      const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
      window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
    }, [profileUrl]);

    const handleShareTwitter = useCallback(() => {
      const text = `Bekijk het spelersprofiel van ${playerName} bij ${teamName}`;
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`;
      window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
    }, [profileUrl, playerName, teamName]);

    const handleDownloadQR = useCallback(() => {
      if (!qrRef.current) return;

      const svg = qrRef.current.querySelector("svg");
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");

        const downloadLink = document.createElement("a");
        downloadLink.download = `${playerSlug}-qr.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };

      img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    }, [playerSlug]);

    // Loading skeleton
    if (isLoading) {
      return (
        <div
          ref={ref}
          className={cn("animate-pulse", className)}
          aria-label="Delen laden..."
          {...props}
        >
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="h-5 w-32 bg-gray-300 rounded mb-4" />
            {showQR && (
              <div className="w-32 h-32 bg-gray-200 rounded mx-auto mb-4" />
            )}
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 rounded" />
              <div className="flex gap-2">
                <div className="h-10 flex-1 bg-gray-200 rounded" />
                <div className="h-10 flex-1 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Printable variant - optimized for printing
    if (variant === "printable") {
      return (
        <div
          ref={ref}
          className={cn(
            "bg-white p-6 text-center print:shadow-none",
            className,
          )}
          {...props}
        >
          <h3 className="text-xl font-semibold text-kcvv-gray-dark mb-1">
            {playerName}
          </h3>
          <p className="text-sm text-kcvv-gray mb-4">{teamName}</p>

          {showQR && (
            <div ref={qrRef} className="inline-block mb-4">
              <QRCodeSVG
                value={profileUrl}
                size={160}
                level="H"
                includeMargin
                bgColor="#ffffff"
                fgColor="#1a1a1a"
              />
            </div>
          )}

          <p className="text-xs text-kcvv-gray break-all">{profileUrl}</p>
        </div>
      );
    }

    // Compact variant - no QR, just share buttons
    if (variant === "compact") {
      return (
        <div
          ref={ref}
          className={cn(
            "bg-white rounded-lg border border-gray-200 p-3",
            className,
          )}
          {...props}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                copied
                  ? "bg-kcvv-green-bright text-white"
                  : "bg-gray-100 text-kcvv-gray-dark hover:bg-gray-200",
              )}
              aria-label={copied ? "Link gekopieerd" : "Kopieer link"}
            >
              {copied ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Gekopieerd!
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Kopieer
                </>
              )}
            </button>

            <button
              onClick={handleShareFacebook}
              className="p-2 rounded-md bg-[#1877f2] text-white hover:bg-[#166fe5] transition-colors"
              aria-label="Delen op Facebook"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
              </svg>
            </button>

            <button
              onClick={handleShareTwitter}
              className="p-2 rounded-md bg-black text-white hover:bg-gray-800 transition-colors"
              aria-label="Delen op X"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
          </div>
        </div>
      );
    }

    // Default variant - full share card with QR
    return (
      <div
        ref={ref}
        className={cn(
          "bg-white rounded-lg border border-gray-200 p-4",
          className,
        )}
        {...props}
      >
        <h3 className="text-lg font-semibold text-kcvv-gray-dark mb-1">
          Deel dit profiel
        </h3>
        <p className="text-sm text-kcvv-gray mb-4">
          {playerName} • {teamName}
        </p>

        {showQR && (
          <div ref={qrRef} className="flex justify-center mb-4">
            <QRCodeSVG
              value={profileUrl}
              size={128}
              level="M"
              includeMargin
              bgColor="#ffffff"
              fgColor="#1a1a1a"
            />
          </div>
        )}

        <div className="space-y-2">
          {/* Copy link button */}
          <button
            onClick={handleCopyLink}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md transition-colors",
              copied
                ? "bg-kcvv-green-bright text-white"
                : "bg-gray-100 text-kcvv-gray-dark hover:bg-gray-200",
            )}
            aria-label={copied ? "Link gekopieerd" : "Kopieer profiel link"}
          >
            {copied ? (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Link gekopieerd!
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Kopieer link
              </>
            )}
          </button>

          {/* Social share buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleShareFacebook}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md bg-[#1877f2] text-white hover:bg-[#166fe5] transition-colors"
              aria-label="Delen op Facebook"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z" />
              </svg>
              Facebook
            </button>

            <button
              onClick={handleShareTwitter}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md bg-black text-white hover:bg-gray-800 transition-colors"
              aria-label="Delen op X"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              X
            </button>
          </div>

          {/* Download QR button */}
          {showQR && (
            <button
              onClick={handleDownloadQR}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md border border-gray-300 text-kcvv-gray-dark hover:bg-gray-50 transition-colors"
              aria-label="Download QR code"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download QR code
            </button>
          )}
        </div>
      </div>
    );
  },
);

PlayerShare.displayName = "PlayerShare";
