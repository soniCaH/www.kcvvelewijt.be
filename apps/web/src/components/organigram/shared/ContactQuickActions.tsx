"use client";

/**
 * ContactQuickActions Component
 *
 * Inline email/phone contact actions with icons.
 * Provides quick access to contact methods without opening the full modal.
 *
 * Features:
 * - Email (mailto link with icon)
 * - Phone (tel link with icon)
 * - WhatsApp (if phone number exists)
 * - Copy to clipboard on long-press
 * - Accessible tooltips
 */

import { Mail, Phone, MessageCircle } from "@/lib/icons";
import { useState } from "react";
import type { ContactQuickActionsProps } from "./types";

/**
 * Render inline contact action buttons for email, phone, and WhatsApp.
 *
 * Renders one or more circular action buttons (email, phone, WhatsApp) with accessible labels,
 * tooltips, and context-menu copy-to-clipboard behavior; returns nothing when neither email nor phone is provided.
 *
 * @param email - Optional email address shown in the email action and tooltip; right-click copies it to clipboard
 * @param phone - Optional phone number shown in the phone action and tooltip; right-click copies it to clipboard
 * @param name - Display name used in ARIA labels for each action (e.g., "Email {name}", "Bel {name}")
 * @param size - Visual size variant for buttons and icons; one of `"sm" | "md" | "lg"` (default: `"md"`)
 * @param className - Additional CSS classes applied to the actions container
 * @returns The action buttons JSX (or `null` if neither `email` nor `phone` is provided)
 */
export function ContactQuickActions({
  email,
  phone,
  name,
  size = "md",
  className = "",
}: ContactQuickActionsProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // If no contact info, render nothing
  if (!email && !phone) {
    return null;
  }

  // Size variants
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
  };

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  // Copy to clipboard handler
  const handleCopy = async (text: string, type: "email" | "phone") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "email") {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      } else {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Format WhatsApp link (remove spaces and dashes)
  const whatsappPhone = phone?.replace(/[\s-]/g, "");

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Email Button */}
      {email && (
        <div className="group relative">
          <a
            href={`mailto:${email}`}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
              e.preventDefault();
              handleCopy(email, "email");
            }}
            className={` ${sizeClasses[size]} bg-kcvv-green/10 text-kcvv-green hover:bg-kcvv-green focus:ring-kcvv-green flex items-center justify-center rounded-full transition-all duration-200 hover:text-white focus:ring-2 focus:ring-offset-2 focus:outline-none`}
            aria-label={`Email ${name}`}
            title={copiedEmail ? "Gekopieerd!" : email}
          >
            <Mail size={iconSize[size]} />
          </a>

          {/* Tooltip */}
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
            {copiedEmail ? "Gekopieerd!" : email}
          </div>
        </div>
      )}

      {/* Phone Button */}
      {phone && (
        <div className="group relative">
          <a
            href={`tel:${phone}`}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => {
              e.preventDefault();
              handleCopy(phone, "phone");
            }}
            className={` ${sizeClasses[size]} bg-kcvv-green/10 text-kcvv-green hover:bg-kcvv-green focus:ring-kcvv-green flex items-center justify-center rounded-full transition-all duration-200 hover:text-white focus:ring-2 focus:ring-offset-2 focus:outline-none`}
            aria-label={`Bel ${name}`}
            title={copiedPhone ? "Gekopieerd!" : phone}
          >
            <Phone size={iconSize[size]} />
          </a>

          {/* Tooltip */}
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
            {copiedPhone ? "Gekopieerd!" : phone}
          </div>
        </div>
      )}

      {/* WhatsApp Button */}
      {phone && whatsappPhone && (
        <div className="group relative">
          <a
            href={`https://wa.me/${whatsappPhone.startsWith("+") ? whatsappPhone.slice(1) : whatsappPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={` ${sizeClasses[size]} flex items-center justify-center rounded-full bg-[#25D366]/10 text-[#25D366] transition-all duration-200 hover:bg-[#25D366] hover:text-white focus:ring-2 focus:ring-[#25D366] focus:ring-offset-2 focus:outline-none`}
            aria-label={`WhatsApp ${name}`}
            title="WhatsApp"
          >
            <MessageCircle size={iconSize[size]} />
          </a>

          {/* Tooltip */}
          <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
            WhatsApp
          </div>
        </div>
      )}
    </div>
  );
}
