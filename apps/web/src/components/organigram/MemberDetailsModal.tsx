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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="from-kcvv-green to-kcvv-green-hover relative rounded-t-xl bg-gradient-to-r p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-colors hover:bg-white/30"
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
                className="h-24 w-24 rounded-full border-4 border-white/30 object-cover"
                onError={() => {
                  if (primaryMember?.imageUrl)
                    handleImageError(primaryMember.imageUrl);
                }}
              />
            )}
            <div>
              {isVacant ? (
                <>
                  <h2 className="mb-1 text-2xl font-bold">{member.title}</h2>
                  <p className="text-lg font-semibold text-white/70">
                    Vacante functie
                  </p>
                </>
              ) : isShared ? (
                <>
                  <h2 className="mb-1 text-2xl font-bold">{member.title}</h2>
                  <p className="text-sm text-white/90">
                    {member.members.length} personen
                  </p>
                </>
              ) : (
                <>
                  <h2 className="mb-1 text-2xl font-bold">{member.title}</h2>
                  {primaryMember?.name &&
                    primaryMember.name !== member.title && (
                      <p className="text-lg text-white/90">
                        {primaryMember.name}
                      </p>
                    )}
                </>
              )}
              {member.roleCode && (
                <span
                  className="mt-2 inline-block rounded-md bg-white/20 px-3 py-1 text-sm font-semibold tracking-wide backdrop-blur-sm"
                  style={{ fontFamily: "var(--font-family-mono)" }}
                >
                  {member.roleCode}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Shared: per-member contact blocks */}
          {isShared && (
            <div>
              <h3 className="text-gray-blue mb-3 text-lg font-bold">Leden</h3>
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
                <span className="bg-kcvv-green/10 text-kcvv-green inline-block rounded-lg px-4 py-2 font-medium">
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
              <p className="text-gray-dark mb-3 text-sm">
                Je kan deze persoon contacteren voor:
              </p>
              <div className="space-y-2">
                {linkedResponsibilities.map((path) => {
                  const categoryInfo = getCategoryInfo(path.category);
                  return (
                    <button
                      key={path.id}
                      onClick={() => onViewResponsibility?.(path.id)}
                      className={`w-full rounded-lg border-2 p-3 text-left transition-all hover:shadow-md ${categoryInfo.bgClass}`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`text-sm font-semibold ${categoryInfo.colorClass} shrink-0`}
                        >
                          {categoryInfo.label}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-gray-blue text-sm font-medium">
                            {path.question}
                          </p>
                          <p className="text-gray-dark mt-1 line-clamp-2 text-xs">
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
            <div className="border-gray-light border-t pt-4">
              <Link
                href={primaryMember.href}
                className="text-kcvv-green hover:text-kcvv-green-hover inline-flex items-center gap-2 font-semibold transition-colors"
              >
                <span>Bekijk volledig profiel</span>
                <svg
                  className="h-4 w-4"
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
        <div className="flex justify-end rounded-b-xl bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            className="bg-kcvv-green hover:bg-kcvv-green-hover rounded-lg px-6 py-2 font-semibold text-white transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-gray-blue mb-3 text-lg font-bold">{children}</h3>;
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
        className="text-kcvv-green h-5 w-5 flex-shrink-0"
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
        className="text-kcvv-green hover:text-kcvv-green-hover transition-colors hover:underline"
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
    <div className="flex items-start gap-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
      <Image
        src={resolveImage(member.imageUrl)}
        alt={member.name ?? "Lid foto"}
        width={56}
        height={56}
        className="border-kcvv-green h-14 w-14 flex-shrink-0 rounded-full border-2 object-cover"
        onError={() => {
          if (member.imageUrl) onImageError(member.imageUrl);
        }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-kcvv-gray-blue text-base font-bold">
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
            className="text-kcvv-green hover:text-kcvv-green-hover mt-2 inline-flex items-center gap-1 text-sm font-semibold transition-colors"
          >
            <span>Bekijk volledig profiel</span>
            <svg
              className="h-3 w-3"
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
