import {Stack, Text} from '@sanity/ui'
import type {JSX} from 'react'
import type {GuideEntry} from './guide-model'

/**
 * GuideBody — the presentational intro / "Waar verschijnt dit?" / tips render,
 * extracted so the guide reads identically wherever it is mounted. It is mounted
 * once: at the top of every guide-enabled document form (see `GuideFormInput`).
 * The surrounding panel chrome (Card/tone) lives in the caller.
 */
export function GuideBody({entry}: {entry: GuideEntry}): JSX.Element {
  const {intro, placement, tips} = entry

  return (
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
  )
}
