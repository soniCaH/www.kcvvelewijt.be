// `resolveTransfer`, `KCVV_CLUB_NAME` and `KCVV_CLUB_LOGO_URL` are
// deliberately NOT re-exported here: every consumer (TransferFactCard.tsx,
// EditorialHero.tsx, types.test.ts) imports directly from "./types" — see
// the `Alert` barrel (@/components/design-system/Alert/index.ts) for the
// same pattern.
export type {
  TransferDirection,
  TransferFactValue,
  TransferSide,
  ResolvedTransfer,
} from "./types";
