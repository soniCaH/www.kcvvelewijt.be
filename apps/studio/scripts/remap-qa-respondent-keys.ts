import {getCliClient} from 'sanity/cli'

/**
 * One-off remap: `qaPairRespondent.respondentKey` should hold the `_key` of an
 * `article.subjects[]` entry, but while the RespondentPicker graft was broken
 * editors typed a free-text NAME instead ("Julien", "Niels"). This resolves
 * each interview's subjects to their names and rewrites any name-valued
 * respondentKey to the matching subject's `_key`, so the frontend renders
 * attribution without re-opening every Q&A block.
 *
 * Dry-run by default (prints planned changes). Set APPLY=1 to write.
 *
 *   cd apps/studio
 *   npx sanity exec scripts/remap-qa-respondent-keys.ts --with-user-token            # preview
 *   APPLY=1 npx sanity exec scripts/remap-qa-respondent-keys.ts --with-user-token    # write
 *
 * Targets the dataset in sanity.cli.ts (production). Idempotent: a respondentKey
 * that already equals a real subject `_key` is left untouched.
 */

const apply = process.env.APPLY === '1'
const client = getCliClient()

type Person = {firstName?: string; lastName?: string} | null
interface Subject {
  _key: string
  kind?: string
  customName?: string
  player?: Person
  staff?: Person
}
interface Respondent {
  _key?: string
  respondentKey?: string
}
interface Pair {
  _key?: string
  respondents?: Respondent[]
}
interface Block {
  _key?: string
  pairs?: Pair[]
}
interface Article {
  _id: string
  title: string
  subjects?: Subject[]
  body?: Block[]
}

const norm = (s: string): string => s.trim().toLowerCase()

/** Every name an editor might have typed for a subject (first / last / full). */
function nameKeysFor(s: Subject): string[] {
  const out: string[] = []
  if (s.kind === 'custom' && s.customName) out.push(s.customName)
  const person = s.kind === 'staff' ? s.staff : s.player
  const first = person?.firstName?.trim()
  const last = person?.lastName?.trim()
  if (first) out.push(first)
  if (last) out.push(last)
  if (first && last) out.push(`${first} ${last}`)
  return out.map(norm)
}

async function main(): Promise<void> {
  const articles: Article[] = await client.fetch(
    `*[_type == "article" && articleType == "interview" && defined(subjects)]{
      _id,
      "title": coalesce(pt::text(title), title, _id),
      subjects[]{
        _key, kind, customName,
        "player": playerRef->{firstName, lastName},
        "staff": staffRef->{firstName, lastName}
      },
      "body": body[_type == "qaBlock"]{
        _key,
        pairs[]{ _key, respondents[]{ _key, respondentKey } }
      }
    }`,
  )

  let articlesPatched = 0
  let fieldsRemapped = 0

  for (const article of articles) {
    const subjects = article.subjects ?? []
    if (subjects.length === 0) continue

    const validKeys = new Set(subjects.map((s) => s._key))
    const nameToKey = new Map<string, string>()
    const ambiguous = new Set<string>()
    for (const s of subjects) {
      for (const nk of nameKeysFor(s)) {
        const existing = nameToKey.get(nk)
        if (existing && existing !== s._key) ambiguous.add(nk)
        else nameToKey.set(nk, s._key)
      }
    }

    const patch = client.patch(article._id)
    const changes: string[] = []
    for (const block of article.body ?? []) {
      for (const pair of block.pairs ?? []) {
        for (const r of pair.respondents ?? []) {
          const v = r.respondentKey
          // Skip empty, already-a-real-_key, or missing array _key (can't path to it).
          if (!v || validKeys.has(v)) continue
          if (!block._key || !pair._key || !r._key) {
            console.warn(`  ! missing _key in "${article.title}" — skipped one respondent`)
            continue
          }
          const nk = norm(v)
          if (ambiguous.has(nk)) {
            console.warn(`  ! "${v}" is ambiguous in "${article.title}" — skipped`)
            continue
          }
          const target = nameToKey.get(nk)
          if (!target) {
            console.warn(`  ? "${v}" matches no subject in "${article.title}" — skipped`)
            continue
          }
          const path = `body[_key=="${block._key}"].pairs[_key=="${pair._key}"].respondents[_key=="${r._key}"].respondentKey`
          patch.set({[path]: target})
          changes.push(`    "${v}" -> ${target}`)
        }
      }
    }

    if (changes.length > 0) {
      console.log(`\n${article.title} (${article._id})`)
      console.log(changes.join('\n'))
      fieldsRemapped += changes.length
      if (apply) {
        await patch.commit()
        articlesPatched++
      }
    }
  }

  console.log(
    apply
      ? `\nApplied: ${fieldsRemapped} field(s) across ${articlesPatched} article(s).`
      : `\nDry run: ${fieldsRemapped} field(s) would change. Set APPLY=1 to write.`,
  )
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
