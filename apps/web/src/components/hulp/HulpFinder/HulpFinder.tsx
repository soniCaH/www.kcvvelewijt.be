"use client";

/**
 * `<HulpFinder>` — the Hulp half of the `/hulp` hub (design lock 7o6 / 7o6c),
 * a fanzine reskin of the legacy `<HulpPage>` responsibility finder.
 *
 * **Pure browse.** The unified search lives in `<HubSearch>` (hero + sticky nav),
 * so the finder no longer owns a search box. It is category-led:
 *
 *  - **Audience chips** (ouder/speler/trainer/supporter) filter by `role`, driven
 *    by the `?audience` URL param so the hero's audience deep-links land here.
 *  - **Category chips** (Alles + 6 · Phosphor glyph · Medisch = brick accent ·
 *    active = jersey-deep) switch the view.
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
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "@/lib/icons.redesign";
import { useResponsibilityAnalytics } from "@/hooks/useResponsibilityAnalytics";
import { useHubMemberPanel } from "@/components/organigram/HubMemberPanel";
import type { ResponsibilityPath, UserRole } from "@/types/responsibility";
import {
  ACCENT_GLYPH_CLASS,
  CATEGORY_META,
  CATEGORY_ORDER,
  groupPathsByCategory,
  type CategoryKey,
} from "./categoryMeta";
import { QuestionCard } from "./QuestionCard";

const AUDIENCE_OPTIONS = [
  { value: "ouder", label: "Ouder" },
  { value: "speler", label: "Speler" },
  { value: "trainer", label: "Trainer" },
  { value: "supporter", label: "Supporter" },
] as const;

const AUDIENCE_PARAM = "audience";
type CategoryFilter = "alles" | CategoryKey;

export interface HulpFinderProps {
  responsibilityPaths: ResponsibilityPath[];
}

export function HulpFinder({ responsibilityPaths }: HulpFinderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const panel = useHubMemberPanel();
  const {
    trackView,
    trackContactClicked,
    trackOrganigramLink,
    trackStepLinkClicked,
  } = useResponsibilityAnalytics();

  const [category, setCategory] = useState<CategoryFilter>("alles");
  const [openId, setOpenId] = useState<string | null>(null);
  const pendingScroll = useRef<string | null>(null);

  const audienceParam = searchParams.get(AUDIENCE_PARAM);
  const audience: UserRole | null = AUDIENCE_OPTIONS.some(
    (o) => o.value === audienceParam,
  )
    ? (audienceParam as UserRole)
    : null;

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
  // it renders, since "Alles" only shows the top-3 per category).
  const reveal = useCallback(
    (rawId: string) => {
      const id = rawId.replace(/^#/, "");
      const path = pathById.get(id);
      if (!path) return;
      setCategory(path.category);
      setOpenId(id);
      pendingScroll.current = id;
    },
    [pathById],
  );

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

  const setAudience = useCallback(
    (next: UserRole | null) => {
      // Read the live URL (this is a client-only handler) so the panel's
      // `?member`/`?holder` deep-link — written via history.replaceState, which
      // Next's useSearchParams does not observe — survives an audience toggle.
      const params = new URLSearchParams(window.location.search);
      if (next) params.set(AUDIENCE_PARAM, next);
      else params.delete(AUDIENCE_PARAM);
      const qs = params.toString();
      router.replace(`/hulp${qs ? `?${qs}` : ""}#hulp`, { scroll: false });
    },
    [router],
  );

  const handleToggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

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
    <div id={path.id} key={path.id} className="scroll-mt-32">
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
        <FinderEmpty>
          Nog geen hulpvragen beschikbaar.{" "}
          <Link
            href="/club/contact"
            className="text-jersey-deep font-semibold underline"
          >
            Contacteer de club →
          </Link>
        </FinderEmpty>
      );
    }
    if (audiencePaths.length === 0) {
      return (
        <FinderEmpty>
          Geen hulpvragen voor deze rol.{" "}
          <FilterResetButton onClick={() => setAudience(null)}>
            Toon alles
          </FilterResetButton>
        </FinderEmpty>
      );
    }
    if (category !== "alles") {
      const all = grouped[category];
      if (all.length === 0) {
        return (
          <FinderEmpty>
            Geen hulpvragen in deze categorie{audience ? " voor deze rol" : ""}.{" "}
            <FilterResetButton onClick={() => setCategory("alles")}>
              Toon alle categorieën
            </FilterResetButton>
          </FinderEmpty>
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
            onSeeAll={() => setCategory(cat)}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Audience filter — mirrors the hero chips; drives ?audience. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-ink-muted font-mono text-[11px] tracking-[0.1em] uppercase">
          Ik ben
        </span>
        {AUDIENCE_OPTIONS.map((option) => {
          const active = audience === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => setAudience(active ? null : option.value)}
              className={`border-[1.5px] px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.05em] uppercase transition-colors ${
                active
                  ? "border-ink bg-ink text-cream"
                  : "border-ink-muted text-ink-soft hover:bg-cream-soft"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Category chips. */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={category === "alles"}
          onClick={() => setCategory("alles")}
          className={`border-ink border-[1.5px] px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.04em] uppercase shadow-[2px_2px_0_0_var(--color-ink)] transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${
            category === "alles"
              ? "bg-jersey-deep text-cream"
              : "bg-cream text-ink"
          }`}
        >
          Alles
        </button>
        {CATEGORY_ORDER.map((cat) => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const active = category === cat;
          const brickEdge =
            !active && meta.accent === "brick"
              ? "border-l-alert border-l-4"
              : "";
          return (
            <button
              key={cat}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(cat)}
              className={`border-ink inline-flex items-center gap-2 border-[1.5px] px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.04em] uppercase shadow-[2px_2px_0_0_var(--color-ink)] transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none ${
                active
                  ? "bg-jersey-deep text-cream"
                  : `bg-cream text-ink ${brickEdge}`
              }`}
            >
              <Icon
                size={14}
                aria-hidden
                className={active ? undefined : ACCENT_GLYPH_CLASS[meta.accent]}
              />
              {meta.label}
            </button>
          );
        })}
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
          className="text-jersey-deep border-jersey-deep mt-3 inline-flex items-center gap-1.5 border-[1.5px] px-2.5 py-2 font-mono text-[10px] font-semibold tracking-[0.05em] uppercase shadow-[2px_2px_0_0_var(--color-jersey-deep)] transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
        >
          Alle {paths.length} vragen
          <ArrowRight size={12} aria-hidden />
        </button>
      )}
    </section>
  );
}

/** Inline text button that resets a filter inside an empty state. */
function FilterResetButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-jersey-deep font-semibold underline"
    >
      {children}
    </button>
  );
}

function FinderEmpty({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="border-ink bg-cream-soft text-ink-soft border-2 p-6 text-center text-sm shadow-[3px_3px_0_0_var(--color-ink)]"
    >
      {children}
    </div>
  );
}
