import {isDeepStrictEqual} from 'node:util'
import {getCliClient} from 'sanity/cli'

/**
 * The six pinned E2E subjects in `staging` (#3147, ruling #3087 §3 and §9):
 * one article per type, one far-future event, one photo gallery.
 *
 * Idempotent: fixed `_id`s + `createOrReplace` for any fixture that drifted,
 * so running it ten times leaves exactly these six documents, identical every
 * time, and a run with nothing to fix writes nothing. It writes only
 * these ids and touches nothing else. It refuses any dataset but `staging` —
 * both `sanity.cli.ts` files point at production, so the dataset is set here.
 *
 * Anyone logged in to the Sanity CLI with write access to project vhb33jaz:
 *
 *   cd apps/studio
 *   npx sanity exec scripts/seed-e2e-fixtures.ts --with-user-token
 */

const client = getCliClient({apiVersion: '2024-01-01'}).withConfig({
  dataset: process.env.SANITY_DATASET ?? 'staging',
})
// Check the client's own config, not our input: `getCliClient({dataset})`
// silently ignores the option and keeps sanity.cli.ts's production.
const {dataset} = client.config()
if (dataset !== 'staging') {
  console.error(`Refusing to write E2E fixtures to "${dataset}" — they belong in staging only.`)
  process.exit(1)
}

// Stable staging cover, the one the phase-5 seeds reuse — no upload per run.
const image = {
  _type: 'image',
  asset: {_type: 'reference', _ref: 'image-902b92c6fbed708cec758ed4f5848f0f3d848416-350x350-jpg'},
}
// In the past, so the fixtures never top the news list.
const PUBLISHED_AT = '2020-01-01T10:00:00.000Z'
const MARK = 'E2E-fixture, niet verwijderen'

const block = (key: string, text: string) => ({
  _key: key,
  _type: 'block',
  style: 'normal',
  markDefs: [],
  children: [{_key: `${key}-s`, _type: 'span', text, marks: []}],
})

type Fixture = {
  _id: string
  _type: string
  slug: {_type: 'slug'; current: string}
  [field: string]: unknown
}

const article = (type: string, extra = {}, body: unknown[] = []): Fixture => ({
  _id: `e2e-article-${type}`,
  _type: 'article',
  articleType: type,
  title: [block('title', `${MARK}: ${type}`)],
  slug: {_type: 'slug', current: `e2e-${type}`},
  lead: `Vaste testinhoud voor de E2E-suite (${type}). ${MARK}.`,
  publishedAt: PUBLISHED_AT,
  coverImage: image,
  ...extra,
  body: [...body, block('p1', `Dit artikel is een vaste E2E-fixture. ${MARK}.`)],
})

const fixtures: Fixture[] = [
  article(
    'interview',
    {
      subjects: [
        {
          _key: 'subject',
          _type: 'subject',
          kind: 'custom',
          customName: 'E2E Fixture',
          customRole: 'Testpersoon',
          customPhoto: image,
        },
      ],
    },
    [
      {
        _key: 'qa',
        _type: 'qaBlock',
        groupAtTail: false,
        pairs: [
          {
            _key: 'q1',
            _type: 'qaPair',
            question: 'Wat is dit?',
            tag: 'standard',
            respondents: [
              {
                _key: 'r1',
                _type: 'qaPairRespondent',
                respondentKey: 'subject',
                answer: [block('a1', `Een vaste E2E-fixture. ${MARK}.`)],
              },
            ],
          },
        ],
      },
    ],
  ),
  article('announcement'),
  article('transfer', {}, [
    {
      _key: 'fact',
      _type: 'transferFact',
      direction: 'incoming',
      playerName: 'E2E Fixture',
      position: 'Middenvelder',
      otherClubName: 'E2E Fixture FC',
    },
  ]),
  // 2099 dates: staging's own last future event is 2027-01-09 (#3087 §5), and
  // the event feeds only list what has not ended yet.
  article('event', {}, [{_key: 'fact', _type: 'eventFact', title: MARK, date: '2099-06-01'}]),
  {
    _id: 'e2e-event-far-future',
    _type: 'event',
    title: `${MARK}: evenement 2099`,
    slug: {_type: 'slug', current: 'e2e-event-far-future'},
    eventType: 'Clubevent',
    coverImage: {...image, alt: MARK},
    dateStart: '2099-06-01T16:00:00.000Z',
    location: 'Driesstraat 32, 1982 Elewijt',
  },
  {
    _id: 'e2e-photo-gallery',
    _type: 'photoGallery',
    title: `${MARK}: fotogalerij`,
    slug: {_type: 'slug', current: 'e2e-photo-gallery'},
    publishedAt: PUBLISHED_AT,
    images: [{...image, _key: 'img', _type: 'galleryImage', alt: MARK}],
  },
]

// `createOrReplace` bumps `_rev` even on identical content, so a document
// that already matches is skipped — a second run writes nothing at all.
const ids = fixtures.map((doc) => doc._id)
const current = await client.getDocuments(ids)
const changed = fixtures.filter((doc, i) => {
  const {_rev, _createdAt, _updatedAt, ...stored} = current[i] ?? {}
  return !isDeepStrictEqual(stored, doc)
})
// A Studio edit waits as a draft; the next Publish would undo the restore.
// ponytail: drafts only — release `versions.*` copies are not cleared.
const drafts: string[] = await client.fetch(
  '*[_id in $ids]._id',
  {ids: ids.map((id) => `drafts.${id}`)},
  {perspective: 'raw'},
)

if (changed.length === 0 && drafts.length === 0) {
  console.log(`All ${fixtures.length} fixtures in ${dataset} are up to date — nothing written.`)
} else {
  const tx = client.transaction()
  for (const doc of changed) tx.createOrReplace(doc)
  for (const id of drafts) tx.delete(id)
  const {transactionId} = await tx.commit()
  console.log(
    `Wrote ${changed.length} of ${fixtures.length} fixtures and deleted ${drafts.length} drafts in ${dataset} (transaction ${transactionId}).`,
  )
}
for (const {_id, slug} of fixtures) console.log(`  ${_id}  /${slug.current}`)
