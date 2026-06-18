/**
 * UI Components Barrel Export
 * Central export point for all base UI components
 */

// Button
export { Button } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";

// Spinner
export { Spinner } from "./Spinner";
export type { SpinnerProps, SpinnerSize, SpinnerVariant } from "./Spinner";

// FilterTabs
export { FilterTabs } from "./FilterTabs";
export type { FilterTabsProps, FilterTab } from "./FilterTabs";

// Input
export { Input } from "./Input";
export type { InputProps, InputSize } from "./Input";

// Label
export { Label } from "./Label";
export type { LabelProps } from "./Label";

// Textarea
export { Textarea } from "./Textarea";
export type { TextareaProps, TextareaResize } from "./Textarea";

// TextareaCounter
export { TextareaCounter } from "./TextareaCounter";
export type { TextareaCounterProps } from "./TextareaCounter";

// Select
export { Select } from "./Select";
export type { SelectProps, SelectSize } from "./Select";

// Alert
export { Alert, AlertBadge } from "./Alert";
export type {
  AlertProps,
  AlertVariant,
  AlertBadgeProps,
  AlertBadgeVariant,
  AlertBadgeSize,
} from "./Alert";

// SectionTransition
export { SectionTransition } from "./SectionTransition";
export type {
  SectionTransitionProps,
  SectionBg,
  SectionTransitionConfig,
} from "./SectionTransition";

// SectionStack
export { SectionStack } from "./SectionStack";
export type { SectionStackProps, SectionConfig } from "./SectionStack";

// SectionHeader
export { SectionHeader } from "./SectionHeader";
export type { SectionHeaderProps } from "./SectionHeader";

// SectionKicker
export { SectionKicker } from "./SectionKicker";
export type { SectionKickerProps } from "./SectionKicker";

// HorizontalSlider
export { HorizontalSlider } from "./HorizontalSlider";
export type { HorizontalSliderProps } from "./HorizontalSlider";

// DownloadButton
export { DownloadButton } from "./DownloadButton";
export type { DownloadButtonProps } from "./DownloadButton";

// LinkButton
export { LinkButton } from "./LinkButton";
export type { LinkButtonProps } from "./LinkButton";

// SectionCta
export { SectionCta } from "./SectionCta";
export type { SectionCtaProps } from "./SectionCta";

// ScrollHint
export { useScrollHint, ScrollArrowButton } from "./ScrollHint";
export type { UseScrollHintReturn, ScrollArrowButtonProps } from "./ScrollHint";

// BodyQuote
export { BodyQuote } from "./BodyQuote";
export type { BodyQuoteProps } from "./BodyQuote";

// Divider
export { DashedDivider, DottedDivider } from "./Divider";
export type { DividerProps, DividerStyle, DividerColor } from "./Divider";

// EndMark
export { EndMark } from "./EndMark";
export type { EndMarkProps } from "./EndMark";

// HighlighterStroke
export { HighlighterStroke } from "./HighlighterStroke";
export type {
  HighlighterStrokeProps,
  HighlighterStrokeColor,
} from "./HighlighterStroke";

// ErrorState
export { ErrorState } from "./ErrorState";
export type {
  ErrorStateProps,
  ErrorStateAction,
  ErrorStateActionVariant,
} from "./ErrorState";

// JerseyIllustration
export { JerseyIllustration } from "./JerseyIllustration";
export type { JerseyIllustrationProps } from "./JerseyIllustration";

// JerseyShirt
export { JerseyShirt } from "./JerseyShirt";
export type { JerseyShirtProps } from "./JerseyShirt";

// EditorialByline
export { EditorialByline } from "./EditorialByline";
export type { EditorialBylineProps } from "./EditorialByline";

// EditorialHeroShell
export { EditorialHeroShell } from "./EditorialHeroShell";
export type { EditorialHeroShellProps } from "./EditorialHeroShell";

// EditorialKicker
export { EditorialKicker } from "./EditorialKicker";
export type { EditorialKickerProps } from "./EditorialKicker";

// EditorialLead
export { EditorialLead, truncateLead } from "./EditorialLead";
export type { EditorialLeadProps } from "./EditorialLead";

// MonoStar
export { MonoStar } from "./MonoStar";

// EditorialLink
export { EditorialLink } from "./EditorialLink";
export type {
  EditorialLinkProps,
  EditorialLinkVariant,
  EditorialLinkTone,
} from "./EditorialLink";

// MonoLabel
export { MonoLabel } from "./MonoLabel";
export type {
  MonoLabelProps,
  MonoLabelVariant,
  MonoLabelSize,
  MonoLabelTone,
} from "./MonoLabel";

// QuoteMark
export { QuoteMark } from "./QuoteMark";
export type { QuoteMarkProps, QuoteMarkColor } from "./QuoteMark";

// RemovableChip
export {
  RemovableChip,
  type RemovableChipProps,
  type RemovableChipTone,
} from "./RemovableChip";

// StripedSeam
export { StripedSeam } from "./StripedSeam";
export type {
  StripedSeamProps,
  StripedSeamDirection,
  StripedSeamHeight,
  StripedSeamColorPair,
} from "./StripedSeam";

// TapeStrip
export { TapeStrip } from "./TapeStrip";
export type {
  TapeStripProps,
  TapeStripColor,
  TapeStripLength,
  TapeStripPosition,
  TapeStripRotation,
} from "./TapeStrip";

// TapedCard
export { TapedCard } from "./TapedCard";
export type {
  TapedCardProps,
  TapedCardRotation,
  TapedCardShadow,
  TapedCardBg,
  TapedCardPadding,
  TapedCardAs,
} from "./TapedCard";

// TapedCardGrid
export { TapedCardGrid } from "./TapedCardGrid";
export type {
  TapedCardGridProps,
  TapedCardGridColumns,
  TapedCardGridGap,
  TapedCardGridAs,
} from "./TapedCardGrid";

// TapedFigure
export { TapedFigure } from "./TapedFigure";
export type {
  TapedFigureProps,
  TapedFigureAspect,
  TapedFigureBg,
} from "./TapedFigure";

// MonoLabelRow
export { MonoLabelRow } from "./MonoLabelRow";
export type {
  MonoLabelRowProps,
  MonoLabelRowItem,
  MonoLabelRowDivider,
  MonoLabelRowAs,
} from "./MonoLabelRow";

// EditorialHeading
export { EditorialHeading } from "./EditorialHeading";
export type {
  EditorialHeadingProps,
  EditorialHeadingSize,
  EditorialHeadingTone,
  EditorialHeadingLevel,
  EditorialHeadingEmphasis,
} from "./EditorialHeading";

// PullQuote
export { PullQuote } from "./PullQuote";
export type {
  PullQuoteProps,
  PullQuoteAttribution,
  PullQuoteTone,
  PullQuoteEmphasis,
} from "./PullQuote";

// NumberDisplay
export { NumberDisplay } from "./NumberDisplay";
export type {
  NumberDisplayProps,
  NumberDisplaySize,
  NumberDisplayTone,
  NumberDisplayAs,
} from "./NumberDisplay";

// DropCapParagraph
export { DropCapParagraph } from "./DropCapParagraph";
export type {
  DropCapParagraphProps,
  DropCapParagraphTone,
  DropCapParagraphAs,
} from "./DropCapParagraph";

// ClippedCard
export { ClippedCard } from "./ClippedCard";
export type { ClippedCardProps, ClippedCardAs } from "./ClippedCard";

// CtaBand
export { CtaBand } from "./CtaBand";
export type { CtaBandProps } from "./CtaBand";

// StampBadge
export { StampBadge } from "./StampBadge";
export type {
  StampBadgeProps,
  StampBadgeTone,
  StampBadgePosition,
} from "./StampBadge";

// Crest
export { Crest } from "./Crest";
export type { CrestProps } from "./Crest";
