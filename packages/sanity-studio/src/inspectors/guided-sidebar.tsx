import {ClipboardIcon} from '@sanity/icons'
import {Box, Card, Stack, Text} from '@sanity/ui'
import type {JSX} from 'react'
import {
  defineDocumentInspector,
  type DocumentInspectorProps,
  useEditState,
  useValidationStatus,
} from 'sanity'
import {guideContent} from './guide-content'
import {buildGuideModel, isDocEmpty, resolveGuideVerdict} from './guide-model'

const VERDICT_TEXT = {
  empty: 'Begin met invullen.',
  validating: 'Bezig met controleren…',
  ready: 'Klaar om te publiceren ✓',
} as const

/**
 * GuidedSidebar — a right-docked document inspector that helps the editor get
 * the document into the right configuration and spot. It shows, in plain
 * Dutch: the document's intention, where it surfaces on the site, config tips
 * for the non-obvious bits, and what still blocks publishing.
 *
 * The "still needed" list reuses Sanity's own validation markers
 * (`useValidationStatus`), so required/hidden/custom rules are all respected
 * without re-deriving them. Empty markers are ambiguous (valid OR not-yet-
 * validated), so `isValidating` + the doc value (`useEditState`) gate the
 * verdict — a half-filled, still-validating doc shows "Bezig met controleren…",
 * an untouched doc shows "Begin met invullen", never a false green tick.
 */
function GuidedSidebar({documentId, documentType}: DocumentInspectorProps): JSX.Element | null {
  const entry = guideContent[documentType]
  // ponytail: useValidationStatus is @internal, but it is the exact hook
  // Sanity's own validation UI uses. Revisit if a public hook lands.
  const {validation, isValidating} = useValidationStatus(documentId, documentType, false)
  const {draft, published} = useEditState(documentId, documentType)

  if (!entry) return null

  const {intro, placement, tips, outstanding} = buildGuideModel(validation, entry)
  const empty = isDocEmpty(draft ?? published)
  const verdict = resolveGuideVerdict({outstandingCount: outstanding.length, empty, isValidating})

  return (
    <Box padding={4}>
      <Stack space={5}>
        <Text size={1} muted>
          {intro}
        </Text>

        <Stack space={2}>
          <Text size={1} weight="semibold">
            Waar verschijnt dit?
          </Text>
          <Text size={1} muted>
            {placement}
          </Text>
        </Stack>

        {tips && tips.length > 0 ? (
          <Stack space={2}>
            <Text size={1} weight="semibold">
              Tips
            </Text>
            {tips.map((tip) => (
              <Text key={tip} size={1} muted>
                • {tip}
              </Text>
            ))}
          </Stack>
        ) : null}

        {verdict === 'incomplete' ? (
          <Stack space={3}>
            <Text size={1} weight="semibold">
              Nog in te vullen
            </Text>
            {outstanding.map((item) => (
              <Card key={`${item.path}-${item.message}`} padding={3} radius={2} shadow={1} tone="caution">
                <Text size={1}>{item.message}</Text>
              </Card>
            ))}
          </Stack>
        ) : (
          <Text size={1} weight="semibold" muted={verdict !== 'ready'}>
            {VERDICT_TEXT[verdict]}
          </Text>
        )}
      </Stack>
    </Box>
  )
}

export const guidedSidebarInspector = defineDocumentInspector({
  name: 'kcvv-guided-sidebar',
  useMenuItem: () => ({icon: ClipboardIcon, showAsAction: true, title: 'Gids'}),
  component: GuidedSidebar,
})
