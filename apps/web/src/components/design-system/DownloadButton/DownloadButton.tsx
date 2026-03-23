"use client";

import {
  Download,
  File,
  FileText,
  Table2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

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
  /** Visual variant: "card" (default) for standalone, "inline" for within prose */
  variant?: "card" | "inline";
  className?: string;
}

interface FileTypeInfo {
  color: string;
  icon: LucideIcon;
  subtitle: string;
}

const FILE_TYPES: Record<string, FileTypeInfo> = {
  pdf: { color: "#ef4444", icon: FileText, subtitle: "PDF-bestand" },
  word: { color: "#3b82f6", icon: FileText, subtitle: "Word-document" },
  excel: { color: "#16a34a", icon: Table2, subtitle: "Excel-bestand" },
  powerpoint: {
    color: "#f97316",
    icon: FileText,
    subtitle: "Presentatie",
  },
  zip: { color: "#d97706", icon: File, subtitle: "Archief" },
  other: { color: "#6b7280", icon: File, subtitle: "Bijlage" },
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
    // Strip extension
    const withoutExt = decoded.replace(/\.\w+$/, "");
    // Strip Sanity content hash (-a1b2c3d4 or longer hex at end)
    const withoutHash = withoutExt.replace(/-[a-f0-9]{8,}$/, "");
    // If result is empty or looks like just a hash, return undefined
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
  const IconComponent = fileType.icon;
  const displayLabel = label ?? extractLabelFromUrl(href) ?? fileType.subtitle;
  const safeHref = isSafeHref(href) ? href : undefined;

  if (variant === "inline") {
    return (
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "group inline-flex items-baseline gap-1.5 no-underline",
          className,
        )}
      >
        <IconComponent
          size={16}
          style={{ color: fileType.color }}
          className="relative top-[2px] shrink-0"
        />
        <span className="underline decoration-gray-300 underline-offset-2 group-hover:decoration-current">
          {displayLabel}
        </span>
        {fileSize != null && (
          <>
            <span className="text-gray-400">&mdash;</span>
            <span className="text-sm text-gray-400" data-testid="file-size">
              {formatFileSize(fileSize)}
            </span>
          </>
        )}
        <Download
          size={16}
          className="relative top-[2px] shrink-0 text-gray-400"
        />
      </a>
    );
  }

  return (
    <a
      href={safeHref}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-center gap-4 rounded-lg border border-[#edeff4] bg-white shadow-sm",
        "transition-all duration-300 hover:bg-gray-50 hover:shadow-lg hover:scale-[1.02]",
        "overflow-hidden no-underline",
        className,
      )}
    >
      <div
        data-testid="accent-bar"
        className="w-1 self-stretch rounded-l-lg"
        style={{ backgroundColor: fileType.color }}
      />
      <div className="flex items-center py-3">
        <IconComponent
          size={24}
          style={{ color: fileType.color }}
          className="shrink-0"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-3">
        <span className="truncate font-semibold text-gray-700">
          {displayLabel}
        </span>
        <span className="text-sm text-gray-400">{fileType.subtitle}</span>
        {description && (
          <span className="text-sm text-gray-400">{description}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 py-3 pr-4">
        {fileSize != null && (
          <span
            data-testid="file-size"
            className="rounded bg-gray-50 px-2 py-1 font-mono text-xs text-gray-400"
          >
            {formatFileSize(fileSize)}
          </span>
        )}
        <Download size={20} className="text-gray-400" />
      </div>
    </a>
  );
};

DownloadButton.displayName = "DownloadButton";
