import { EditorialHeading } from "@/components/design-system/EditorialHeading";
import { LeaderDotRow } from "@/components/design-system/LeaderDotRow";
import type { ContentsGroup } from "@/lib/utils/site-contents";

export interface SiteContentsProps {
  /** The assembled contents view model — see `buildSiteContents`. */
  groups: ContentsGroup[];
}

/** The one group that takes the manila chapter break — see the component doc. */
const CHAPTER_GROUP_ID: ContentsGroup["id"] = "nieuws";

/**
 * The printed contents page (`/inhoud`, decision D8), rendered from the view
 * model `buildSiteContents` assembles. Server component: nothing here is
 * interactive beyond the links themselves.
 *
 * **Group heading, not `<SectionHeader>`.** These are the four divisions of one
 * contents page, not four page sections — the device is a display-serif title
 * with its count ranged right over a 2px rule, which is what the mockup
 * (`docs/design/mockups/research-d-series/d8-index-page.html`) prints and what
 * `<SectionHeader>` (kicker + heading + optional CTA, `mb-8 sm:mb-10`) does not
 * express. `<SectionHeader>` still owns section-heading air everywhere it *is*
 * the right composition (#2552).
 *
 * **The columns wrap the entries, not the groups.** The mockup flowed all four
 * groups through one 3-column block, which works on the 8-row samples it drew
 * and does not work on the 125 articles production holds — one group that long
 * either splits away from its own heading or leaves the other two columns
 * empty. So each group keeps a full-width heading and flows its own rows
 * 1 → 2 → 3 columns.
 *
 * With no groups the component renders nothing at all: `/inhoud` is derived
 * from the content platform, so an empty site is an empty page rather than a
 * page of authored placeholders.
 *
 * **One chapter break (#2614).** `/inhoud` is the long index page the manila
 * tint (`bg-manila`, DESIGN.md → Colors → Neutral) exists for — index pages
 * only, once per page. `nieuws` is the largest group and second in print
 * order, so it is the one section given the warmer stock.
 *
 * **A true full-bleed band, not an inset rectangle.** `<SiteContents>` renders
 * inside the one `<PageContainer>` `/inhoud` wraps its whole body in (hero
 * included), not as a top-level `SectionStack` entry the way the homepage's
 * `bg-cream-soft` band is — so hoisting the chapter group out to be a sibling
 * of `<PageContainer>` would mean splitting this component's single
 * `groups.map` into three render passes around one page. Instead the chapter
 * section escapes `<PageContainer>`'s max-width the way `<ArticleBody>`'s
 * `bleed` image width already does — `mx-[calc(50%-50vw)] w-screen
 * max-w-[100vw]`, "the canonical Phase 5 full-bleed escape" — so the tint
 * spans the viewport instead of clipping to the content column. An inner
 * wrapper reapplies `<PageContainer>`'s own `index` max-width and `px-4
 * md:px-8` gutters, so the heading and rows still line up with the groups
 * above and below; `py-12 sm:py-16` on that same wrapper keeps text off the
 * colour boundary top and bottom, matching the padding value `bg-cream-soft`
 * bands use everywhere else (#2571).
 */
export function SiteContents({ groups }: SiteContentsProps) {
  if (groups.length === 0) return null;

  return (
    // Gap on the parent rather than a bottom margin per section: a
    // `last:mb-0` would lose to `sm:mb-16` in the cascade and leave the last
    // group carrying air the page container already supplies.
    <div className="flex flex-col gap-12 sm:gap-16">
      {groups.map((group) => {
        const body = (
          <>
            <div className="border-ink flex items-baseline justify-between gap-4 border-b-2 pb-2">
              <EditorialHeading level={2} size="display-sm">
                {group.title}
              </EditorialHeading>
              <span className="text-ink-muted text-label shrink-0 font-mono">
                {group.entries.length}
              </span>
            </div>

            <ul className="mt-4 columns-1 gap-x-10 sm:columns-2 lg:columns-3">
              {group.entries.map((entry, index) => (
                <li
                  key={entry.id}
                  // Inert markers read by `<SiteContentsAnalytics>`'s one
                  // delegated listener — the rows themselves stay
                  // server-rendered.
                  data-contents-group={group.id}
                  data-contents-position={index + 1}
                  className="break-inside-avoid"
                >
                  <LeaderDotRow
                    href={entry.href}
                    label={entry.label}
                    value={entry.value}
                    className="text-body-sm"
                  />
                </li>
              ))}
            </ul>
          </>
        );

        if (group.id !== CHAPTER_GROUP_ID) {
          return <section key={group.id}>{body}</section>;
        }

        return (
          <section
            key={group.id}
            className="bg-manila mx-[calc(50%-50vw)] w-screen max-w-[100vw]"
          >
            <div className="mx-auto max-w-[var(--container-index)] px-4 py-12 sm:py-16 md:px-8">
              {body}
            </div>
          </section>
        );
      })}
    </div>
  );
}
