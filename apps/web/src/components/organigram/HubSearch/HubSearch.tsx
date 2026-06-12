"use client";

/**
 * <HubSearch> — the unified front-door search for the `/hulp` hub.
 *
 * One search box spanning BOTH intents:
 * - a name / function → a **person** (keyword/structured → Structuur)
 * - a problem / question → an **answer** (semantic → Hulp)
 *
 * The **answer lane is semantic** (#2057, decision 7o8): the query is embedded
 * (`bge-m3`) and matched against the `responsibility` Vectorize index via
 * `useSemanticSearch` → `POST /api/search`, so natural language ("mijn kind
 * heeft zich bezeerd") matches without keyword overlap. The **people lane stays
 * keyword** (`searchMembers`). A strong top answer (score ≥ 0.5) renders
 * **answer-forward** — its own CMS summary + contact inline (never an LLM
 * answer; avoids hallucination on club procedures). On endpoint failure the
 * answer lane **falls back to keyword** (`searchHub`) — the PRD floor — with no
 * smart hint. Selecting a person scrolls to `#structuur`; an answer deep-links
 * the finder accordion by slug (`<HulpFinder>` opens it on `hashchange`, #2056).
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  MagnifyingGlass,
  Question,
  Sparkle,
  User,
  X,
} from "@/lib/icons.redesign";
import { trackEvent } from "@/lib/analytics/track-event";
import { getCategoryInfo } from "@/lib/responsibility-utils";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";
import { useHubMemberPanel } from "@/components/organigram/HubMemberPanel";
import type { OrgChartNode } from "@/types/organigram";
import type { ResponsibilityPath } from "@/types/responsibility";
import {
  interleaveResults,
  mapSemanticResults,
  searchHub,
  searchMembers,
  type HubMemberResult,
  type HubResponsibilityResult,
  type HubSearchResult,
} from "./hub-search";

export type HubSearchVariant = "hero" | "nav";

/** Cosine score above which the top answer renders "answer-forward" — mirrors
 *  the backend's LLM gate (`LLM_SCORE_THRESHOLD`). */
const ANSWER_FORWARD_MIN_SCORE = 0.5;

export interface HubSearchProps {
  /** Members (organigram nodes) to search for people. */
  members: OrgChartNode[];
  /** Responsibility paths — the answer-lane corpus (mapped from semantic hits). */
  responsibilityPaths: ResponsibilityPath[];
  /**
   * `"hero"` — the prominent cream, ink-bordered box inside the dark hero band.
   * `"nav"` — the compact instance repeated in the sticky `<OrganigramSectionNav>`.
   */
  variant?: HubSearchVariant;
  placeholder?: string;
  /** Max results per category (people / answers) before interleaving. */
  maxResults?: number;
  /** Extra classes on the root (e.g. `max-w-[480px]`). */
  className?: string;
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** A light contact label for the answer-forward card (no resolveContact dep). */
function forwardContact(
  path: ResponsibilityPath,
): { name: string; sub?: string } | null {
  const contact = path.primaryContact;
  const memberName = contact.members?.[0]?.name?.trim();
  if (memberName) {
    return {
      name: memberName,
      ...(contact.position ? { sub: contact.position } : {}),
    };
  }
  if (contact.contactType === "manual" && contact.role?.trim()) {
    return { name: contact.role };
  }
  if (contact.contactType === "position" && contact.position?.trim()) {
    return { name: contact.position };
  }
  return null;
}

const rowClass = (selected: boolean) =>
  `flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
    selected ? "bg-jersey-deep/10" : "hover:bg-cream-soft"
  } border-paper-edge border-b last:border-b-0`;

interface RowProps<T extends HubSearchResult> {
  result: T;
  optionId: string;
  selected: boolean;
  /** `select` from the parent — called only in the row's click handler. */
  onSelect: (result: HubSearchResult) => void;
  onHover: () => void;
}

/** Person result row — keeps `select` out of the parent's render path. */
function MemberRow({
  result,
  optionId,
  selected,
  onSelect,
  onHover,
}: RowProps<HubMemberResult>) {
  const person = result.member.members[0];
  const name = person?.name ?? result.member.title;
  return (
    <button
      type="button"
      id={optionId}
      role="option"
      aria-selected={selected}
      onClick={() => onSelect(result)}
      onMouseEnter={onHover}
      className={rowClass(selected)}
    >
      <span className="border-ink bg-cream-soft text-jersey-deep flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2">
        {person?.imageUrl ? (
          <Image
            src={person.imageUrl}
            alt=""
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        ) : name ? (
          <span className="font-display text-sm font-black">
            {initials(name)}
          </span>
        ) : (
          <User size={18} aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-display text-ink block truncate font-semibold">
          {name}
        </span>
        <span className="text-ink-muted block truncate font-mono text-[11px] tracking-wide uppercase">
          {result.member.title}
          {result.extraPositions > 0 &&
            ` · +${result.extraPositions} ${
              result.extraPositions === 1 ? "functie" : "functies"
            }`}
        </span>
      </span>
    </button>
  );
}

/** Answer (responsibility) result row. */
function AnswerRow({
  result,
  optionId,
  selected,
  onSelect,
  onHover,
}: RowProps<HubResponsibilityResult>) {
  return (
    <button
      type="button"
      id={optionId}
      role="option"
      aria-selected={selected}
      onClick={() => onSelect(result)}
      onMouseEnter={onHover}
      className={`${rowClass(selected)} items-start`}
    >
      <span className="text-jersey-deep mt-0.5 flex-shrink-0">
        <Question size={20} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-jersey-deep mb-0.5 block font-mono text-[10px] font-semibold tracking-[0.08em] uppercase">
          {getCategoryInfo(result.path.category).label}
        </span>
        <span className="text-ink block text-sm font-medium">
          {result.path.question}
        </span>
        <span className="text-ink-muted mt-0.5 line-clamp-1 block text-xs">
          {result.path.summary}
        </span>
      </span>
    </button>
  );
}

export function HubSearch({
  members,
  responsibilityPaths,
  variant = "hero",
  placeholder = "Zoek een naam, functie of vraag…",
  maxResults = 5,
  className = "",
}: HubSearchProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [debouncedValue, setDebouncedValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  // Null outside a `<HubMemberPanel>` (e.g. Storybook) → person-select falls back
  // to a plain scroll to the directory.
  const panel = useHubMemberPanel();

  // Debounce the people (keyword) lane (200ms — matches the legacy feel).
  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), 200);
    return () => clearTimeout(id);
  }, [value]);

  const trimmed = value.trim();

  // Answer lane — semantic; the hook debounces (300ms) + aborts in flight. Pass
  // the TRIMMED query so the hook's `executedQuery` converges with `trimmed`
  // (the settle signal below) even when the input has surrounding whitespace.
  const {
    results: semanticResults,
    error: semanticError,
    executedQuery,
    search: runSemantic,
  } = useSemanticSearch({ type: "responsibility", limit: maxResults });
  useEffect(() => {
    runSemantic(trimmed);
  }, [trimmed, runSemantic]);

  const pathById = useMemo(
    () => new Map(responsibilityPaths.map((p) => [p.id, p])),
    [responsibilityPaths],
  );
  const memberResults = useMemo(
    () => searchMembers(debouncedValue, members, maxResults),
    [debouncedValue, members, maxResults],
  );
  const semanticAnswers = useMemo(
    () => mapSemanticResults(semanticResults, pathById),
    [semanticResults, pathById],
  );

  // On endpoint failure, fall back to keyword for the answer lane (PRD floor) —
  // no answer-forward, no smart hint.
  const usingFallback = semanticError !== null;
  const answerForward =
    !usingFallback &&
    semanticAnswers[0] &&
    semanticAnswers[0].score >= ANSWER_FORWARD_MIN_SCORE
      ? semanticAnswers[0]
      : null;

  const rows: HubSearchResult[] = usingFallback
    ? searchHub(debouncedValue, members, responsibilityPaths, maxResults)
    : interleaveResults(
        memberResults,
        answerForward ? semanticAnswers.slice(1) : semanticAnswers,
      );

  // The answer lane has "settled" for the current query once the hook's
  // executedQuery matches it (or we're on the sync keyword fallback). Until then
  // we shimmer only when there's nothing stale to show — so the empty state
  // never flashes during the debounce window, and refining keeps prior results.
  const answersSettled = usingFallback || executedQuery === trimmed;
  const showShimmer = !answersSettled && semanticAnswers.length === 0;

  const items: HubSearchResult[] = answerForward
    ? [answerForward, ...rows]
    : rows;
  const navItems = showShimmer ? memberResults : items;
  const showResults = isFocused && trimmed.length > 0;

  // When the result set recomposes across the shimmer↔settled boundary
  // (`navItems` flips from `memberResults` to the answer-forward list), a stale
  // keyboard highlight would point at a row whose meaning just changed — so
  // Enter could fire on a different option than the one shown highlighted. Drop
  // the highlight on that transition. `onChange` already resets it for an
  // actual query change; this covers the async settle that `onChange` can't see.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync to the async answer-lane settle, which no event handler observes
    setSelectedIndex(-1);
  }, [showShimmer]);

  // Dismiss the dropdown on an outside click.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !dropdownRef.current?.contains(target) &&
        !inputRef.current?.contains(target)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const select = (result: HubSearchResult) => {
    // `organigram_search_used` — length only, no query content (PRD §6).
    trackEvent("organigram_search_used", { query_length: value.length });

    if (typeof window !== "undefined") {
      if (result.type === "member") {
        // Open the person's panel directly (7o9 / F5) — the same destination as
        // a directory card or the finder cross-link — and scroll to the
        // directory behind it. Falls back to a plain scroll without a provider.
        window.location.hash = "structuur";
        panel?.openMember(result.member, {
          view: "cards",
          trigger: inputRef.current,
        });
      } else {
        // An answer deep-links the finder accordion by its slug (#2056).
        window.location.hash = result.path.id;
      }
    }
    setValue(
      result.type === "member"
        ? (result.member.members[0]?.name ?? result.member.title)
        : result.path.question,
    );
    setSelectedIndex(-1);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!showResults) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setSelectedIndex((prev) => (prev < navItems.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        event.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : navItems.length - 1));
        break;
      case "Enter":
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < navItems.length) {
          select(navItems[selectedIndex]);
        }
        break;
      case "Escape":
        // APG combobox: close the popup but KEEP focus in the input (S2) — don't
        // blur to <body>. Typing reopens it (onChange re-sets isFocused).
        event.preventDefault();
        setIsFocused(false);
        break;
    }
  };

  // Announce result state to screen readers when the listbox is open (S1).
  const statusMessage = !showResults
    ? ""
    : showShimmer
      ? // Distinct from the visible "Slim zoeken…" hint so SR users hear a
        // spoken sentence, not a clipped UI label (and the two never collide).
        "Bezig met zoeken…"
      : items.length > 0
        ? `${items.length} ${items.length === 1 ? "resultaat" : "resultaten"}`
        : "Geen resultaten";

  const isHero = variant === "hero";
  const boxShadow = isHero
    ? "shadow-[4px_4px_0_0_var(--color-ink)]"
    : "shadow-[2px_2px_0_0_var(--color-ink)]";
  const iconSize = isHero ? 20 : 16;
  const dropdownWidth = isHero
    ? "w-full"
    : "right-0 w-[24rem] max-w-[calc(100vw-1.5rem)]";

  // Built as a JSX value (not a render-phase function) so the React Compiler
  // recognises the onClick as an event handler — `select` writes the hash + reads
  // a ref, which a directly-invoked render function would flag.
  const forwardContactInfo = answerForward
    ? forwardContact(answerForward.path)
    : null;
  const forwardCard = answerForward ? (
    <button
      type="button"
      id={`${listboxId}-opt-0`}
      role="option"
      aria-selected={selectedIndex === 0}
      onClick={() => select(answerForward)}
      onMouseEnter={() => setSelectedIndex(0)}
      className={`border-ink block w-full border-b-2 px-3 py-3 text-left transition-colors ${
        selectedIndex === 0 ? "bg-jersey-deep/10" : "hover:bg-cream-soft"
      }`}
    >
      <span className="text-jersey-deep block font-mono text-[10px] font-semibold tracking-[0.08em] uppercase">
        {getCategoryInfo(answerForward.path.category).label}
      </span>
      <span className="font-display text-ink mt-1 block text-[15px] leading-tight font-semibold italic">
        {answerForward.path.question}
      </span>
      <span className="text-ink-soft mt-1 line-clamp-2 block text-xs leading-relaxed">
        {answerForward.path.summary}
      </span>
      <span className="mt-2 flex items-center justify-between gap-2">
        {forwardContactInfo ? (
          <span className="flex min-w-0 items-center gap-2">
            <span className="border-ink bg-cream-soft text-jersey-deep font-display flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] text-[9px] font-black">
              {initials(forwardContactInfo.name)}
            </span>
            <span className="text-ink-muted truncate font-mono text-[9px] tracking-wide uppercase">
              {forwardContactInfo.name}
              {forwardContactInfo.sub ? ` · ${forwardContactInfo.sub}` : ""}
            </span>
          </span>
        ) : (
          <span />
        )}
        <span className="text-jersey-deep inline-flex flex-shrink-0 items-center gap-1 font-mono text-[10px] font-semibold tracking-[0.04em] uppercase">
          Lees volledig antwoord
          <ArrowRight size={12} aria-hidden />
        </span>
      </span>
    </button>
  ) : null;

  const smartHint = (label: string) => (
    <div className="border-paper-edge bg-cream-soft flex items-center gap-1.5 border-b-[1.5px] px-3 py-1.5 font-mono text-[10px] tracking-[0.07em] uppercase">
      <Sparkle size={12} className="text-jersey-deep" aria-hidden />
      <span className="text-jersey-deep">{label}</span>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      <div
        className={`border-ink bg-cream flex items-center gap-2 border-2 ${boxShadow} ${
          isHero ? "px-3 py-3" : "px-2.5 py-2"
        }`}
      >
        <span className="text-jersey-deep flex-shrink-0">
          <MagnifyingGlass size={iconSize} aria-hidden />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setSelectedIndex(-1);
            // Typing reopens the popup after an Escape that closed it (S2).
            setIsFocused(true);
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-label="Zoek een persoon of hulpvraag"
          aria-autocomplete="list"
          aria-expanded={showResults}
          aria-controls={showResults ? listboxId : undefined}
          aria-activedescendant={
            selectedIndex >= 0 && selectedIndex < navItems.length
              ? `${listboxId}-opt-${selectedIndex}`
              : undefined
          }
          className={`text-ink placeholder:text-ink-muted w-full bg-transparent focus:outline-none ${
            isHero ? "text-[15px]" : "text-[13px]"
          }`}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue("");
              setSelectedIndex(-1);
              inputRef.current?.focus();
            }}
            aria-label="Wissen"
            // Pull-back padding widens the tap target without shifting layout (B4).
            className="text-ink-muted hover:text-ink -m-1.5 flex-shrink-0 p-1.5 transition-colors"
          >
            <X size={iconSize} aria-hidden />
          </button>
        )}
      </div>

      {/* Screen-reader-only running status — announces result counts as the
          listbox settles (S1), so a SR user knows what the live search found. */}
      <span role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </span>

      {showResults && (
        <div
          ref={dropdownRef}
          id={listboxId}
          role="listbox"
          aria-label="Zoekresultaten"
          className={`border-ink bg-cream absolute z-50 mt-2 max-h-96 ${dropdownWidth} overflow-y-auto border-2 shadow-[4px_4px_0_0_var(--color-ink)]`}
        >
          {showShimmer ? (
            <>
              {smartHint("Slim zoeken…")}
              {memberResults.map((result, index) => (
                <MemberRow
                  key={`member-${result.member.id}`}
                  result={result}
                  optionId={`${listboxId}-opt-${index}`}
                  selected={index === selectedIndex}
                  onSelect={select}
                  onHover={() => setSelectedIndex(index)}
                />
              ))}
              <div aria-hidden className="px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="bg-cream-soft h-9 w-9 flex-shrink-0 animate-pulse rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="bg-cream-soft h-2.5 w-1/3 animate-pulse" />
                    <div className="bg-cream-soft h-2.5 w-3/4 animate-pulse" />
                  </div>
                </div>
              </div>
            </>
          ) : items.length > 0 ? (
            <>
              {!usingFallback &&
                smartHint(answerForward ? "Beste match" : "Slim gezocht")}
              {forwardCard}
              {rows.map((result, i) => {
                const index = answerForward ? i + 1 : i;
                const optionId = `${listboxId}-opt-${index}`;
                const selected = index === selectedIndex;
                const onHover = () => setSelectedIndex(index);
                return result.type === "member" ? (
                  <MemberRow
                    key={`member-${result.member.id}`}
                    result={result}
                    optionId={optionId}
                    selected={selected}
                    onSelect={select}
                    onHover={onHover}
                  />
                ) : (
                  <AnswerRow
                    key={`answer-${result.path.id}`}
                    result={result}
                    optionId={optionId}
                    selected={selected}
                    onSelect={select}
                    onHover={onHover}
                  />
                );
              })}
            </>
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-ink text-sm">
                Geen resultaten voor &ldquo;{value}&rdquo;
              </p>
              <p className="text-ink-muted mt-1 text-xs">
                Probeer een andere zoekterm — of contacteer ons rechtstreeks.
              </p>
              {/* Dead-end escape (#2058): a failed search always offers a human
                  door. The click is its own conversion signal, separate from
                  `organigram_search_used`. */}
              <Link
                href="/club/contact"
                onClick={() =>
                  trackEvent("organigram_search_contact_escape", {
                    query_length: value.length,
                  })
                }
                className="border-ink bg-warm text-ink shadow-paper-sm mt-3 inline-flex items-center gap-1.5 border-2 px-3 py-1.5 font-mono text-[11px] font-bold tracking-[0.04em] uppercase transition-all duration-300 hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
              >
                Contacteer de club
                <ArrowRight size={12} aria-hidden />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
