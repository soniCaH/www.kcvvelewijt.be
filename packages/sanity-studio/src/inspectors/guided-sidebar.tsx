import {HelpCircleIcon} from '@sanity/icons'
import {Box, Card, Stack, Text} from '@sanity/ui'
import type {JSX} from 'react'
import {defineDocumentInspector, type DocumentInspectorProps, useValidationStatus} from 'sanity'
import {guideContent} from './guide-content'
import {buildGuideModel} from './guide-model'

/**
 * GuidedSidebar — a right-docked document inspector that shows, in plain
 * Dutch, why this document type matters and what still blocks publishing.
 *
 * The "still needed" list reuses Sanity's own validation markers
 * (`useValidationStatus`), so required/hidden/custom rules are all respected
 * without re-deriving them. Preview is intentionally left to Sanity's
 * Presentation tool (deferred — not set up in either studio yet) rather than a
 * hand-rolled link; this inspector reads no form state, so it stays safe to
 * render in the inspector panel regardless of form context.
 */
function GuidedSidebar({documentId, documentType}: DocumentInspectorProps): JSX.Element | null {
  const entry = guideContent[documentType]
  // ponytail: useValidationStatus is @internal, but it is the exact hook
  // Sanity's own validation UI uses. Revisit if a public hook lands.
  const {validation} = useValidationStatus(documentId, documentType, false)

  if (!entry) return null

  const {intro, outstanding} = buildGuideModel(validation, entry)

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Text size={1} muted>
          {intro}
        </Text>
        <Stack space={3}>
          <Text size={1} weight="semibold">
            {outstanding.length === 0 ? 'Klaar om te publiceren ✓' : 'Nog in te vullen'}
          </Text>
          {outstanding.map((item, i) => (
            <Card key={`${item.path}-${i}`} padding={3} radius={2} shadow={1} tone="caution">
              <Text size={1}>{item.message}</Text>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Box>
  )
}

export const guidedSidebarInspector = defineDocumentInspector({
  name: 'kcvv-guided-sidebar',
  useMenuItem: () => ({icon: HelpCircleIcon, showAsAction: true, title: 'Gids'}),
  component: GuidedSidebar,
})
