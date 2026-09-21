/**
 * Sanity preview select + prepare for player.
 *
 * The subtitle is the only fill-progress signal an editor has across
 * 352 player documents, 278 non-archived (#2585) — `jerseyNumber` has
 * no other UI that surfaces which are still empty without opening
 * each one. Zero carry a value today.
 */

export const playerPreviewSelect = {
  firstName: 'firstName',
  lastName: 'lastName',
  media: 'transparentImage',
  jerseyNumber: 'jerseyNumber',
}

interface PlayerPreviewSelection {
  firstName?: string
  lastName?: string
  media?: any
  jerseyNumber?: number
}

export function preparePlayerPreview(selection: PlayerPreviewSelection) {
  const {firstName, lastName, media, jerseyNumber} = selection

  return {
    title: `${firstName ?? ''} ${lastName ?? ''}`.trim(),
    subtitle: jerseyNumber ? `#${jerseyNumber}` : 'Geen rugnummer',
    media,
  }
}
