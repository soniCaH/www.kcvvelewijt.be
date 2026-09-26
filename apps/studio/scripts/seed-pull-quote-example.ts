import {getCliClient} from 'sanity/cli'

/**
 * One example `pullQuote` article body block on staging, for visually
 * checking #2517's Studio insert menu + `<ArticleBody>` render end-to-end
 * (schema → GROQ dereference → renderer, in one real page).
 *
 * Speaker: the first staging `player` with a synced `psdId` — the same
 * condition `pullQuote.speaker`'s own reference picker filters on — picked
 * dynamically rather than a hardcoded id, since staging content changes
 * over time. The other three renderer cases this issue's AC lists
 * (photo-less staffMember → monogram, external speaker, nameless quote)
 * already have pixel-checked Storybook coverage
 * (`ArticleBody.stories.tsx` — `WithPullQuote`, `AllPullQuote`); this
 * script only needs to prove the live Studio → GROQ → render path once.
 *
 * Idempotent: fixed `_id` + `createOrReplace`, refuses any dataset but
 * `staging` — both `sanity.cli.ts` files point at production, so the
 * dataset is set here (mirrors `seed-e2e-fixtures.ts`).
 *
 * Anyone logged in to the Sanity CLI with write access to project vhb33jaz:
 *
 *   cd apps/studio
 *   npx sanity exec scripts/seed-pull-quote-example.ts --with-user-token
 *
 * Safe to delete the seeded article from Studio once the preview is
 * checked — nothing else references it.
 */

const client = getCliClient({apiVersion: '2024-01-01'}).withConfig({
  dataset: process.env.SANITY_DATASET ?? 'staging',
})
// Check the client's own config, not our input: `getCliClient({dataset})`
// silently ignores the option and keeps sanity.cli.ts's production.
const {dataset} = client.config()
if (dataset !== 'staging') {
  console.error(
    `Refusing to write the pullQuote example to "${dataset}" — it belongs in staging only.`,
  )
  process.exit(1)
}

const ARTICLE_ID = 'example-pull-quote-2517'
const MARK = '#2517-voorbeeld, mag verwijderd worden'

// Stable staging cover, the one the E2E seeds reuse — no upload per run.
const coverImage = {
  _type: 'image',
  asset: {
    _type: 'reference',
    _ref: 'image-902b92c6fbed708cec758ed4f5848f0f3d848416-350x350-jpg',
  },
}

const block = (key: string, text: string) => ({
  _key: key,
  _type: 'block',
  style: 'normal',
  markDefs: [],
  children: [{_key: `${key}-s`, _type: 'span', text, marks: []}],
})

interface StagingPlayer {
  _id: string
  firstName?: string
  lastName?: string
}

async function main() {
  const player = await client.fetch<StagingPlayer | null>(
    `*[_type == "player" && defined(psdId) && defined(firstName) && defined(lastName)] | order(_updatedAt desc) [0]{_id, firstName, lastName}`,
  )
  if (!player) {
    console.error(
      'No player with firstName/lastName + a synced psdId found on staging — cannot seed a resolvable speaker.',
    )
    process.exit(1)
  }
  console.log(`Speaker: ${player.firstName} ${player.lastName} (${player._id})`)

  const pullQuoteBlock = {
    _key: 'pq-example',
    _type: 'pullQuote',
    body: [
      {
        _key: 'pq-body',
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [
          {_key: 'pq-body-s1', _type: 'span', text: 'Dit is een ', marks: []},
          {
            _key: 'pq-body-s2',
            _type: 'span',
            text: 'voorbeeldcitaat',
            marks: ['accent'],
          },
          {
            _key: 'pq-body-s3',
            _type: 'span',
            text: ' voor #2517 — zo ziet een citaat met een echte speler als spreker eruit.',
            marks: [],
          },
        ],
      },
    ],
    speaker: {_type: 'reference', _ref: player._id},
  }

  const doc = {
    _id: ARTICLE_ID,
    _type: 'article',
    articleType: 'announcement',
    title: [block('title', MARK)],
    slug: {_type: 'slug', current: 'voorbeeld-citaat-2517'},
    lead: `Vaste voorbeeldpagina om het #2517 Citaat-blok te bekijken. ${MARK}.`,
    // In the past, so this never tops the news list.
    publishedAt: '2020-01-01T10:00:00.000Z',
    coverImage,
    body: [
      block(
        'p-intro',
        `Deze pagina bestaat enkel om het nieuwe Citaat-blok (#2517) te tonen. ${MARK}.`,
      ),
      pullQuoteBlock,
      block(
        'p-outro',
        'Verwijder dit artikel gerust vanuit de Studio nadat de preview gecheckt is.',
      ),
    ],
  }

  const result = await client.createOrReplace(doc)
  console.log(
    `Seeded ${result._id} — bekijk op staging via /nieuws/${doc.slug.current}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
