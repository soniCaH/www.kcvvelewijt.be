"use client";

/**
 * Member Details Modal
 *
 * Displays detailed information about a board position when clicked
 * in the organizational chart. Handles vacant, single, and shared states.
 */

import { useEffect, useRef, useState, useMemo } from "react";
import type { OrgChartNode, OrgChartMember } from "@/types/organigram";
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

export function MemberDetailsModal({
  member,
  isOpen,
  onClose,
  responsibilityPaths = [],
  onViewResponsibility,
}: MemberDetailsModalProps) {
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

  const defaultImage = "/images/logo-flat.png";
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  // Synchronous state-during-render reset: clear failed-image cache when
  // switching members so a prior broken URL doesn't force the fallback for the
  // new member. This avoids useEffect (which would flash the stale fallback).
  const prevMemberIdRef = useRef(member?.id);
  if (prevMemberIdRef.current !== member?.id) {
    prevMemberIdRef.current = member?.id;
    if (failedImages.size > 0) setFailedImages(new Set());
  }

  const linkedResponsibilities = useMemo(() => {
    if (!member || !responsibilityPaths.length) return [];
    return findMemberResponsibilities(member.id, responsibilityPaths);
  }, [member, responsibilityPaths]);

  if (!isOpen || !member) return null;

  const isVacant = member.members.length === 0;
  const isShared = member.members.length >= 2;
  const primaryMember = member.members[0];

  const handleImageError = (url: string) => {
    setFailedImages((prev) => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  };

  const resolveImage = (url?: string) => {
    if (!url || failedImages.has(url)) return defaultImage;
    return url;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-kcvv-green to-kcvv-green-hover p-6 text-white rounded-t-xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Close"
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>

          <div className="flex items-center gap-6">
            {!isVacant && !isShared && (
              <Image
                src={resolveImage(primaryMember?.imageUrl)}
                alt={primaryMember?.name ?? member.title}
                width={96}
                height={96}
                className="w-24 h-24 rounded-full border-4 border-white/30 object-cover"
                onError={() => {
                  if (primaryMember?.imageUrl)
                    handleImageError(primaryMember.imageUrl);
                }}
              />
            )}
            <div>
              {isVacant ? (
                <>
                  <h2 className="text-2xl font-bold mb-1">{member.title}</h2>
                  <p className="text-white/70 text-lg font-semibold">
                    Vacante functie
                  </p>
                </>
              ) : isShared ? (
                <>
                  <h2 className="text-2xl font-bold mb-1">{member.title}</h2>
                  <p className="text-white/90 text-sm">
                    {member.members.length} personen
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-1">{member.title}</h2>
                  {primaryMember?.name &&
                    primaryMember.name !== member.title && (
                      <p className="text-white/90 text-lg">
                        {primaryMember.name}
                      </p>
                    )}
                </>
              )}
              {member.roleCode && (
                <span
                  className="inline-block mt-2 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-md text-sm font-semibold tracking-wide"
                  style={{ fontFamily: "var(--font-family-mono)" }}
                >
                  {member.roleCode}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Shared: per-member contact blocks */}
          {isShared && (
            <div>
              <h3 className="text-lg font-bold text-gray-blue mb-3">Leden</h3>
              <div className="space-y-4">
                {member.members.map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    resolveImage={resolveImage}
                    onImageError={handleImageError}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Single: contact info */}
          {!isVacant &&
            !isShared &&
            (primaryMember?.email || primaryMember?.phone) && (
              <div>
                <SectionHeading>Contactgegevens</SectionHeading>
                <div className="space-y-2">
                  {primaryMember?.email && (
                    <ContactRow
                      icon="email"
                      href={`mailto:${primaryMember.email}`}
                      label={primaryMember.email}
                    />
                  )}
                  {primaryMember?.phone && (
                    <ContactRow
                      icon="phone"
                      href={`tel:${primaryMember.phone}`}
                      label={primaryMember.phone}
                    />
                  )}
                </div>
              </div>
            )}

          {/* Description */}
          {member.description && (
            <div>
              <SectionHeading>Verantwoordelijkheden</SectionHeading>
              <p className="text-gray-dark leading-relaxed">
                {member.description}
              </p>
            </div>
          )}

          {/* Department Badge */}
          {!isVacant &&
            member.department &&
            member.department !== "algemeen" && (
              <div>
                <SectionHeading>Afdeling</SectionHeading>
                <span className="inline-block px-4 py-2 bg-kcvv-green/10 text-kcvv-green rounded-lg font-medium">
                  {member.department === "hoofdbestuur"
                    ? "Hoofdbestuur"
                    : "Jeugdbestuur"}
                </span>
              </div>
            )}

          {/* Linked Responsibility Paths */}
          {!isVacant && linkedResponsibilities.length > 0 && (
            <div>
              <SectionHeading>
                Hulpvragen ({linkedResponsibilities.length})
              </SectionHeading>
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

          {/* Link to full profile — single member */}
          {!isVacant && !isShared && primaryMember?.href && (
            <div className="pt-4 border-t border-gray-light">
              <Link
                href={primaryMember.href}
                className="inline-flex items-center gap-2 text-kcvv-green hover:text-kcvv-green-hover font-semibold transition-colors"
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
            className="px-6 py-2 bg-kcvv-green text-white font-semibold rounded-lg hover:bg-kcvv-green-hover transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-bold text-gray-blue mb-3">{children}</h3>;
}

function ContactRow({
  icon,
  href,
  label,
}: {
  icon: "email" | "phone";
  href: string;
  label: string;
}) {
  const svgPath =
    icon === "email"
      ? "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      : "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z";

  return (
    <div className="flex items-center gap-3">
      <svg
        className="w-5 h-5 text-kcvv-green flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={svgPath}
        />
      </svg>
      <a
        href={href}
        className="text-kcvv-green hover:text-kcvv-green-hover hover:underline transition-colors"
      >
        {label}
      </a>
    </div>
  );
}

function MemberCard({
  member,
  resolveImage,
  onImageError,
}: {
  member: OrgChartMember;
  resolveImage: (url?: string) => string;
  onImageError: (url: string) => void;
}) {
  return (
    <div className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 border border-gray-100">
      <Image
        src={resolveImage(member.imageUrl)}
        alt={member.name ?? "Lid foto"}
        width={56}
        height={56}
        className="w-14 h-14 rounded-full border-2 border-kcvv-green object-cover flex-shrink-0"
        onError={() => {
          if (member.imageUrl) onImageError(member.imageUrl);
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-kcvv-gray-blue text-base">
          {member.name ?? "Naamloos lid"}
        </p>
        <div className="mt-1 space-y-1">
          {member.email && (
            <ContactRow
              icon="email"
              href={`mailto:${member.email}`}
              label={member.email}
            />
          )}
          {member.phone && (
            <ContactRow
              icon="phone"
              href={`tel:${member.phone}`}
              label={member.phone}
            />
          )}
        </div>
        {member.href && (
          <Link
            href={member.href}
            className="inline-flex items-center gap-1 mt-2 text-sm text-kcvv-green hover:text-kcvv-green-hover font-semibold transition-colors"
          >
            <span>Bekijk volledig profiel</span>
            <svg
              className="w-3 h-3"
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
        )}
      </div>
    </div>
  );
}
