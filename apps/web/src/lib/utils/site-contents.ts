import { toDisplayZone } from "./dates";

/**
 * The contents page's view model (#2622, decision D8 in
 * `docs/research/decision-sheet.md`).
 *
 * One assembler, not four. `/inhoud` is a printed contents page for the whole
 * site, and the single invariant worth protecting in code is that **nothing on
 * it is authored**: every row is derived from a repository read, so a group
 * with no documents behind it is simply not on the page. `llms.txt` shipped
 * `/club/organigram` for months after the route was deleted because it was
 * hand-written; this is the same page built the other way round.
 *
 * Players are deliberately absent and are not an oversight: an index of ~300
 * youth players was rejected on privacy grounds (A7), and of 294 player
 * documents **zero carry a slug** — there would be nothing to link to.
 */

/** The four groups, in the order the page prints them. */
export type ContentsGroupId =
  "ploegen" | "nieuws" | "evenementen" | "clubpaginas";

export interface ContentsEntry {
  /** Source document id — the React key, never rendered. */
  id: string;
  /** What the thing is called. */
  label: string;
  /**
   * The value the design pairs this group with — a Ploeg its Reeks, an Artikel
   * its date. `null` when the source has none, so the row can show the value as
   * *absent* rather than dropping the pair.
   */
  value: string | null;
  /** Site-relative route the row links to. */
  href: string;
}

export interface ContentsGroup {
  id: ContentsGroupId;
  /** Section heading, in the site's own Dutch vocabulary. */
  title: string;
  entries: ContentsEntry[];
}

/**
 * Structural input shapes rather than the repositories' view models, so
 * `TeamNavVM` / `ArticleVM` / `EventVM` and the page list all satisfy them
 * without adapters — the same reason `teamDisplayName` takes a `TeamNameSource`.
 */

export interface ContentsTeamSource {
  id: string;
  slug: string;
  /** Already resolved by the repository via `teamDisplayName` (#2630). */
  displayName: string;
  /** The club's short competition code. */
  division: string | null;
  /** The club's full competition name — null on every youth team. */
  divisionFull: string | null;
}

export interface ContentsArticleSource {
  id: string;
  slug: string;
  title: string;
  publishedAt: string | null;
}

export interface ContentsEventSource {
  id: string;
  slug: string;
  title: string;
  dateStart: string | null;
}

export interface ContentsPageSource {
  id: string;
  slug: string;
  title: string;
  updatedAt: string | null;
}

export interface SiteContentsInput {
  teams: readonly ContentsTeamSource[];
  articles: readonly ContentsArticleSource[];
  events: readonly ContentsEventSource[];
  pages: readonly ContentsPageSource[];
}

/**
 * `dd·MM·jj` — the contents-page date. Mono and fixed-width so a column of
 * them lines up; the interpunct is the fanzine separator the D-series mockups
 * use rather than a slash. Parsed through `toDisplayZone`, which is the site's
 * one Sanity-instant parse, so the rendered day never depends on where the code
 * runs. An unparseable or missing date is `null`, i.e. visibly absent.
 */
const contentsDate = (value: string | null): string | null => {
  if (!value) return null;
  const dt = toDisplayZone(value);
  return dt.isValid ? dt.toFormat("dd·MM·yy") : null;
};

/**
 * A blank editorial string is an absent value, not a value that happens to be
 * empty — so `value: string | null` means what it says all the way through and
 * not only once the row has rendered it.
 */
const present = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
};

/**
 * The one group whose repository order is not its printed order.
 *
 * `TeamRepository.findAll` sorts on the PSD-registered `name`, but what the
 * page prints is the display name (#2630) — and the two disagree, so the column
 * came out `A-ploeg · U11 · U13 · KCVVE U6 Groen & Wit · U10`. An index sorted
 * by a key it does not show is an index a reader cannot scan. The other three
 * groups already arrive in the order they should print (articles newest first,
 * events by start date, pages by title).
 */
const byDisplayName = (
  a: ContentsTeamSource,
  b: ContentsTeamSource,
): number => {
  return a.displayName.localeCompare(b.displayName, "nl", { numeric: true });
};

/**
 * A row with no slug has no destination, so it is not a contents entry.
 *
 * The listing projections `coalesce(slug.current, "")`, and neither filters on
 * `defined(slug.current)` — so a slug-less document would have produced a row
 * linking to `/evenementen/`, which is a live 200 page: the reader clicks a
 * named event and lands on the events index with nothing to tell them why.
 * Production holds 77 events in exactly that state. This is the same rule that
 * cut the players section — 0 of 294 carry a slug, so there was nothing to
 * link to — applied to every group rather than argued once.
 */
const linkable = <T extends { slug: string }>(row: T): boolean => {
  return row.slug.trim() !== "";
};

/**
 * Assemble the whole contents page from four repository reads.
 *
 * Given empty inputs the result is `[]` — there is no floor of hardcoded rows
 * and no authored entry anywhere in this function, and a group with nothing
 * behind it does not appear.
 */
export const buildSiteContents = ({
  teams,
  articles,
  events,
  pages,
}: SiteContentsInput): ContentsGroup[] => {
  const groups: ContentsGroup[] = [
    {
      id: "ploegen",
      title: "Ploegen",
      entries: [...teams]
        .filter(linkable)
        .sort(byDisplayName)
        .map((team) => ({
          id: team.id,
          label: team.displayName,
          // Same fallback chain `/ploegen` uses. Null on the youth teams, which
          // carry no editorial division — that absence is the honest answer,
          // and the row shows it.
          value: present(team.divisionFull) ?? present(team.division),
          href: `/ploegen/${team.slug}`,
        })),
    },
    {
      id: "nieuws",
      title: "Nieuws",
      entries: articles.filter(linkable).map((article) => ({
        id: article.id,
        label: article.title,
        value: contentsDate(article.publishedAt),
        href: `/nieuws/${article.slug}`,
      })),
    },
    {
      id: "evenementen",
      title: "Evenementen",
      entries: events.filter(linkable).map((event) => ({
        id: event.id,
        label: event.title,
        value: contentsDate(event.dateStart),
        href: `/evenementen/${event.slug}`,
      })),
    },
    {
      id: "clubpaginas",
      title: "Clubpagina's",
      entries: pages.filter(linkable).map((page) => ({
        id: page.id,
        label: page.title,
        // A club page has no date of its own and no reeks; what it does have is
        // when it last changed, which is the same "when" register the other
        // three groups print. The mockup showed the route prefix here, but
        // every one of these pages lives under `/club`, so that column would
        // have repeated one constant down the page and told the reader nothing
        // the link did not already carry.
        //
        // Known imprecision, recorded rather than hidden: `_updatedAt` is
        // re-stamped by any bulk mutation, so a Sanity migration run against
        // `page` documents will print the migration's date on every row as
        // though the club had rewritten all of them that morning.
        value: contentsDate(page.updatedAt),
        href: `/club/${page.slug}`,
      })),
    },
  ];

  return groups.filter((group) => group.entries.length > 0);
};
