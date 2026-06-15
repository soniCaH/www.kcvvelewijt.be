"use client";

import type { ComponentType } from "react";
import Image from "next/image";
import { TapedCard } from "@/components/design-system/TapedCard";
import { TapedFigure } from "@/components/design-system/TapedFigure";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import { Envelope, Phone, type RedesignIconProps } from "@/lib/icons.redesign";

/**
 * `<StaffHero>` — the locked person-profile hero (10f2 "hero B") for the
 * `/staf/[slug]` detail page. Shares the `<PageHero>` shell vocabulary
 * (a `<TapedCard bg="cream">` with one warm top-left `<TapeStrip>`), but
 * leads with a portrait `<TapedFigure>` + a two-line name rhythm rather
 * than a landscape image.
 *
 * Composition (retro-terrace-fanzine primitives only):
 *   - Portrait → `<TapedFigure aspect="portrait-3-4">` newsprint (colour)
 *     photo. No photo → a jersey-deep monogram (initials) inside the same
 *     framed slot (NOT the player-only jersey illustration).
 *   - Kicker → jersey-deep raw mono label-token span (the `<PageHero>`
 *     kicker idiom — `MonoLabel` plain only renders ink/cream tone).
 *   - Name → two `<h1>` lines: first upright `font-display-big` black, last
 *     italic `font-display` with a warm "." terminator.
 *   - Roles → `<MonoLabel>` pills (first `pill-jersey-deep`, rest
 *     `pill-cream`). Auto-hides when empty.
 *   - Contact → mono row of mailto / tel links with plain Phosphor-Fill
 *     icons (jersey-deep). Auto-hides when neither is present.
 *
 * Design lock: `docs/design/mockups/phase-10-staf/10f2-staf-assembled.html` (#2124).
 */

export interface StaffHeroProps {
  firstName: string;
  lastName: string;
  /** Portrait photo URL (newsprint-treated). Missing → jersey-deep monogram. */
  imageUrl?: string;
  /**
   * Role pill labels (the staff member's organigram-position titles). The
   * first renders as a jersey-deep pill, the rest as cream pills.
   */
  roles?: string[];
  email?: string;
  phone?: string;
}

function monogram(firstName: string, lastName: string): string {
  const f = firstName.trim().charAt(0);
  const l = lastName.trim().charAt(0);
  return `${f}${l}`.toLocaleUpperCase("nl-BE") || "·";
}

function ContactLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: ComponentType<RedesignIconProps>;
  label: string;
}) {
  return (
    <a
      href={href}
      className="text-jersey-deep hover:text-jersey-deep-dark inline-flex items-center gap-1.5 font-semibold transition-colors"
    >
      <Icon size={16} className="shrink-0" aria-hidden="true" />
      {label}
    </a>
  );
}

export function StaffHero({
  firstName,
  lastName,
  imageUrl,
  roles = [],
  email,
  phone,
}: StaffHeroProps) {
  const photoUrl = imageUrl?.trim() ?? "";
  const hasPhoto = photoUrl !== "";
  const fullName = `${firstName} ${lastName}`.trim();
  const showContact = Boolean(email || phone);

  return (
    <TapedCard
      as="section"
      bg="cream"
      padding="lg"
      tape={{ color: "warm", position: "left", length: "lg" }}
      dataAttrs={{
        "data-testid": "staff-hero",
        "data-state": hasPhoto ? "photo" : "monogram",
      }}
    >
      <div className="grid items-center gap-6 md:grid-cols-[0.7fr_1.3fr]">
        {/* Portrait or monogram — always a framed portrait-3-4 slot. */}
        <TapedFigure
          aspect="portrait-3-4"
          tint={hasPhoto ? "newsprint" : "none"}
          tape={{ color: "warm", position: "right", length: "md" }}
        >
          {hasPhoto ? (
            <Image
              src={photoUrl}
              alt={fullName}
              fill
              priority
              unoptimized
              sizes="(min-width: 768px) 30vw, 60vw"
              className="object-cover object-top"
            />
          ) : (
            <span
              data-testid="staff-hero-monogram"
              aria-hidden="true"
              className="bg-jersey-deep text-cream font-display-big absolute inset-0 flex items-center justify-center text-6xl font-black"
            >
              {monogram(firstName, lastName)}
            </span>
          )}
        </TapedFigure>

        {/* Name + roles + contact. */}
        <div>
          <span className="text-jersey-deep font-mono text-[length:var(--text-label)] font-semibold tracking-[0.18em] uppercase">
            Staf
          </span>

          {/* `mb-0` neutralises the global base `h1 { margin-bottom: 1em }`
              so the role pills sit tight under the name. */}
          <h1 className="mt-1 mb-0 tracking-tight">
            <span className="font-display-big text-ink block text-[length:var(--text-display-lg)] leading-[0.9] font-black">
              {firstName}
            </span>
            <span className="font-display text-ink block text-[length:var(--text-display-lg)] leading-[0.95] font-normal italic">
              {lastName}
              <span className="text-warm">.</span>
            </span>
          </h1>

          {roles.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {roles.map((role, i) => (
                <span key={`${role}-${i}`} data-testid="staff-hero-role">
                  <MonoLabel
                    variant={i === 0 ? "pill-jersey-deep" : "pill-cream"}
                  >
                    {role}
                  </MonoLabel>
                </span>
              ))}
            </div>
          ) : null}

          {showContact ? (
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[length:var(--text-mono-sm)]">
              {email ? (
                <ContactLink
                  href={`mailto:${email}`}
                  icon={Envelope}
                  label={email}
                />
              ) : null}
              {phone ? (
                <ContactLink href={`tel:${phone}`} icon={Phone} label={phone} />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </TapedCard>
  );
}
