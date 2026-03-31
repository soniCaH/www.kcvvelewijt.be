"use client";

/**
 * ContactOverlay Component (Option C: Enhanced d3)
 *
 * Floating overlay with quick contact actions for org chart nodes.
 * Supports three states: single member, vacant, and shared (2+ members).
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "@/lib/icons";
import { ContactQuickActions } from "../shared/ContactQuickActions";
import type { OrgChartNode, OrgChartMember } from "@/types/organigram";

export interface ContactOverlayProps {
  member: OrgChartNode;
  position?: { x: number; y: number };
  isVisible: boolean;
  onClose: () => void;
  onViewDetails?: (member: OrgChartNode) => void;
  className?: string;
}

export function ContactOverlay({
  member,
  position = { x: 0, y: 0 },
  isVisible,
  onClose,
  onViewDetails,
  className = "",
}: ContactOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        overlayRef.current &&
        !overlayRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible, onClose]);

  useEffect(() => {
    if (!isVisible) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const isVacant = member.members.length === 0;
  const isShared = member.members.length >= 2;
  const primaryMember = member.members[0];
  const displayName = primaryMember?.name ?? member.title;
  const displayImageUrl = primaryMember?.imageUrl;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={overlayRef}
        className={`
          fixed z-50
          bg-white
          rounded-xl
          shadow-2xl
          border-2 border-gray-200
          animate-in fade-in slide-in-from-bottom-2
          duration-200
          ${className}
        `}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          maxWidth: "320px",
          width: "calc(100vw - 32px)",
        }}
        role="dialog"
        aria-label={`Contactinformatie voor ${member.title}`}
      >
        {/* Header — position title always shown */}
        <div className="flex items-start gap-3 p-4 border-b border-gray-100">
          {!isVacant && !isShared && (
            <div className="flex-shrink-0">
              <Image
                src={
                  imageError
                    ? "/images/logo-flat.png"
                    : displayImageUrl || "/images/logo-flat.png"
                }
                alt={displayName}
                width={64}
                height={64}
                className="rounded-full object-cover border-2 border-kcvv-green"
                onError={() => setImageError(true)}
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            {isVacant ? (
              <>
                <h3 className="font-bold text-kcvv-gray-blue text-base leading-tight mb-1 font-heading">
                  {member.title}
                </h3>
                <p className="text-sm text-gray-400 font-semibold">
                  Vacante functie
                </p>
              </>
            ) : isShared ? (
              <h3 className="font-bold text-kcvv-gray-blue text-base leading-tight mb-1 font-heading">
                {member.title}
              </h3>
            ) : (
              <>
                <h3 className="font-bold text-kcvv-gray-blue text-base leading-tight mb-1 font-heading">
                  {displayName}
                </h3>
                <p className="text-sm text-kcvv-gray leading-snug">
                  {member.title}
                </p>
              </>
            )}
            {member.roleCode && (
              <span className="inline-block mt-2 px-2 py-0.5 bg-kcvv-green/10 text-kcvv-green rounded text-xs font-semibold font-mono leading-tight">
                {member.roleCode}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-kcvv-gray-dark hover:text-kcvv-gray-blue hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-kcvv-green focus:ring-offset-2"
            aria-label="Sluiten"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {isVacant ? (
            /* Vacant — description only */
            member.description && (
              <p className="text-sm text-gray-500 leading-relaxed">
                {member.description}
              </p>
            )
          ) : isShared ? (
            /* Shared — per-member contact blocks */
            <div className="space-y-3">
              {member.members.map((m) => (
                <MemberContactBlock key={m.id} member={m} />
              ))}
            </div>
          ) : (
            /* Single — quick actions */
            <ContactQuickActions
              email={primaryMember?.email}
              phone={primaryMember?.phone}
              name={displayName}
              size="lg"
            />
          )}
        </div>

        {/* View Details Button */}
        {onViewDetails && (
          <div className="p-4 pt-0">
            <button
              onClick={() => {
                onViewDetails(member);
                onClose();
              }}
              className="w-full px-4 py-2.5 bg-kcvv-green hover:bg-kcvv-green-hover text-white rounded-lg font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-kcvv-green focus:ring-offset-2"
            >
              Volledige details
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function MemberContactBlock({ member }: { member: OrgChartMember }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-kcvv-gray-blue truncate">
          {member.name}
        </p>
        <ContactQuickActions
          email={member.email}
          phone={member.phone}
          name={member.name ?? ""}
          size="sm"
          className="mt-1"
        />
      </div>
      {member.href && (
        <Link
          href={member.href}
          className="text-xs text-kcvv-green hover:text-kcvv-green-hover font-medium whitespace-nowrap"
        >
          Profiel bekijken
        </Link>
      )}
    </div>
  );
}
