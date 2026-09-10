"use client";

import { useEffect } from "react";
import {
  PageContainer,
  SectionNavChip,
  SECTION_NAV_BAR_CLASSES,
} from "@/components/design-system";
import { ScrollRail } from "@/components/design-system/ScrollHint/ScrollRail";
import { useSectionNav } from "@/hooks/useSectionNav";

export interface TeamSectionNavItem {
  /** Anchor target id (matches the section's `id`). */
  id: string;
  /** Display label. */
  label: string;
}

export interface TeamSectionNavProps {
  /** Only the sections that actually render — auto-hide aware. */
  items: readonly TeamSectionNavItem[];
}

/**
 * Sticky in-page section navigation for the team detail page (#2478
 * resolution). Each item is `<SectionNavChip>` — the light chip, the same
 * one `<OrganigramSectionNav>` uses, so the recipe is typed once rather
 * than hand-copied per route. Active is scroll-spy driven via the shared
 * `useSectionNav` hook (rule 3): the fill always means "the section being
 * read", never "the one last clicked". The bar pins at `--sticky-header-h`
 * and the same hook derives `scroll-padding-top` from its own measured
 * height — no `scroll-mt-*` on any section target. Renders nothing when one
 * or fewer sections exist.
 *
 * The `≤1 section` check lives in this outer component, one level above
 * `useSectionNav` — `<TeamSectionNavBar>` only ever mounts when the bar
 * itself does, so the hook's own mount/unmount tracks the bar's exactly
 * (a team with a nav today can navigate, client-side, to one with ≤1
 * section and back; hoisting the check here means that is an ordinary
 * unmount + remount, not a live component whose bar quietly disappears out
 * from under it).
 *
 * **Not permanently inert (#2444, corrected by #2478 and #2489).** #2444
 * originally reasoned this row "ships three items forever" and gave it a
 * control arrow in a rail reserved at every width ≥768px. #2478 measured the
 * five-item row (`Klassement · Wedstrijden · Spelers · Staf · Info`) and
 * found it overflowed only below ~430px viewport width — never at a width
 * the old rail reserved — with the three-item row (`Wedstrijden · Spelers ·
 * Staf`) the far more common case: two of the five auto-hiding sections
 * (`Klassement`, `Info`) were absent on every team page at the time, because
 * no team had published klassement or editorial data yet, not because they
 * don't exist. #2489's final rule replaces the fixed rail with one that
 * follows real overflow at every width — the same `<ScrollRail>` "row of
 * discrete things" idiom `<FilterTabs>` uses (nav items a visitor taps): a
 * 40px gutter on both sides exactly when the track overflows, the spent
 * direction disabled in place rather than unmounted.
 *
 * **Re-measured (#2637).** `Info` is renamed `Trainingen & contact` and, per
 * that ticket, no longer auto-hides — every team page now carries the full
 * five-item row (`Klassement`'s own presence still varies with the
 * competitive-block state). At the exact chip markup/classes this component
 * renders, the five-item row now overflows below ~570px viewport width (up
 * from ~430px measured for the shorter `Info` label) — an ordinary phone in
 * portrait, not an edge case. The arrow mounts routinely now, rather than
 * "essentially never" as this docblock previously (and, as of #2637,
 * incorrectly) claimed.
 *
 * **Browser-measured, not computed (#2640).** The ~570px figure above was
 * still a class-reading prediction. A real render of this exact component
 * (`Klassement · Wedstrijden · Spelers · Staf · Trainingen & contact`, the
 * longest of the two possible first labels) puts the unpadded row at 541px
 * and the row overflows below **563px** viewport width — a phone in
 * portrait, same conclusion, corrected number. Trimming to fit was
 * considered and rejected in #2544: tightening `px-3`→`px-2` and dropping
 * `gap-2` was estimated to land at ~358px against an (also since corrected)
 * predicted content width; the real content width is 541px, so trimming was
 * never going to close a gap that size — scrolling, not squeezing, is the
 * only fit.
 *
 * **The active chip is kept in view by scrolling the rail's own track
 * directly — never `Element.scrollIntoView` (#2640 review).** `scrollIntoView`
 * walks every scrollable ancestor, the document included, and this chip
 * lives inside the sticky bar: its top edge always sits inside the band
 * `useSectionNav` excludes from `scroll-padding-top`
 * (`calc(var(--sticky-header-h) + <bar height>px)`, `useSectionNav.ts:81`),
 * so a `block: "nearest"` call always judged the chip "not visible" and
 * issued a root-scroller scroll on every `activeId` change — even when the
 * row didn't overflow at all. In practice that meant an in-flight native
 * anchor jump (`html[data-scroll-behavior="smooth"]`, `globals.css:1370`)
 * got its target silently replaced mid-flight every time scroll-spy ticked
 * past an intermediate section, truncating the jump before it ever reached
 * its real target. The fix scrolls the track's own `scrollLeft` (`ul.
 * overflow-x-auto`, the element `<ScrollRail>` renders), computed against
 * the track's own rendered padding — the same 40px gutter `<ScrollRail>`
 * reserves for the arrow/fade once the row overflows — so the revealed chip
 * clears the arrow rather than landing half under it, and the document's
 * own scroll position is never touched.
 */
export function TeamSectionNav({ items }: TeamSectionNavProps) {
  if (items.length <= 1) return null;
  return <TeamSectionNavBar items={items} />;
}

function TeamSectionNavBar({
  items,
}: {
  items: readonly TeamSectionNavItem[];
}) {
  const ids = items.map((item) => item.id);
  const { navRef, activeId } = useSectionNav(ids);

  // Keeps the active chip reachable when the overflow hides it — scroll-spy
  // can activate a chip currently past the fade/arrow, and the visitor never
  // touched the rail themselves to bring it into view (#2640). Moves the
  // RAIL'S OWN TRACK directly (`track.scrollTo`) rather than delegating to
  // `chip.scrollIntoView` — see the docblock above for why that walks the
  // document too and truncates an in-flight anchor jump. Reads the track's
  // own rendered padding rather than a hard-coded 40px so this tracks
  // `<ScrollRail>`'s real gutter (present only once the row overflows)
  // instead of duplicating it.
  useEffect(() => {
    if (!activeId) return;
    // `<ScrollRail as="ul">` renders the track as the one `<ul>` inside
    // this `<nav>` — the same element the existing `getByRole("list")`
    // arrow tests below already treat as the track's stable handle.
    // `<ScrollRail>` doesn't forward a ref or a `data-*` prop to it, so a
    // scoped tag query is the only way to reach it without widening that
    // shared component's own API.
    const track = navRef.current?.querySelector<HTMLElement>("ul");
    const chip = track?.querySelector<HTMLElement>(`a[href="#${activeId}"]`);
    if (!track || !chip) return;

    const trackRect = track.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const trackStyle = window.getComputedStyle(track);
    const gutterLeft = parseFloat(trackStyle.paddingLeft || "0");
    const gutterRight = parseFloat(trackStyle.paddingRight || "0");
    const visibleLeft = trackRect.left + gutterLeft;
    const visibleRight = trackRect.right - gutterRight;

    let delta = 0;
    if (chipRect.left < visibleLeft) {
      delta = chipRect.left - visibleLeft;
    } else if (chipRect.right > visibleRight) {
      delta = chipRect.right - visibleRight;
    }
    if (delta !== 0) {
      track.scrollTo({ left: track.scrollLeft + delta, behavior: "smooth" });
    }
  }, [activeId, navRef]);

  return (
    <nav
      ref={navRef}
      data-testid="team-section-nav"
      aria-label="Sectienavigatie"
      // TEAM-1: bottom border only — the StripedSeam above already divides
      // the nav from the hero, so a top border doubled the line.
      className={SECTION_NAV_BAR_CLASSES}
    >
      <PageContainer>
        <ScrollRail
          as="ul"
          ariaLabel="Sectienavigatie"
          // `scroll-smooth` matches the sibling `<ScrollRail>` consumer
          // `FilterTabs` (`FilterTabs.tsx:293`) — the arrow's own click
          // handler already passes `behavior: "smooth"` explicitly
          // (`useScrollHint.ts`), and so does this effect's own
          // `track.scrollTo` below; the class is belt-and-suspenders for
          // any future direct `scrollLeft` write, same as the peer.
          trackClassName="flex items-center gap-2 py-2 scroll-smooth"
          // The bar is bg-cream-deep — the fade must match that ground, not
          // <ScrollRail>'s cream default, or the overflow fade reads as a
          // mismatched patch.
          fadeFromClassName="from-cream-deep"
        >
          {items.map((item) => (
            <SectionNavChip
              key={item.id}
              id={item.id}
              label={item.label}
              isActive={item.id === activeId}
            />
          ))}
        </ScrollRail>
      </PageContainer>
    </nav>
  );
}
