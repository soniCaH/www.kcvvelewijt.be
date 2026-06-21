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
import {buildGuideModel, isDocEmpty} from './guide-model'

/**
 * GuidedSidebar — a right-docked document inspector that shows, in plain
 * Dutch, why this document type matters and what still blocks publishing.
 *
 * The "still needed" list reuses Sanity's own validation markers
 * (`useValidationStatus`), so required/hidden/custom rules are all respected
 * without re-deriving them. A brand-new draft has no markers yet, so the
 * doc value (`useEditState`) gates the "ready" verdict — an untouched doc
 * shows "begin met invullen", never a false green tick. Both hooks take
 * explicit ids and need no form context, so the inspector is safe to render
 * in the inspector panel. Preview is left to Sanity's Presentation tool
 * (deferred — not set up in either studio yet).
 */
function GuidedSidebar({documentId, documentType}: DocumentInspectorProps): JSX.Element | null {
  const entry = guideContent[documentType]
  // ponytail: useValidationStatus is @internal, but it is the exact hook
  // Sanity's own validation UI uses. Revisit if a public hook lands.
  const {validation} = useValidationStatus(documentId, documentType, false)
  const {draft, published} = useEditState(documentId, documentType)

  if (!entry) return null

  const {intro, outstanding} = buildGuideModel(validation, entry)
  const empty = isDocEmpty(draft ?? published)

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Text size={1} muted>
          {intro}
        </Text>
        {outstanding.length > 0 ? (
          <Stack space={3}>
            <Text size={1} weight="semibold">
              Nog in te vullen
            </Text>
            {outstanding.map((item) => (
              <Card
                key={`${item.path}-${item.message}`}
                padding={3}
                radius={2}
                shadow={1}
                tone="caution"
              >
                <Text size={1}>{item.message}</Text>
              </Card>
            ))}
          </Stack>
        ) : (
          <Text size={1} weight="semibold" muted={empty}>
            {empty ? 'Begin met invullen.' : 'Klaar om te publiceren ✓'}
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
