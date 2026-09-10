import type { ComponentType } from "react";
import Image from "next/image";
import { TapedFigure } from "@/components/design-system/TapedFigure";
import { MonoLabel } from "@/components/design-system/MonoLabel";
import {
  JerseyIllustration,
  playerFigureSeed,
} from "@/components/design-system/JerseyIllustration";
import { Envelope, Phone, type RedesignIconProps } from "@/lib/icons.redesign";

/**
 * `<StaffHero>` — person-profile hero for `/staf/[slug]`, built on the SAME
 * bare two-column grid as `<PlayerHero>` so the two detail pages read as
 * siblings. The figure is mirrored to the LEFT column (player keeps it right);
 * everything else — container, name rhythm, mono kicker, single jersey
 * `<TapeStrip>` at angle `b`, `padding="none"` newsprint photo — matches.
 *
 * Staff carries different data, so the text column swaps the player's jersey
 * number + ticket-stub for role pills + a contact row:
 *   - Portrait → `<TapedFigure aspect="portrait-3-4" padding="none">`. No photo
 *     → `<JerseyIllustration variant="hero" garment="coat">` in the same
 *     framed slot — the same coat-garment figure `<PlayerCard garment="coat">`
 *     already renders for this person on the `getCardSubjectArtefact` path
 *     (`<TeamStaff>` on `/ploegen/[slug]` and the three board routes, #2485
 *     rule 5). The organigram's `<OrgPersonCard>`/`<MemberDetailPanel>` avatar
 *     is a deliberate exception — it stays a monogram disc, untouched by this
 *     ticket.
 *   - Kicker → `<MonoLabel variant="plain">` (ink), as on the player hero.
 *   - Name → first upright `font-display-big` black (`display-2xl`), last
 *     italic `font-display` (`display-xl`) + period.
 *   - Roles → `<MonoLabel>` pills (first `pill-jersey-deep`, rest
 *     `pill-cream`). Auto-hides when empty.
 *   - Contact → mono row of mailto / tel links with plain Phosphor-Fill icons.
 *     Auto-hides when neither is present.
 */

export interface StaffHeroProps {
  /**
   * Stable identity — the Sanity `_id`. Seeds the illustration fallback via
   * `playerFigureSeed` (#2485/#2635): never the display name, so this staff
   * member draws the identical figure `<PlayerCard garment="coat">` drew for
   * them on every card that links here.
   */
  id: string;
  firstName: string;
  lastName: string;
  /** Portrait photo URL (newsprint-treated). Missing → the coat-garment `<JerseyIllustration>` fallback. */
  imageUrl?: string;
  /**
   * Role pill labels (the staff member's organigram-position titles). The
   * first renders as a jersey-deep pill, the rest as cream pills.
   */
  roles?: string[];
  email?: string;
  phone?: string;
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
  id,
  firstName,
  lastName,
  imageUrl,
  roles = [],
  email,
  phone,
}: StaffHeroProps) {
  const photoUrl = imageUrl?.trim() ?? "";
  const hasPhoto = photoUrl !== "";
  const showContact = Boolean(email || phone);

  return (
    <section
      data-testid="staff-hero"
      data-state={hasPhoto ? "photo" : "illustration"}
      className="grid grid-cols-1 items-start gap-x-10 gap-y-8 sm:grid-cols-[minmax(220px,320px)_1fr]"
    >
      {/* Figure — LEFT column (player mirrors this on the right). Same
          `padding="none"` newsprint treatment + single jersey tape at angle b. */}
      <div className="w-full max-w-[320px] justify-self-start">
        <TapedFigure
          aspect="portrait-3-4"
          rotation="b"
          tape={{ color: "jersey-deep", length: "md" }}
          bg="cream-soft"
          tint={hasPhoto ? "newsprint" : "none"}
          padding="none"
        >
          {hasPhoto ? (
            <Image
              src={photoUrl}
              alt=""
              width={400}
              height={533}
              unoptimized
              // Multiply drops a studio cutout's white matte onto the cream
              // ground, the same treatment <PlayerCard> gives the squad grid
              // (#2633, extended to every person surface in #2901).
              //
              // The ground is painted here rather than reached through to
              // <TapedFigure bg> two levels up: PlayerCard removed that same
              // silent dependency on purpose, and the blend would break
              // quietly the day `TapedFigureBg` gains a non-cream value
              // (#2901 review).
              className="bg-cream-soft block h-full w-full object-cover mix-blend-multiply"
            />
          ) : (
            <JerseyIllustration
              variant="hero"
              garment="coat"
              seed={playerFigureSeed({ id })}
              data-testid="staff-hero-illustration"
            />
          )}
        </TapedFigure>
      </div>

      {/* Text column. */}
      <div className="flex flex-col gap-5">
        <span className="uppercase">
          <MonoLabel variant="plain">Staf</MonoLabel>
        </span>

        <h1 className="text-ink m-0 flex flex-col leading-[0.9]">
          <span className="font-display-big text-display-2xl block font-black">
            {firstName}
          </span>
          <span className="font-display text-display-xl block font-normal italic">
            {lastName}.
          </span>
        </h1>

        {roles.length > 0 ? (
          <div className="flex flex-wrap gap-2">
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
          <div className="text-mono-sm flex flex-wrap gap-x-5 gap-y-2 font-mono">
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
    </section>
  );
}
