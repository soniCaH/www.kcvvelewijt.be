"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import Link from "next/link";
import type { OrgChartNode } from "@/types/organigram";
import { cn } from "@/lib/utils/cn";
import { deriveCardState } from "@/components/organigram/OrgPersonCard";
import {
  ArrowRight,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  Envelope,
  X,
} from "@/lib/icons.redesign";
import { SpotlightNodeCard } from "./SpotlightNodeCard";
import {
  buildSpotlightTree,
  getSpotlightView,
  primaryFocusId,
  siblingTarget,
  splitFan,
  targetForKey,
  CLUB_ROOT_ID,
  type SpotlightNavKey,
  type SpotlightView,
} from "./spotlight-tree";

/**
 * `<OrganigramExplorer>` — the Phase 7 fullscreen spotlight "verkenner" (7o3 +
 * competitive analysis 7o3b). Navigates the REAL reporting tree as focus+context:
 * the focused node is centred, its parent floats above + in a persistent
 * breadcrumb, siblings flank (cycle + n/N), children fan below (count-then-expand
 * past `childrenCap`). Click or keyboard (↑ parent · ↓ child · ←/→ siblings ·
 * Home/End · Enter descend · Esc close); never pan/drag/pinch; tap-only mobile.
 *
 * A11y: labelled `role="dialog"` (focus-trapped, focus restored on close) over a
 * `role="tree"` stage; the centred node is the single roving-tabindex `treeitem`
 * that holds focus; a polite live region announces each re-centre in Dutch.
 * Motion is a short enter transition, disabled under `prefers-reduced-motion`.
 * Leaves link to `/staf/{psdId}` ("Volledig profiel →") — the in-explorer detail
 * panel is Phase 4 (#2055).
 */

export interface OrganigramExplorerProps {
  /** Flat nodes (`StaffRepository.findAll()` shape, incl. the synthetic root). */
  nodes: OrgChartNode[];
  open: boolean;
  onClose: () => void;
  /** Node to centre on open (deep-link). Defaults to the club root. */
  initialFocusId?: string;
  /** Children shown before "+N meer". Default 7 (research: ~5–7). */
  childrenCap?: number;
  /** Element focus returns to on close (typically the launcher button). */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /**
   * Phase 4 (#2055): open the person-first `<MemberDetailPanel>` for the centred
   * node (the verkenner entry point, 7o5 "trigger + consolidate"). When set, the
   * centre shows a "Contactgegevens" trigger instead of the inline profile link +
   * shared-member list — the panel becomes the single person-first surface.
   */
  onOpenMember?: (node: OrgChartNode, trigger: HTMLElement) => void;
}

const NAV_KEYS = new Set<string>([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
]);

const SCALE_STEPS = [1, 1.15, 1.3] as const;

/** Dutch screen-reader sentence for the newly centred node (7o3b a11y model). */
export function announceFocus(view: SpotlightView): string {
  const { focus, parent, children, depth, siblings, focusIndex } = view;
  const state = deriveCardState(focus.members.length);
  const holders =
    focus.id === CLUB_ROOT_ID
      ? "de club"
      : state === "vacant"
        ? "deze plek is vrij"
        : state === "shared"
          ? `gedeeld, ${focus.members.length} personen`
          : focus.members[0]?.name?.trim() || "—";
  const under = parent ? `, onder ${parent.title}` : "";
  const pos =
    siblings.length > 1
      ? `, positie ${focusIndex + 1} van ${siblings.length}`
      : "";
  const kids =
    children.length === 0
      ? "geen onderliggende functies"
      : `${children.length} ${children.length === 1 ? "onderliggende functie" : "onderliggende functies"}`;
  return `${focus.title}. Niveau ${depth}${under}. ${holders}. ${kids}${pos}.`;
}

export function OrganigramExplorer({
  nodes,
  open,
  onClose,
  initialFocusId,
  childrenCap = 7,
  returnFocusRef,
  onOpenMember,
}: OrganigramExplorerProps) {
  const tree = useMemo(() => buildSpotlightTree(nodes), [nodes]);
  // Open on the deep-linked node when valid, else the primary top node
  // (Voorzitter-equivalent) rather than the thin synthetic club root.
  const landingId = useMemo(
    () =>
      initialFocusId && tree.byId.has(initialFocusId)
        ? initialFocusId
        : primaryFocusId(tree),
    [tree, initialFocusId],
  );

  const [focusId, setFocusId] = useState(landingId);
  const [fanExpanded, setFanExpanded] = useState(false);
  const [siblingsOpen, setSiblingsOpen] = useState(false);
  const [scaleStep, setScaleStep] = useState(0);
  // Phones cap the zoom at A+ (1.15): scale(1.3) pushes the centre card under
  // sibling carets at ~360px, and CSS transforms don't expand the scroll area
  // so overflow can't rescue it (MOB-4).
  const [isPhone, setIsPhone] = useState(false);
  // The centre's focus ring shows only once the user navigates by keyboard
  // (arrows/Tab) — never on open or mouse use, where it reads as a heavy,
  // unwanted selection outline. The centre stays focusable throughout (a11y).
  const [keyboardNav, setKeyboardNav] = useState(false);

  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const centerRef = useRef<HTMLButtonElement>(null);
  const prevOpenRef = useRef(open);
  // The rect of the node that was just activated, captured before the re-render
  // so the new centre can FLIP-travel from there (shared-element continuity).
  const flipFromRef = useRef<{ id: string; rect: DOMRect } | null>(null);

  const view = tree.byId.has(focusId)
    ? getSpotlightView(tree, focusId)
    : getSpotlightView(tree, CLUB_ROOT_ID);
  const fan = splitFan(view.children, childrenCap, fanExpanded);

  const navigate = (targetId: string | null, viaKeyboard = false) => {
    if (!targetId || targetId === focusId) return;
    setKeyboardNav(viaKeyboard);
    // Capture the activated node's current on-screen rect (when it's rendered as
    // a child / parent / jump-list card) so the new centre can travel from it.
    const fromEl = dialogRef.current?.querySelector<HTMLElement>(
      `[data-node-id="${CSS.escape(targetId)}"]`,
    );
    flipFromRef.current = fromEl
      ? { id: targetId, rect: fromEl.getBoundingClientRect() }
      : null;
    setFocusId(targetId);
    setFanExpanded(false);
    setSiblingsOpen(false);
  };

  // Reset focus to the opening node each time the explorer is (re)opened.
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setFocusId(landingId);
      setFanExpanded(false);
      setSiblingsOpen(false);
      setKeyboardNav(false);
    }
    prevOpenRef.current = open;
  }, [open, landingId]);

  // Move real focus to the centred node on open and after every re-centre
  // (roving tabindex). The context fades via the key-remounted `.spotlight-pop`
  // wrapper; the centre node FLIP-travels here (the one shared element — 7o3b:
  // animate only the clicked element, cross-fade the rest).
  useEffect(() => {
    if (open) centerRef.current?.focus();
  }, [open, focusId]);

  useLayoutEffect(() => {
    const flip = flipFromRef.current;
    flipFromRef.current = null;
    const center = centerRef.current;
    if (!open || !flip || flip.id !== focusId || !center?.animate) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches)
      return;

    const to = center.getBoundingClientRect();
    const dx = flip.rect.left + flip.rect.width / 2 - (to.left + to.width / 2);
    const dy = flip.rect.top + flip.rect.height / 2 - (to.top + to.height / 2);
    if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
    const scale = Math.max(0.4, Math.min(1, flip.rect.width / to.width));

    center.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${scale})` },
        { transform: "none" },
      ],
      { duration: 300, easing: "cubic-bezier(0.2, 0, 0, 1)" },
    );
  }, [open, focusId]);

  useEffect(() => {
    const mq = window.matchMedia?.("(max-width: 640px)");
    if (!mq) return;
    const sync = () => setIsPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Restore focus to the launcher on a true→false close.
  const wasOpen = useRef(open);
  useEffect(() => {
    if (wasOpen.current && !open) returnFocusRef?.current?.focus();
    wasOpen.current = open;
  }, [open, returnFocusRef]);

  // Esc closes; Tab is trapped within the dialog.
  const onDialogKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !dialogRef.current) return;
    setKeyboardNav(true); // Tab is a keyboard interaction — show focus rings.
    const focusables = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])',
      ),
    );
    if (focusables.length === 0) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  // Arrow / Home / End on the centred node drive spotlight navigation. The
  // centre is "you are here" — clicking it (or Enter) must NOT descend; you go
  // deeper by pressing ↓ or clicking a child card.
  const onCenterKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!NAV_KEYS.has(e.key)) return;
    e.preventDefault();
    navigate(targetForKey(tree, focusId, e.key as SpotlightNavKey), true);
  };

  if (!open) return null;

  const focusState = deriveCardState(view.focus.members.length);
  const profileHref =
    focusState === "single" ? (view.focus.members[0]?.href ?? null) : null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={onDialogKeyDown}
      data-testid="organigram-explorer"
      className="border-ink bg-jersey-deep-dark text-cream fixed inset-0 z-[80] flex flex-col border-2"
    >
      {/* Top bar */}
      <div className="border-cream/20 flex items-center gap-3 border-b bg-black/20 px-4 py-2.5">
        <span
          id={titleId}
          className="text-cream font-mono text-[11px] tracking-[0.08em] uppercase"
        >
          ▣ Organigram-verkenner
        </span>
        <span className="flex-1" />
        <div className="flex items-center gap-1" aria-label="Tekstgrootte">
          {(["A", "A+", "A++"] as const).map((label, step) => (
            <button
              key={label}
              type="button"
              onClick={() => setScaleStep(step)}
              aria-pressed={scaleStep === step}
              className={cn(
                "border px-1.5 py-0.5 font-mono text-[10px] leading-none transition-colors",
                scaleStep === step
                  ? "border-warm bg-warm text-ink"
                  : "border-cream/40 text-cream hover:border-cream",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Verkenner sluiten"
          className="border-cream/40 hover:border-cream text-cream flex items-center gap-1 border px-2 py-1 font-mono text-[10px] uppercase"
        >
          <X size={12} aria-hidden /> Esc
        </button>
      </div>

      {/* Breadcrumb — the reporting line */}
      <nav
        aria-label="Rapporteringslijn"
        className="border-cream/10 text-cream/75 flex items-center gap-1 overflow-x-auto border-b px-4 py-2 font-mono text-[10px]"
      >
        {view.trail.map((node, i) => {
          const isLast = i === view.trail.length - 1;
          return (
            <span
              key={node.id}
              className="flex items-center gap-1 whitespace-nowrap"
            >
              {i > 0 && <span className="text-cream/40">▸</span>}
              {isLast ? (
                <span aria-current="true" className="text-warm font-semibold">
                  {node.title}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(node.id)}
                  className="decoration-cream/40 hover:text-cream underline underline-offset-2"
                >
                  {node.title}
                </button>
              )}
            </span>
          );
        })}
      </nav>

      {/* Stage */}
      <div className="relative flex-1 overflow-auto px-4 py-6">
        <div
          role="tree"
          aria-label="Organisatiestructuur"
          style={{
            transform: `scale(${SCALE_STEPS[isPhone ? Math.min(scaleStep, 1) : scaleStep]})`,
          }}
          className="mx-auto flex max-w-[60rem] origin-top flex-col items-center gap-5 transition-transform duration-[240ms]"
        >
          <div
            key={focusId}
            className="spotlight-pop flex w-full flex-col items-center gap-5"
          >
            {/* Parent (ascend) */}
            {view.parent ? (
              <button
                type="button"
                data-node-id={view.parent.id}
                onClick={() => navigate(view.parent!.id)}
                aria-label={`Omhoog naar ${view.parent.title}`}
                className="border-cream/45 hover:border-cream text-cream/85 flex items-center gap-1.5 border bg-black/15 px-3 py-1.5 font-mono text-[10px] tracking-[0.04em] uppercase"
              >
                <CaretUp size={11} aria-hidden /> {view.parent.title}
              </button>
            ) : (
              <span className="text-cream/40 font-mono text-[9px] tracking-[0.06em] uppercase">
                Hoogste niveau
              </span>
            )}

            <span aria-hidden className="bg-cream/25 h-5 w-px" />

            {/* Siblings flank + centre */}
            <div className="flex w-full items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate(siblingTarget(tree, focusId, -1))}
                disabled={view.focusIndex <= 0}
                aria-label="Vorige functie"
                className="border-cream/35 text-cream/70 enabled:hover:border-cream shrink-0 border p-1.5 disabled:opacity-25"
              >
                <CaretLeft size={14} aria-hidden />
              </button>

              <div className="flex flex-col items-center gap-1.5">
                <button
                  ref={centerRef}
                  type="button"
                  role="treeitem"
                  tabIndex={0}
                  aria-selected={true}
                  aria-current="true"
                  aria-level={view.depth + 1}
                  aria-setsize={view.siblings.length}
                  aria-posinset={view.focusIndex + 1}
                  aria-label={announceFocus(view)}
                  data-keyboard-nav={keyboardNav}
                  onKeyDown={onCenterKeyDown}
                  className={cn(
                    "cursor-default focus:outline-none",
                    keyboardNav &&
                      "focus:outline-cream focus:outline-2 focus:outline-offset-2",
                  )}
                >
                  <SpotlightNodeCard
                    node={view.focus}
                    variant="center"
                    isRoot={view.focus.id === CLUB_ROOT_ID}
                  />
                </button>
                {view.siblings.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSiblingsOpen((v) => !v)}
                    aria-expanded={siblingsOpen}
                    className="text-cream/70 hover:text-cream font-mono text-[10px]"
                  >
                    {view.focusIndex + 1} / {view.siblings.length} ·{" "}
                    {siblingsOpen ? "verberg" : "alle functies"}
                  </button>
                )}
                {onOpenMember && view.focus.id !== CLUB_ROOT_ID ? (
                  <button
                    type="button"
                    onClick={(e) => onOpenMember(view.focus, e.currentTarget)}
                    aria-haspopup="dialog"
                    className="border-warm bg-warm text-ink hover:bg-cream flex items-center gap-1.5 border-2 px-3 py-1.5 font-mono text-[10px] font-bold tracking-[0.04em] uppercase transition-colors"
                  >
                    <Envelope size={12} aria-hidden />
                    Contactgegevens
                  </button>
                ) : (
                  <>
                    {profileHref && (
                      <Link
                        href={profileHref}
                        className="text-warm hover:text-cream flex items-center gap-1 font-mono text-[10px] uppercase"
                      >
                        Volledig profiel <ArrowRight size={11} aria-hidden />
                      </Link>
                    )}
                    {focusState === "shared" && (
                      <ul
                        aria-label="Personen in deze functie"
                        className="flex flex-col items-center gap-1"
                      >
                        {view.focus.members.map((member) => (
                          <li key={member.id}>
                            {member.href ? (
                              <Link
                                href={member.href}
                                className="text-warm hover:text-cream flex items-center gap-1 font-mono text-[10px]"
                              >
                                {member.name?.trim() || "—"}{" "}
                                <ArrowRight size={10} aria-hidden />
                              </Link>
                            ) : (
                              <span className="text-cream/75 font-mono text-[10px]">
                                {member.name?.trim() || "—"}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate(siblingTarget(tree, focusId, 1))}
                disabled={view.focusIndex >= view.siblings.length - 1}
                aria-label="Volgende functie"
                className="border-cream/35 text-cream/70 enabled:hover:border-cream shrink-0 border p-1.5 disabled:opacity-25"
              >
                <CaretRight size={14} aria-hidden />
              </button>
            </div>

            {/* Sibling jump-list */}
            {siblingsOpen && view.siblings.length > 1 && (
              <ul className="flex max-w-md flex-wrap justify-center gap-1.5">
                {view.siblings.map((sib) => (
                  <li key={sib.id}>
                    <button
                      type="button"
                      data-node-id={sib.id}
                      onClick={() => navigate(sib.id)}
                      aria-current={sib.id === focusId ? "true" : undefined}
                      className={cn(
                        "border px-2 py-1 font-mono text-[9px] uppercase",
                        sib.id === focusId
                          ? "border-warm bg-warm text-ink"
                          : "border-cream/35 text-cream/80 hover:border-cream",
                      )}
                    >
                      {sib.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Children fan */}
            {view.children.length > 0 && (
              <>
                <span aria-hidden className="bg-cream/25 h-5 w-px" />
                <div className="flex flex-wrap items-stretch justify-center gap-2.5">
                  {fan.visible.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      data-node-id={child.id}
                      onClick={() => navigate(child.id)}
                      aria-label={`Naar ${child.title}`}
                      className="transition-all duration-300 hover:shadow-none motion-safe:hover:translate-x-1 motion-safe:hover:translate-y-1"
                    >
                      <SpotlightNodeCard node={child} variant="node" />
                    </button>
                  ))}
                  {fan.hidden > 0 && (
                    <button
                      type="button"
                      onClick={() => setFanExpanded(true)}
                      className="border-cream/45 hover:border-cream text-cream flex h-16 w-36 flex-col items-center justify-center gap-1 border-2 border-dashed px-2"
                    >
                      <CaretDown size={16} aria-hidden />
                      <span className="font-mono text-[10px] uppercase">
                        +{fan.hidden} meer
                      </span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Polite live region — a brief breadcrumb-path re-orientation on each
          re-centre. The full node detail is announced by the centre treeitem's
          accessible name (focus-driven), so this stays terse to avoid speaking
          the same sentence twice. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {view.trail.map((node) => node.title).join(" ▸ ")}
      </div>
    </div>
  );
}
