"use client";

/**
 * Member Details Modal
 *
 * Displays detailed information about a board member when clicked
 * in the organizational chart.
 */

import { useEffect, useState, useMemo } from "react";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";
import Link from "next/link";
import Image from "next/image";
import {
  findMemberResponsibilities,
  getCategoryInfo,
} from "@/lib/responsibility-utils";

interface MemberDetailsModalProps {
  member: OrgChartNode | null;
  isOpen: boolean;
  onClose: () => void;
  responsibilityPaths?: ResponsibilityPath[];
  onViewResponsibility?: (responsibilityId: string) => void;
}

/**
 * Show a modal with detailed information for a board member.
 *
 * While open, body scroll is locked and pressing Escape invokes the provided close callback.
 *
 * @returns The modal JSX when `isOpen` is true and `member` is provided; otherwise `null`.
 */
export function MemberDetailsModal({
  member,
  isOpen,
  onClose,
  responsibilityPaths = [],
  onViewResponsibility,
}: MemberDetailsModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Derive image source directly from props (no useEffect needed)
  const defaultImage = "/images/logo-flat.png";

  // Track if the member's image failed to load (only state we need)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  // Determine which image to show
  const imageSrc = useMemo(() => {
    const memberImage = member?.imageUrl;
    if (!memberImage || failedImages.has(memberImage)) {
      return defaultImage;
    }
    return memberImage;
  }, [member?.imageUrl, failedImages, defaultImage]);

  // Find linked responsibility paths
  const linkedResponsibilities = useMemo(() => {
    if (!member || !responsibilityPaths.length) return [];
    return findMemberResponsibilities(member.id, responsibilityPaths);
  }, [member, responsibilityPaths]);

  if (!isOpen || !member) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with green accent */}
        <div className="relative bg-gradient-to-r from-green-main to-green-hover p-6 text-white rounded-t-xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Close"
          >
            <span className="text-2xl leading-none">×</span>
          </button>

          <div className="flex items-center gap-6">
            <Image
              src={imageSrc}
              alt={member.name}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full border-4 border-white/30 object-cover"
              onError={() => {
                if (member.imageUrl) {
                  setFailedImages((prev) => {
                    if (prev.has(member.imageUrl!)) return prev;
                    const next = new Set(prev);
                    next.add(member.imageUrl!);
                    return next;
                  });
                }
              }}
            />
            <div>
              <h2
                className="text-2xl font-bold mb-1"
                style={{
                  fontFamily: "quasimoda, acumin-pro, Montserrat, sans-serif",
                }}
              >
                {member.name}
              </h2>
              <p className="text-white/90 text-lg">{member.title}</p>
              {member.roleCode && (
                <span
                  className="inline-block mt-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-md text-sm font-semibold tracking-wide"
                  style={{ fontFamily: "ibm-plex-mono, monospace" }}
                >
                  {member.roleCode}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Contact Information */}
          {(member.email || member.phone) && (
            <div>
              <h3
                className="text-lg font-bold text-gray-blue mb-3"
                style={{
                  fontFamily: "quasimoda, acumin-pro, Montserrat, sans-serif",
                }}
              >
                Contactgegevens
              </h3>
              <div className="space-y-2">
                {member.email && (
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-green-main flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <a
                      href={`mailto:${member.email}`}
                      className="text-green-main hover:text-green-hover hover:underline transition-colors"
                    >
                      {member.email}
                    </a>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-green-main flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <a
                      href={`tel:${member.phone}`}
                      className="text-green-main hover:text-green-hover hover:underline transition-colors"
                    >
                      {member.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Responsibilities */}
          {member.responsibilities && (
            <div>
              <h3
                className="text-lg font-bold text-gray-blue mb-3"
                style={{
                  fontFamily: "quasimoda, acumin-pro, Montserrat, sans-serif",
                }}
              >
                Verantwoordelijkheden
              </h3>
              <p className="text-gray-dark leading-relaxed">
                {member.responsibilities}
              </p>
            </div>
          )}

          {/* Department Badge */}
          {member.department && member.department !== "algemeen" && (
            <div>
              <h3
                className="text-lg font-bold text-gray-blue mb-3"
                style={{
                  fontFamily: "quasimoda, acumin-pro, Montserrat, sans-serif",
                }}
              >
                Afdeling
              </h3>
              <span className="inline-block px-4 py-2 bg-green-main/10 text-green-main rounded-lg font-medium">
                {member.department === "hoofdbestuur"
                  ? "Hoofdbestuur"
                  : "Jeugdbestuur"}
              </span>
            </div>
          )}

          {/* Linked Responsibility Paths */}
          {linkedResponsibilities.length > 0 && (
            <div>
              <h3
                className="text-lg font-bold text-gray-blue mb-3"
                style={{
                  fontFamily: "quasimoda, acumin-pro, Montserrat, sans-serif",
                }}
              >
                Hulpvragen ({linkedResponsibilities.length})
              </h3>
              <p className="text-sm text-gray-dark mb-3">
                Je kan deze persoon contacteren voor:
              </p>
              <div className="space-y-2">
                {linkedResponsibilities.map((path) => {
                  const categoryInfo = getCategoryInfo(path.category);
                  return (
                    <button
                      key={path.id}
                      onClick={() => onViewResponsibility?.(path.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:shadow-md ${categoryInfo.bgClass}`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`text-sm font-semibold ${categoryInfo.colorClass} shrink-0`}
                        >
                          {categoryInfo.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-blue">
                            {path.question}
                          </p>
                          <p className="text-xs text-gray-dark mt-1 line-clamp-2">
                            {path.summary}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Link to full profile */}
          {member.profileUrl && (
            <div className="pt-4 border-t border-gray-light">
              <Link
                href={member.profileUrl}
                className="inline-flex items-center gap-2 text-green-main hover:text-green-hover font-semibold transition-colors"
              >
                <span>Bekijk volledig profiel</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-green-main text-white font-semibold rounded-lg hover:bg-green-hover transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}
