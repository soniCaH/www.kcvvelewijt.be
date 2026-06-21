import {ClipboardIcon} from '@sanity/icons'
import {Box, Stack, Text} from '@sanity/ui'
import type {JSX} from 'react'
import {defineDocumentInspector, type DocumentInspectorProps} from 'sanity'
import {guideContent} from './guide-content'

/**
 * GuidedSidebar — a right-docked document inspector that helps the editor get
 * the document into the right configuration and spot. It shows, in plain
 * Dutch: the document's intention, where it surfaces on the site, and config
 * tips for the non-obvious bits.
 *
 * It deliberately does NOT show a "what's still needed" / publish-readiness
 * list: Sanity's native validation already does that reliably (red field/tab
 * markers + a blocked Publish button), and the inspector can't read the form's
 * live validation without diverging from it. The guide stays a curation aid.
 */
function GuidedSidebar({documentType}: DocumentInspectorProps): JSX.Element | null {
  const entry = guideContent[documentType]
  if (!entry) return null

  const {intro, placement, tips} = entry

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
      </Stack>
    </Box>
  )
}

export const guidedSidebarInspector = defineDocumentInspector({
  name: 'kcvv-guided-sidebar',
  useMenuItem: () => ({icon: ClipboardIcon, showAsAction: true, title: 'Gids'}),
  component: GuidedSidebar,
})
