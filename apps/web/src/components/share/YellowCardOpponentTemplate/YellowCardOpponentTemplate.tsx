import {
  DisciplinaryCard,
  type DisciplinaryCardProps,
} from "../shared/DisciplinaryCard";

export type YellowCardOpponentTemplateProps = Required<
  Pick<DisciplinaryCardProps, "matchName" | "minute">
>;

/**
 * Gele kaart · tegenstander — 1080×1920 Instagram Story. Register A, jersey
 * accent (theirs), warm card graphic, ghost "G".
 */
export function YellowCardOpponentTemplate(
  props: YellowCardOpponentTemplateProps,
) {
  return <DisciplinaryCard kind="yellow" side="opponent" {...props} />;
}
