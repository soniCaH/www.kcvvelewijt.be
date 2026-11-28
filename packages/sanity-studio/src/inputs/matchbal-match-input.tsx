import {Card, Stack, Text} from '@sanity/ui'
// @sanity/ui v4 moved Autocomplete to its own entry point.
import {Autocomplete} from '@sanity/ui/autocomplete'
import {type JSX, useEffect, useState} from 'react'
import {PatchEvent, set, type StringInputProps} from 'sanity'
import {type MatchOption, toMatchOptions} from './upcoming-match-options'

// Both Studios read the production site: the list is PSD fixture data, the
// same for every dataset. The route is public and CDN-cached for a day.
const UPCOMING_MATCHES_URL = 'https://www.kcvvelewijt.be/api/matches/upcoming'

type ListState =
  {status: 'loading'} | {status: 'failed'} | {status: 'ready'; options: MatchOption[]}

/**
 * Custom input for `matchbal.matchId` (#3920). Keeps the plain id field (a
 * played match is no longer in the list, and the list may be down) and adds
 * a searchable list of every coming match; a pick stores that match's id.
 * A saved id shows its match line, or says it is not in the list.
 */
export const MatchbalMatchInput = (props: StringInputProps): JSX.Element => {
  const {value, onChange, readOnly, elementProps} = props
  const [list, setList] = useState<ListState>({status: 'loading'})

  useEffect(() => {
    const state = {cancelled: false}
    fetch(UPCOMING_MATCHES_URL)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body: unknown) => {
        if (!state.cancelled) setList({status: 'ready', options: toMatchOptions(body)})
      })
      .catch(() => {
        if (!state.cancelled) setList({status: 'failed'})
      })
    return () => {
      state.cancelled = true
    }
  }, [])

  const options = list.status === 'ready' ? list.options : []
  const current = value ? options.find((o) => o.value === value) : undefined

  return (
    <Stack gap={3}>
      {props.renderDefault(props)}
      {current && (
        <Text size={1} muted>
          {current.line}
        </Text>
      )}
      {value && !current && list.status === 'ready' && (
        <Text size={1} muted>
          Wedstrijd {value} staat niet in de lijst van komende wedstrijden: al gespeeld, of een
          verkeerd id. Controleer het op kcvvelewijt.be/wedstrijd/{value}.
        </Text>
      )}
      {list.status === 'failed' ? (
        <Text size={1} muted>
          De wedstrijdlijst is nu niet beschikbaar. Typ het wedstrijd-id hierboven.
        </Text>
      ) : (
        <Autocomplete
          id={`${elementProps.id}-picker`}
          options={options}
          value=""
          loading={list.status === 'loading'}
          disabled={readOnly || list.status !== 'ready'}
          openButton
          placeholder="Zoek een wedstrijd: ploeg, tegenstander of datum"
          filterOption={(query, option) =>
            option.line.toLowerCase().includes(query.trim().toLowerCase())
          }
          renderOption={(option) => (
            <Card as="button" padding={3}>
              <Text size={1}>{option.line}</Text>
            </Card>
          )}
          renderValue={(id, option) => option?.line ?? id}
          onSelect={(id) => onChange(PatchEvent.from(set(id)))}
        />
      )}
    </Stack>
  )
}

MatchbalMatchInput.displayName = 'MatchbalMatchInput'
