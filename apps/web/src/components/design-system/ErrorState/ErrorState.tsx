/**
 * <ErrorState> — shared 404 / 500 error-page composition (Phase 8.4).
 *
 * One component renders both the not-found and server-error pages, parameterised
 * by `code` / `codeLine` / `pun` / `body` / `actions`. Self-contained on a cream
 * full-bleed surface (no SiteHeader/Footer of its own — those come from the root
 * layout) so it works at the root segment where `error.tsx` renders outside the
 * `(main)` layout.
 *
 * Composition: a taped `<JerseyShirt>` carrying the HTTP code as its shirt number,
 * a mono code line, a serif italic pun, body, and a centred action row. This is
 * Candidate A ("centered") from the Phase 8.4 Storybook A/B — the owner picked it
 * over the scoreboard candidate, which was removed before route wire-in.
 *
 * Copy + actions are locked in `8e2-copy-locked.md`; buttons stay plain (the wink
 * lives in the headline only). The 500 "Probeer opnieuw" action is wired to the
 * `reset()` callback from `error.tsx` via an `onClick` action.
 *
 * Spec: `docs/design/mockups/phase-8-errors/8e1-composition-locked.md` + `8e2`.
 */
import { Button } from "../Button";
import { EditorialHeading } from "../EditorialHeading";
import { JerseyShirt } from "../JerseyShirt";
import { LinkButton } from "../LinkButton";
import { TapedCard } from "../TapedCard";
import type { StateAction } from "../_internal/stateAction";

export type ErrorStateActionVariant = "primary" | "ghost";

interface ErrorStateActionExtra {
  variant?: ErrorStateActionVariant;
  /**
   * Stable analytics slug rendered as `data-error-action` (e.g. `"home"` /
   * `"search"` / `"retry"`). A page-level `<ErrorAnalytics>` wrapper delegates
   * clicks off this marker into `error_action_click` — so the action row stays
   * handler-free and server-renderable. Omit it to render no marker.
   */
  analyticsAction?: string;
}

/** A navigation action — renders a `<LinkButton>` to `href`. */
export type ErrorStateLinkAction = Extract<StateAction, { href: string }> &
  ErrorStateActionExtra;

/** A button action — renders a `<Button>` (e.g. the 500 `reset()`). */
export type ErrorStateButtonAction = Extract<
  StateAction,
  { onClick: () => void }
> &
  ErrorStateActionExtra;

/**
 * A single call-to-action in the error page's action row. Exactly one of a
 * `href` (link) or an `onClick` (button) — the shared `StateAction`'s
 * mutually-exclusive `never` fields make "both" and "neither" compile
 * errors, so the row can never render a no-op button or silently drop an
 * `onClick`. `<EmptyState>`'s `EmptyStateAction` extends the same base.
 */
export type ErrorStateAction = ErrorStateLinkAction | ErrorStateButtonAction;

export interface ErrorStateProps {
  /** HTTP code, e.g. `"404"` — rendered as the jersey shirt number. */
  code: string;
  /** Mono descriptor line, e.g. `"Fout 404 · pagina niet gevonden"`. */
  codeLine: string;
  /** Headline without a trailing period, e.g. `"Buiten de lijnen"`. */
  pun: string;
  /** Accented substring of `pun`. Defaults to the last word of `pun`. */
  punAccent?: string;
  body: string;
  actions: readonly ErrorStateAction[];
}

const CODE_LINE_CLASS =
  "text-ink-muted font-mono text-mono-sm font-semibold tracking-[0.14em] uppercase";

function lastWord(value: string): string {
  const words = value.trim().split(/\s+/);
  return words[words.length - 1] ?? value;
}

function ActionRow({ actions }: { actions: readonly ErrorStateAction[] }) {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      {actions.map((action) => {
        const variant = action.variant ?? "primary";
        return action.href !== undefined ? (
          <LinkButton
            key={action.label}
            href={action.href}
            variant={variant}
            data-error-action={action.analyticsAction}
          >
            {action.label}
          </LinkButton>
        ) : (
          <Button
            key={action.label}
            type="button"
            variant={variant}
            onClick={action.onClick}
            data-error-action={action.analyticsAction}
          >
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}

export function ErrorState({
  code,
  codeLine,
  pun,
  punAccent,
  body,
  actions,
}: ErrorStateProps) {
  const accent = punAccent ?? lastWord(pun);

  return (
    <div className="bg-cream flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center md:py-20">
      <div className="mx-auto flex max-w-[40rem] flex-col items-center">
        <TapedCard
          bg="cream"
          rotation="b"
          shadow="md"
          padding="md"
          tape={{ color: "warm", length: "md" }}
          className="mb-7"
        >
          {/* The shirt is a silent artefact (#2559 rule 4); the code it
              carries is already announced by the mono code line below. */}
          <JerseyShirt letterOverlay={code} className="h-40 w-40" />
        </TapedCard>

        <p className={CODE_LINE_CLASS}>{codeLine}</p>

        <EditorialHeading
          level={1}
          size="display-xl"
          emphasis={{ text: accent }}
          className="mt-2 mb-0"
        >
          {pun}
        </EditorialHeading>

        {/* No own reading-measure clamp: the `max-w-[40rem]` wrapper above
            already owns this composition's width (DESIGN.md "The
            Reading-Measure Exemption Rule", #2645). */}
        <p className="text-ink text-body-md mt-3.5">{body}</p>

        <ActionRow actions={actions} />
      </div>
    </div>
  );
}
