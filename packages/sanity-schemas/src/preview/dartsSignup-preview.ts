/**
 * Sanity preview select + prepare for dartsSignup.
 * Subtitle: captain, wachtlijst flag and whether the team has paid.
 */

export const dartsSignupPreviewSelect = {
  teamName: 'teamName',
  captainName: 'captainName',
  paid: 'paid',
  waitlist: 'waitlist',
}

interface DartsSignupPreviewSelection {
  teamName?: string
  captainName?: string
  paid?: boolean
  waitlist?: boolean
}

export const prepareDartsSignupPreview = ({
  teamName,
  captainName,
  paid,
  waitlist,
}: DartsSignupPreviewSelection) => ({
  title: teamName || '(naamloos)',
  subtitle: [captainName, waitlist ? 'Wachtlijst' : null, paid ? 'Betaald' : 'Niet betaald']
    .filter(Boolean)
    .join(' · '),
})
