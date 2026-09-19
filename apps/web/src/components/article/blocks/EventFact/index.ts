// `resolveEventDate`, `resolveEventRange`, `DEFAULT_TICKET_LABEL` and
// `formatTimeRange` are deliberately NOT re-exported here: every consumer
// (EventDetailBlock.tsx, EventFactInline.tsx, EditorialHero.tsx, the test
// files) imports directly from "./types" / "./format-time-range" — see the
// `Alert` barrel (@/components/design-system/Alert/index.ts) for the same
// pattern.
export type {
  EventFactValue,
  EventFactSession,
  ResolvedEvent,
  ResolvedSession,
  ResolvedEventRange,
} from "./types";
