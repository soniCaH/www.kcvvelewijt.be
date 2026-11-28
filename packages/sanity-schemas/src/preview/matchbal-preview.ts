import type {PreviewValue} from 'sanity'

/** Sanity preview select + prepare for matchbal: the Sponsor's name and logo, the match id below. */

export const matchbalPreviewSelect = {
  matchId: 'matchId',
  sponsor: 'sponsor.name',
  media: 'sponsor.logo',
}

interface MatchbalPreviewSelection {
  matchId?: string
  sponsor?: string
  media?: PreviewValue['media']
}

export const prepareMatchbalPreview = ({matchId, sponsor, media}: MatchbalPreviewSelection) => ({
  title: sponsor ?? 'Matchbal zonder sponsor',
  subtitle: matchId ? `Wedstrijd ${matchId}` : 'Geen wedstrijd-id',
  media,
})
