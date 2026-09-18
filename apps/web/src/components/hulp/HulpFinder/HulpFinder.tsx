"use client";

/**
 * `<HulpFinder>` — the Hulp half of the `/hulp` hub (design lock 7o6 / 7o6c),
 * a fanzine reskin of the legacy `<HulpPage>` responsibility finder.
 *
 * **Pure browse.** The unified search lives in `<HubSearch>` (hero + sticky nav),
 * so the finder no longer owns a search box. It is category-led:
 *
 *  - **Audience chips** (Alles + ouder/speler/trainer/supporter) filter by
 *    `role`, driven by the `?audience` URL param so the hero's audience
 *    deep-links land here.
 *  - **Category chips** (Alles + 6 · Phosphor glyph) switch the view. Both
 *    rows are `<FilterTabs>` (#2429/#2564) — the neutral Direction D chip,
 *    no facet colour, no brick accent (that Medisch-only left-edge accent
 *    was dropped on absorption; see the `AUDIENCE_TABS`/`CATEGORY_TABS`
 *    docblock below).
 *  - **"Alles"** = a capped category preview — top-3 per category (declaration
 *    order; no fabricated "most asked") + an "Alle N →" affordance that opens that
 *    category's full list. A specific category shows its full single-open accordion.
 *  - **`<QuestionCard>`** is a single-open inline accordion → summary · numbered
 *    steps · person-vocab `<ContactCard>` (with "Toon in structuur →").
 *
 * Each card is `#<slug>` deep-linkable: a direct `/hulp#<slug>` (or the unified
 * search selecting an answer) reveals + opens + scrolls to that question.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@/lib/icons.redesign";
import {
  EmptyState,
  FilterTabs,
  type FilterTab,
} from "@/components/design-system";
import { useRouterFilterParam } from "@/hooks/useRouterFilterParam";
import { filteredEmptyBody } from "@/lib/utils/empty-state-copy";
import { useResponsibilityAnalytics } from "@/hooks/useResponsibilityAnalytics";
import { useHubMemberPanel } from "@/components/organigram/HubMemberPanel";
import {
  HUB_AUDIENCE_FILTERS,
  type ResponsibilityPath,
  type UserRole,
} from "@/types/responsibility";
import {
  ACCENT_GLYPH_CLASS,
  CATEGORY_META,
  CATEGORY_ORDER,
  groupPathsByCategory,
  type CategoryKey,
} from "./categoryMeta";
import { QuestionCard } from "./QuestionCard";

const AUDIENCE_PARAM = "audience";
const CATEGORY_PARAM = "categorie";
type CategoryFilter = "alles" | CategoryKey;
/** Audience facet as it round-trips through the URL — `"alles"` is this
 *  row's own delete-on-default sentinel; `audience` (below) converts it to
 *  the `UserRole | null` shape the rest of the component already expects. */
type AudienceFilter = "alles" | UserRole;
/** Every valid `?audience=` value — hoisted to a module constant (rather
 *  than computed inline at the hook call site) so it's referentially
 *  stable across renders; `useRouterFilterParam` takes it as a plain
 *  `values` array, not a dependency to re-derive (#2783 review finding 7). */
const AUDIENCE_VALUES: readonly UserRole[] = HUB_AUDIENCE_FILTERS.map(
  (option) => option.value,
);

/**
 * Both `/hulp` chip rows, absorbed into `<FilterTabs>` by #2429/#2564 —
 * replaces the two bespoke hand-rolled rows this component used to carry.
 * Audience gains an explicit "Alles" leading facet (it previously had none;
 * the active chip toggled itself off) so it matches the single-select +
 * "Alles" reset shape every other absorbed row already uses. The category
 * row's leading-glyph slot (Phosphor Fill, via `CATEGORY_META`) is the
 * reversed Direction D lock (#2429 resolution addendum, "rule 9"); the
 * brick left-edge accent Medisch carried outside the primitive is dropped —
 * the resolution explicitly left that a deferred, unsettled question about
 * the primitive's prop surface, not a decided requirement.
 */
const AUDIENCE_TABS: FilterTab[] = [
  { value: "alles", label: "Alles" },
  ...HUB_AUDIENCE_FILTERS.map((option): FilterTab => ({
    value: option.value,
    label: option.label,
  })),
];

const CATEGORY_TABS: FilterTab[] = [
  { value: "alles", label: "Alles" },
  ...CATEGORY_ORDER.map((cat): FilterTab => ({
    value: cat,
    label: CATEGORY_META[cat].label,
    icon: CATEGORY_META[cat].icon,
  })),
];

export interface HulpFinderProps {
  responsibilityPaths: ResponsibilityPath[];
}

export function HulpFinder({ responsibilityPaths }: HulpFinderProps) {
  const router = useRouter();
  const panel = useHubMemberPanel();
  const {
    trackView,
    trackContactClicked,
    trackOrganigramLink,
    trackStepLinkClicked,
  } = useResponsibilityAnalytics();

  // Both facets are purely URL-derived via `useRouterFilterParam` (#2779) —
  // no local state, no render-phase resync of their own. `category` used to
  // carry both of those (#2564 review item 5) so that `reveal()` (the
  // `#<slug>` question deep-link) could set it without writing
  // `?categorie=`. That mirror is what let an unrelated `?audience=` push
  // clobber a revealed category back to "alles" (round-1 finding 2):
  // reading the whole `searchParams` object, the resync saw ANY url change
  // as a reason to re-derive from a `?categorie=` the deep-link never
  // wrote. `reveal()` below writes the param it already implies instead
  // (via the shared setter's `{ hash, replace }` override), so there is
  // nothing left to mirror.
  //
  // Both hook instances read `value` from `useSearchParams()` (reactive,
  // consistent with what just rendered — #2783 review finding 1) but merge
  // each WRITE from the live `window.location.search` instead (#2783 review
  // round 2): `useSearchParams()` never observes `HubMemberPanel`'s
  // `?member=`/`?holder=` deep-link, written via a raw `history.replaceState`
  // outside Next's router, and this route hosts both — merging from
  // `useSearchParams()` would silently drop it from the URL on every filter
  // click made while the member panel is open. See `useRouterFilterParam`'s
  // own docblock for the full reasoning and the (narrow, same-widget,
  // pre-#2779-equivalent) trade-off that source choice accepts instead.
  const [category, setCategoryParam] = useRouterFilterParam<CategoryFilter>(
    CATEGORY_PARAM,
    CATEGORY_ORDER,
    { fallback: "alles", route: "/hulp", hash: "hulp" },
  );

  const [openId, setOpenId] = useState<string | null>(null);
  // `openId` mirrored for `reveal()` to read without taking it as a dep — see
  // the comment at its use site.
  const openIdRef = useRef<string | null>(null);
  const pendingScroll = useRef<string | null>(null);
  const finderRef = useRef<HTMLDivElement>(null);
  const scrollToTopRef = useRef(false);

  const [audienceParam, setAudienceParam] =
    useRouterFilterParam<AudienceFilter>(AUDIENCE_PARAM, AUDIENCE_VALUES, {
      fallback: "alles",
      route: "/hulp",
      hash: "hulp",
    });
  const audience: UserRole | null =
    audienceParam === "alles" ? null : audienceParam;

  const pathById = useMemo(() => {
    const map = new Map<string, ResponsibilityPath>();
    for (const path of responsibilityPaths) map.set(path.id, path);
    return map;
  }, [responsibilityPaths]);

  const audiencePaths = useMemo(
    () =>
      audience
        ? responsibilityPaths.filter((p) => p.role.includes(audience))
        : responsibilityPaths,
    [audience, responsibilityPaths],
  );
  const grouped = useMemo(
    () => groupPathsByCategory(audiencePaths),
    [audiencePaths],
  );

  // responsibility_view — once per question open (click or deep-link). Guarded
  // on visibility so a deep-link to a question hidden by the active ?audience
  // filter (it never renders) doesn't log a phantom view.
  useEffect(() => {
    if (!openId) return;
    const path = pathById.get(openId);
    if (path && audiencePaths.includes(path)) trackView(path.id);
  }, [openId, pathById, audiencePaths, trackView]);

  // #<slug> deep-link: reveal + open the question (switching to its category so
  // it renders, since "Alles" only shows the top-3 per category). Writes
  // `?categorie=` via the shared `useRouterFilterParam` setter only when the
  // category actually needs to change — the hash itself is already correct
  // by the time this runs (a real `hashchange`, or the hash present on
  // first load, both move `window.location.hash` natively before this
  // fires). `replace`, not `push`: landing on a deep link isn't an action
  // to undo, so it shouldn't cost the visitor a back-press — the wrinkle
  // that shaped this hook's `{ hash, replace }` setter override (#2779):
  // every chip press below lands on the section anchor via the hook's
  // default `hash: "hulp"`, but `reveal()` needs its own question's `#<id>`
  // instead, via `replace` where every chip press uses `push`.
  const reveal = useCallback(
    (rawId: string) => {
      const id = rawId.replace(/^#/, "");
      const path = pathById.get(id);
      if (!path) return;
      setOpenId(id);
      const wrongCategory = path.category !== category;
      // An active ?audience= that the revealed question isn't tagged for
      // filters it out of `audiencePaths` before the category list is even
      // built — the category chip would switch and the question still
      // wouldn't render. Reset the audience row to "Alles" as well: a path
      // carries several roles, so there is no single right role to switch to.
      const wrongAudience = audience !== null && !path.role.includes(audience);
      // Nothing at all will change: the question is already the open one, in
      // the already-right category, for the already-right audience. So no
      // render is coming and the scroll effect below — keyed on `[openId,
      // category]` — has no reason to run; scroll here instead. Reachable
      // only since `revealHash` began dispatching a synthetic `hashchange`
      // for an identical hash. All three conjuncts are load-bearing: with a
      // different question, or a category/audience still to switch, a render
      // IS coming, and `pendingScroll` below is what lets that scroll land
      // after the target card has expanded rather than against stale
      // geometry.
      //
      // `openId` is read through a ref, not a dep: the listener effect below
      // re-runs `fromHash()` every time `reveal` changes identity, so a dep
      // would re-reveal the hashed question on every unrelated card click.
      if (id === openIdRef.current && !wrongCategory && !wrongAudience) {
        document
          .getElementById(id)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      pendingScroll.current = id;
      // A render is coming and the card already renders where it is, so the
      // scroll effect will drain `pendingScroll` — no url write needed.
      if (!wrongCategory && !wrongAudience) return;
      // ONE url write for both params, not two `useRouterFilterParam`
      // setters: each of those merges from the live `window.location.search`,
      // which `router.replace` has not updated yet by the time the second one
      // runs — the second write would drop the first one's param.
      const params = new URLSearchParams(window.location.search);
      params.set(CATEGORY_PARAM, path.category);
      if (wrongAudience) params.delete(AUDIENCE_PARAM);
      router.replace(`/hulp?${params.toString()}#${id}`, { scroll: false });
    },
    [pathById, category, audience, router],
  );

  useEffect(() => {
    openIdRef.current = openId;
  }, [openId]);

  useEffect(() => {
    const fromHash = () => {
      if (typeof window === "undefined" || !window.location.hash) return;
      reveal(decodeURIComponent(window.location.hash));
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [reveal]);

  // Scroll a deep-linked question into view once it has rendered — runs when a
  // reveal changes the open question / category, not on every render.
  useEffect(() => {
    const id = pendingScroll.current;
    if (!id) return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      pendingScroll.current = null;
    }
  }, [openId, category]);

  // "Alle N →" switches from the multi-category "Alles" preview to one category's
  // full list, which makes the finder SHORTER — a fixed scroll position would
  // then land lower on the page (in the Structuur section). Scroll the finder
  // back to the top so the now-filtered list is what the user sees.
  useEffect(() => {
    if (!scrollToTopRef.current) return;
    scrollToTopRef.current = false;
    finderRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [category]);

  // Dedup guard: re-pressing the already-active audience chip is a no-op —
  // no redundant history entry (repo analytics policy) — `useRouterFilterParam`'s
  // own internal dedup guard covers this too, but this call site guard
  // documents the intent and matches every other absorbed row. The row's
  // own "Alles" chip (added on absorption into `<FilterTabs>`, #2429/#2564)
  // is now the only way to clear a selection — clicking the active chip a
  // second time no longer toggles it off, matching every other filter row.
  const setAudience = useCallback(
    (next: UserRole | null) => {
      if (next === audience) return;
      setAudienceParam(next ?? "alles");
    },
    [audience, setAudienceParam],
  );

  // Dedup guard: re-pressing the active chip / "Alle N →" into the already-
  // active category is a no-op — no redundant history entry.
  const setCategoryFilter = useCallback(
    (next: CategoryFilter) => {
      if (next === category) return;
      setCategoryParam(next);
    },
    [category, setCategoryParam],
  );

  const handleToggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  // Switch to a single category via "Alle N →" and flag a scroll-to-top so the
  // user lands on the filtered list, not stranded lower on the now-shorter page.
  const handleSeeAll = useCallback(
    (cat: CategoryKey) => {
      setCategoryFilter(cat);
      scrollToTopRef.current = true;
    },
    [setCategoryFilter],
  );

  // `nodeId` is threaded up from the card's already-resolved contact (no second
  // resolveContact), so the analytics node and the rendered link can't diverge.
  const handleShowInStructure = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, pathId: string, nodeId: string) => {
      trackOrganigramLink(pathId, nodeId);
      if (panel) {
        event.preventDefault();
        panel.openMemberById(nodeId, {
          view: "cards",
          trigger: event.currentTarget,
        });
        document
          .getElementById("structuur")
          ?.scrollIntoView({ behavior: "smooth" });
      }
    },
    [panel, trackOrganigramLink],
  );

  const renderCard = (path: ResponsibilityPath) => (
    <div id={path.id} key={path.id}>
      <QuestionCard
        path={path}
        open={openId === path.id}
        onToggle={() => handleToggle(path.id)}
        onContactClick={(channel) => trackContactClicked(path.id, channel)}
        onStepLinkClick={(index) => trackStepLinkClicked(path.id, index)}
        onShowInStructure={(event, nodeId) =>
          handleShowInStructure(event, path.id, nodeId)
        }
      />
    </div>
  );

  const renderContent = () => {
    if (responsibilityPaths.length === 0) {
      return (
        <EmptyState
          tier="surface"
          heading="Nog geen hulpvragen beschikbaar"
          live
        >
          Heb je toch een vraag?{" "}
          <Link
            href="/club/contact"
            className="text-jersey-deep font-semibold underline"
          >
            Contacteer de club →
          </Link>
        </EmptyState>
      );
    }
    // `audience &&` is redundant on its own — an unfiltered `audiencePaths`
    // (audience === null) equals `responsibilityPaths`, which the branch
    // above already proved non-empty, so this can only be true when
    // `audience` is set. Narrowing on it here (rather than relying on that
    // proof in prose) is what lets `audience` below type as `UserRole`
    // instead of `UserRole | null`, with no sentinel fallback needed.
    if (audience && audiencePaths.length === 0) {
      // Names the active audience by label ("Ouder"), not the generic "deze
      // rol" — same rule as the category branch below (#2427 rule 5).
      // `reason="filtered"` makes the undo a compile-time requirement.
      const audienceLabel =
        HUB_AUDIENCE_FILTERS.find((o) => o.value === audience)?.label ??
        "deze rol";
      return (
        <EmptyState
          tier="surface"
          heading={`Geen hulpvragen voor ${audienceLabel}`}
          live
          reason="filtered"
          // "Toon alle doelgroepen", not "Toon alles": the handler clears
          // only `audience`, leaving `category` untouched, so the label
          // must name the one facet it actually clears — matching the
          // category branch below, which already does (round 4 review).
          undo={{
            label: "Toon alle doelgroepen",
            onClick: () => setAudience(null),
            analyticsSource: "hulp_audience",
            analyticsFacet: audience,
          }}
        >
          Er zijn voor deze rol geen hulpvragen beschikbaar.
        </EmptyState>
      );
    }
    if (category !== "alles") {
      const all = grouped[category];
      if (all.length === 0) {
        // Names the active category by label ("Medisch"), not the generic
        // "deze categorie" — the copy is the tell (#2427 rule 5).
        const meta = CATEGORY_META[category];
        return (
          <EmptyState
            tier="surface"
            heading={`Geen hulpvragen in ${meta.label}${audience ? " voor deze rol" : ""}`}
            live
            reason="filtered"
            undo={{
              label: "Toon alle categorieën",
              onClick: () => setCategoryFilter("alles"),
              analyticsSource: "hulp_category",
              analyticsFacet: category,
            }}
          >
            {filteredEmptyBody("het volledige overzicht")}
          </EmptyState>
        );
      }
      return <div className="space-y-2.5">{all.map(renderCard)}</div>;
    }
    // "Alles" — capped category preview (top-3 + "Alle N →").
    return (
      <div className="space-y-8">
        {CATEGORY_ORDER.filter((cat) => grouped[cat].length > 0).map((cat) => (
          <CategoryPreview
            key={cat}
            category={cat}
            paths={grouped[cat]}
            renderCard={renderCard}
            onSeeAll={() => handleSeeAll(cat)}
          />
        ))}
      </div>
    );
  };

  return (
    <div ref={finderRef}>
      {/* Audience filter — mirrors the hero chips; drives ?audience. Gains an
          explicit "Alles" leading facet on absorption (#2429/#2564) — it
          previously had none, and the active chip toggled itself off; every
          other absorbed row already has "Alles" as its reset facet. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-ink-muted font-mono text-[11px] tracking-[0.1em] uppercase">
          Ik ben
        </span>
        <FilterTabs
          tabs={AUDIENCE_TABS}
          activeTab={audience ?? "alles"}
          onChange={(value) =>
            setAudience(value === "alles" ? null : (value as UserRole))
          }
          showCounts={false}
          ariaLabel="Filter op doelgroep"
          // `basis-full` below `sm`, sharing the line above it — the layout
          // `flex-1` alone used to produce by accident (#3016). A flex item
          // keeps `min-width: auto`, so this rail's own arrow gutter fed
          // back into the floor its parent sized it to: the row dropped to
          // its own line and ran 37px past the page edge with it (measured
          // at a 500px viewport). `<ScrollRail>` now pins `min-w-0`, so the
          // row shrinks to its share instead — which on its own would have
          // moved it up beside the label on phones. Spelling the wrap out
          // keeps the two `/hulp` chip rows aligned there, on purpose this
          // time.
          className="grow basis-full sm:basis-0"
        />
      </div>

      {/* Category chips. */}
      <div className="mt-4">
        <FilterTabs
          tabs={CATEGORY_TABS}
          activeTab={category}
          onChange={(value) => setCategoryFilter(value as CategoryFilter)}
          showCounts={false}
          ariaLabel="Filter op categorie"
        />
      </div>

      {/* Content. */}
      <div className="mt-6">{renderContent()}</div>
    </div>
  );
}

/** One category block in the "Alles" preview: header · top-3 · "Alle N →". */
function CategoryPreview({
  category,
  paths,
  renderCard,
  onSeeAll,
}: {
  category: CategoryKey;
  paths: ResponsibilityPath[];
  renderCard: (path: ResponsibilityPath) => React.ReactNode;
  onSeeAll: () => void;
}) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  return (
    <section>
      <div className="border-jersey-deep mb-3 inline-flex items-center gap-2 border-b-2 pb-1">
        <Icon
          size={15}
          aria-hidden
          className={ACCENT_GLYPH_CLASS[meta.accent]}
        />
        <span className="font-mono text-[12px] font-semibold tracking-[0.14em] uppercase">
          {meta.label}
        </span>
        <span className="text-ink-muted font-mono text-[12px]">
          ({paths.length})
        </span>
      </div>
      <div className="space-y-2.5">{paths.slice(0, 3).map(renderCard)}</div>
      {paths.length > 3 && (
        <button
          type="button"
          onClick={onSeeAll}
          aria-label={`Alle ${paths.length} vragen in ${meta.label}`}
          className="text-jersey-deep border-jersey-deep mt-3 inline-flex min-h-11 items-center gap-1.5 border-[1.5px] px-2.5 py-2 font-mono text-[10px] font-semibold tracking-[0.05em] uppercase shadow-[2px_2px_0_0_var(--color-jersey-deep)] transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
        >
          Alle {paths.length} vragen
          <ArrowRight size={12} aria-hidden />
        </button>
      )}
    </section>
  );
}
