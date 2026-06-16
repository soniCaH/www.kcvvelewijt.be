import {
  DisciplinaryCard,
  type DisciplinaryCardProps,
} from "../shared/DisciplinaryCard";

export type YellowCardKcvvTemplateProps = Required<
  Pick<DisciplinaryCardProps, "matchName" | "minute" | "playerName">
> &
  Pick<DisciplinaryCardProps, "shirtNumber">;

/**
 * Gele kaart · KCVV — 1080×1920 Instagram Story. Register A, brick accent
 * (our card), warm card graphic, ghost "G".
 */
export function YellowCardKcvvTemplate(props: YellowCardKcvvTemplateProps) {
  return <DisciplinaryCard kind="yellow" side="kcvv" {...props} />;
}
