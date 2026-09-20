// `hasEventFactContent` is deliberately NOT re-exported here: its only
// consumers (EventDetailBlock.tsx itself, EventDetailBlock.test.tsx) import
// it directly from "./EventDetailBlock".
export {
  EventDetailBlock,
  deriveIsPast,
  type EventDetailBlockProps,
} from "./EventDetailBlock";
