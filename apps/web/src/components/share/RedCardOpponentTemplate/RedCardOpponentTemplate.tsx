import {
  DisciplinaryCard,
  type DisciplinaryCardProps,
} from "../shared/DisciplinaryCard";

export type RedCardOpponentTemplateProps = Required<
  Pick<DisciplinaryCardProps, "matchName" | "minute">
>;

/**
 * Rode kaart · tegenstander — 1080×1920 Instagram Story. Register A, jersey
 * accent (theirs), brick card graphic, ghost "R", a "Rood!" shout headline.
 */
export function RedCardOpponentTemplate(props: RedCardOpponentTemplateProps) {
  return <DisciplinaryCard kind="red" side="opponent" {...props} />;
}
