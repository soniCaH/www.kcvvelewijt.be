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
import { resolveContact } from "./resolveContact";

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

  // responsibility_view — once per question open (click or deep-link).
  useEffect(() => {
    if (!openId) return;
    const path = pathById.get(openId);
    if (path) trackView(path.id);
  }, [openId, pathById, trackView]);

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

  // Scroll a deep-linked question into view once it has rendered.
  useEffect(() => {
    const id = pendingScroll.current;
    if (!id) return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      pendingScroll.current = null;
    }
  });

  const setAudience = useCallback(
    (next: UserRole | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set(AUDIENCE_PARAM, next);
      else params.delete(AUDIENCE_PARAM);
      const qs = params.toString();
      router.replace(`/hulp${qs ? `?${qs}` : ""}#hulp`, { scroll: false });
    },
    [router, searchParams],
  );

  const handleToggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  const handleShowInStructure = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, path: ResponsibilityPath) => {
      const { nodeId } = resolveContact(path.primaryContact);
      if (!nodeId) return;
      trackOrganigramLink(path.id, nodeId);
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
        onShowInStructure={(event) => handleShowInStructure(event, path)}
      />
    </div>
  );

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
          className={`border-ink border-[1.5px] px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.04em] uppercase shadow-[2px_2px_0_0_var(--color-ink)] transition-colors ${
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
              className={`border-ink inline-flex items-center gap-2 border-[1.5px] px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[0.04em] uppercase shadow-[2px_2px_0_0_var(--color-ink)] transition-colors ${
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
      <div className="mt-6">
        {responsibilityPaths.length === 0 ? (
          <FinderEmpty>
            Nog geen hulpvragen beschikbaar. Stuur ons gerust een bericht — we
            helpen je graag verder.
          </FinderEmpty>
        ) : audiencePaths.length === 0 ? (
          <FinderEmpty>
            Geen hulpvragen voor deze rol.{" "}
            <button
              type="button"
              onClick={() => setAudience(null)}
              className="text-jersey-deep font-semibold underline"
            >
              Toon alles
            </button>
          </FinderEmpty>
        ) : category === "alles" ? (
          <div className="space-y-8">
            {CATEGORY_ORDER.filter((cat) => grouped[cat].length > 0).map(
              (cat) => {
                const meta = CATEGORY_META[cat];
                const Icon = meta.icon;
                const all = grouped[cat];
                const preview = all.slice(0, 3);
                return (
                  <section key={cat}>
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
                        ({all.length})
                      </span>
                    </div>
                    <div className="space-y-2.5">{preview.map(renderCard)}</div>
                    {all.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setCategory(cat)}
                        aria-label={`Alle ${all.length} vragen in ${meta.label}`}
                        className="text-jersey-deep border-jersey-deep hover:bg-jersey-deep hover:text-cream mt-3 inline-flex items-center gap-1.5 border-[1.5px] px-2.5 py-2 font-mono text-[10px] font-semibold tracking-[0.05em] uppercase shadow-[2px_2px_0_0_var(--color-jersey-deep)] transition-colors"
                      >
                        Alle {all.length} vragen
                        <ArrowRight size={12} aria-hidden />
                      </button>
                    )}
                  </section>
                );
              },
            )}
          </div>
        ) : (
          <div className="space-y-2.5">{grouped[category].map(renderCard)}</div>
        )}
      </div>
    </div>
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
