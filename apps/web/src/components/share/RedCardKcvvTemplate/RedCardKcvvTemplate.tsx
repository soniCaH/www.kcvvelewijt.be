import {
  DisciplinaryCard,
  type DisciplinaryCardProps,
} from "../shared/DisciplinaryCard";

export type RedCardKcvvTemplateProps = Required<
  Pick<DisciplinaryCardProps, "matchName" | "minute" | "playerName">
> &
  Pick<DisciplinaryCardProps, "shirtNumber">;

/**
 * Rode kaart · KCVV — 1080×1920 Instagram Story. Register A, brick accent
 * (our card), brick card graphic, ghost "R".
 */
export function RedCardKcvvTemplate(props: RedCardKcvvTemplateProps) {
  return <DisciplinaryCard kind="red" side="kcvv" {...props} />;
}
