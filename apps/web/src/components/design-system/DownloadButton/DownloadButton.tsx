"use client";

import { DownloadSimple } from "@/lib/icons.redesign";
import { cn } from "@/lib/utils/cn";
import { PRESS_DOWN_CLASSES } from "../press-down";

export interface DownloadButtonProps {
  /** File download URL */
  href: string;
  /** Display label — falls back to cleaned filename from URL */
  label?: string;
  /** MIME type for icon + colour detection — falls back to URL extension */
  mimeType?: string;
  /** File size in bytes — omit to hide the size badge */
  fileSize?: number;
  /** Original filename — used for type detection fallback + download attribute */
  fileName?: string;
  /** Optional description shown below the label (card variant only) */
  description?: string;
  /**
   * Visual variant per fileattachment-htmltable-locked.md §5.1:
   * - `card` (default): TapedCard + stenciled corner stamp + jersey-deep CTA.
   * - `inline`: compact chip for in-prose references — file-type pill + label + size.
   */
  variant?: "card" | "inline";
  className?: string;
}

/**
 * Semantic file-type metadata. The `color` palette and `stampLabel`
 * vocabulary stay editor-deterministic — only the visual presentation
 * changes in the Phase 5 redesign.
 */
interface FileTypeInfo {
  /** Stamp + extension-pill background colour (file-type accent). */
  color: string;
  /** Stencil label rendered inside the corner stamp / extension pill. */
  stampLabel: string;
  /** Dutch subtitle rendered under the file label in the card body. */
  subtitle: string;
}

const FILE_TYPES: Record<string, FileTypeInfo> = {
  pdf: { color: "#c0392b", stampLabel: "PDF", subtitle: "PDF-bestand" },
  word: { color: "#2563b3", stampLabel: "DOCX", subtitle: "Word-document" },
  excel: { color: "#15803d", stampLabel: "XLSX", subtitle: "Excel-bestand" },
  powerpoint: {
    color: "#f97316",
    stampLabel: "PPTX",
    subtitle: "Presentatie",
  },
  audio: { color: "#7c3aed", stampLabel: "MP3", subtitle: "Audio" },
  video: { color: "#0f766e", stampLabel: "MP4", subtitle: "Video" },
  zip: { color: "#d97706", stampLabel: "ZIP", subtitle: "Archief" },
  other: { color: "#6b7280", stampLabel: "FILE", subtitle: "Bijlage" },
};

const MIME_MAP: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "word",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "word",
  "application/vnd.ms-excel": "excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "excel",
  "application/vnd.ms-powerpoint": "powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "powerpoint",
  "application/zip": "zip",
  "application/x-rar-compressed": "zip",
  "audio/mpeg": "audio",
  "audio/mp3": "audio",
  "audio/wav": "audio",
  "audio/x-wav": "audio",
  "video/mp4": "video",
  "video/quicktime": "video",
};

const EXT_MAP: Record<string, string> = {
  pdf: "pdf",
  doc: "word",
  docx: "word",
  xls: "excel",
  xlsx: "excel",
  ppt: "powerpoint",
  pptx: "powerpoint",
  zip: "zip",
  rar: "zip",
  mp3: "audio",
  wav: "audio",
  mp4: "video",
  mov: "video",
};

function getExtension(str: string): string | undefined {
  const match = str.match(/\.(\w+)(?:\?.*)?$/);
  return match?.[1]?.toLowerCase();
}

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

function isSafeHref(href: string): boolean {
  try {
    return SAFE_PROTOCOLS.has(new URL(href).protocol);
  } catch {
    return false;
  }
}

function normalizeMimeType(mimeType: string): string {
  return mimeType.split(";")[0].trim().toLowerCase();
}

function detectFileType(
  mimeType?: string,
  href?: string,
  fileName?: string,
): FileTypeInfo {
  if (mimeType) {
    const normalized = normalizeMimeType(mimeType);
    if (MIME_MAP[normalized]) {
      return FILE_TYPES[MIME_MAP[normalized]];
    }
  }

  const urlExt = href ? getExtension(href) : undefined;
  if (urlExt && EXT_MAP[urlExt]) {
    return FILE_TYPES[EXT_MAP[urlExt]];
  }

  const fileExt = fileName ? getExtension(fileName) : undefined;
  if (fileExt && EXT_MAP[fileExt]) {
    return FILE_TYPES[EXT_MAP[fileExt]];
  }

  return FILE_TYPES.other;
}

function extractLabelFromUrl(href: string): string | undefined {
  try {
    const url = new URL(href);
    const lastSegment = url.pathname.split("/").pop() ?? "";
    const decoded = decodeURIComponent(lastSegment);
    const withoutExt = decoded.replace(/\.\w+$/, "");
    const withoutHash = withoutExt.replace(/-[a-f0-9]{8,}$/, "");
    if (!withoutHash || /^[a-f0-9]+$/.test(withoutHash)) return undefined;
    return withoutHash;
  } catch {
    return undefined;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const DownloadButton = ({
  href,
  label,
  mimeType,
  fileSize,
  fileName,
  description,
  variant = "card",
  className,
}: DownloadButtonProps) => {
  const fileType = detectFileType(mimeType, href, fileName);
  const displayLabel = label ?? extractLabelFromUrl(href) ?? fileType.subtitle;
  const safeHref = isSafeHref(href) ? href : undefined;

  if (variant === "inline") {
    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        data-download-variant="inline"
        className={cn(
          "group inline-flex h-10 max-w-full items-center gap-2.5 align-baseline",
          "border-ink bg-cream border px-2.5",
          "shadow-paper-sm",
          "no-underline",
          PRESS_DOWN_CLASSES,
          className,
        )}
      >
        <span
          data-testid="file-type-pill"
          aria-hidden="true"
          className="text-cream inline-flex h-[22px] items-center px-[7px] font-mono text-[9px] leading-none font-medium tracking-[0.16em] uppercase"
          style={{ backgroundColor: fileType.color }}
        >
          {fileType.stampLabel}
        </span>
        <span className="font-display text-ink max-w-[40ch] truncate text-[16px] italic">
          {displayLabel}
        </span>
        {fileSize != null && (
          <span
            data-testid="file-size"
            className="text-ink-muted font-mono text-[11px] tracking-[0.1em] uppercase"
          >
            {formatFileSize(fileSize)}
          </span>
        )}
        <DownloadSimple
          size={14}
          aria-hidden="true"
          className="text-ink-muted shrink-0"
        />
      </a>
    );
  }

  // Card variant — TapedCard + stenciled corner stamp + jersey-deep CTA.
  // Composes its own paper frame so the press-down hover applies to the
  // whole anchor (the locked spec keeps the offset shadow on the anchor,
  // not the inner TapedCard).
  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      data-download-variant="card"
      className={cn(
        "group relative block w-full no-underline",
        "border-ink bg-cream border-2",
        "shadow-paper-md",
        PRESS_DOWN_CLASSES,
        className,
      )}
    >
      {/* Ochre tape strip — single, centered top, slight rotation. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 z-20 block h-4 w-16 -translate-x-1/2 -translate-y-1/2 opacity-90"
        style={{
          backgroundColor: "var(--color-tape-cream, rgba(232, 224, 200, 0.85))",
          transform: "translate(-50%, -50%) rotate(-2deg)",
        }}
      />
      <div className="flex items-center gap-4 p-4 sm:p-5">
        <span
          data-testid="file-type-stamp"
          aria-hidden="true"
          className="inline-flex h-16 w-16 shrink-0 items-center justify-center border-2 font-mono text-[16px] leading-none font-extrabold tracking-[0.04em] uppercase"
          style={{
            borderColor: fileType.color,
            color: fileType.color,
            backgroundColor: `color-mix(in srgb, ${fileType.color} 6%, transparent)`,
            transform: "rotate(-3deg)",
          }}
        >
          <span className="flex flex-col items-center gap-0.5">
            <span>{fileType.stampLabel}</span>
            <span className="text-[8px] font-medium tracking-[0.18em] opacity-80">
              BESTAND
            </span>
          </span>
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-display text-ink truncate text-[18px] font-bold italic">
            {displayLabel}
          </span>
          <span className="text-ink-muted mt-0.5 font-mono text-[10px] tracking-[0.14em] uppercase">
            {fileSize != null ? (
              <>
                <span data-testid="file-size">{formatFileSize(fileSize)}</span>
                <span aria-hidden="true"> · </span>
              </>
            ) : null}
            <span>{fileType.subtitle}</span>
          </span>
          {description && (
            <span className="text-ink-soft mt-1 font-serif text-[14px] italic">
              {description}
            </span>
          )}
        </div>
        <span
          data-testid="download-cta"
          aria-hidden="true"
          className={cn(
            "hidden h-9 shrink-0 items-center gap-1.5 sm:inline-flex",
            "border-ink bg-jersey-deep border px-3.5",
            "text-cream font-mono text-[11px] leading-none tracking-[0.14em] uppercase",
            // Card-level press-down already collapses the outer shadow;
            // give the inner pill the same offset so it reads as a stamped
            // affordance even in the rest state.
            "shadow-paper-sm",
          )}
        >
          <DownloadSimple size={12} aria-hidden="true" />
          Download
        </span>
      </div>
    </a>
  );
};

DownloadButton.displayName = "DownloadButton";
