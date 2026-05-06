/**
 * UI Components Barrel Export
 * Central export point for all base UI components
 */

// Button
export { Button } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";

// Icon
export { Icon } from "./Icon";
export type { IconProps, IconSize, IconColor } from "./Icon";

// Spinner
export { Spinner, FullPageSpinner } from "./Spinner";
export type {
  SpinnerProps,
  SpinnerSize,
  SpinnerVariant,
  FullPageSpinnerProps,
} from "./Spinner";

// FilterTabs
export { FilterTabs } from "./FilterTabs";
export type { FilterTabsProps, FilterTab } from "./FilterTabs";

// SocialLinks
export { SocialLinks } from "./SocialLinks";
export type { SocialLinksProps } from "./SocialLinks";

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
  TransitionOverlap,
  SectionTransitionConfig,
} from "./SectionTransition";

// SectionStack
export { SectionStack } from "./SectionStack";
export type { SectionStackProps, SectionConfig } from "./SectionStack";

// SectionHeader
export { SectionHeader } from "./SectionHeader";
export type { SectionHeaderProps } from "./SectionHeader";

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

// PageHero
export { PageHero } from "./PageHero";
export type { PageHeroProps } from "./PageHero";

// ScrollHint
export { useScrollHint, ScrollArrowButton } from "./ScrollHint";
export type { UseScrollHintReturn, ScrollArrowButtonProps } from "./ScrollHint";

// BrandedTabs
export { BrandedTabs } from "./BrandedTabs";
export type { BrandedTab, BrandedTabsProps } from "./BrandedTabs";

// FooterSafeArea
export { FooterSafeArea } from "./FooterSafeArea";
export type { FooterSafeAreaProps } from "./FooterSafeArea";

// Divider
export { Divider, DashedDivider, DottedDivider, SolidDivider } from "./Divider";
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

// JerseyShirt
export { JerseyShirt } from "./JerseyShirt";
export type { JerseyShirtProps } from "./JerseyShirt";

// PlayerFigure
export { PlayerFigure } from "./PlayerFigure";
export type { PlayerFigureProps, PlayerFigureTag } from "./PlayerFigure";

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
} from "./MonoLabel";

// QuoteMark
export { QuoteMark } from "./QuoteMark";
export type { QuoteMarkProps, QuoteMarkColor } from "./QuoteMark";

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

// StampBadge
export { StampBadge } from "./StampBadge";
export type {
  StampBadgeProps,
  StampBadgeTone,
  StampBadgePosition,
} from "./StampBadge";
