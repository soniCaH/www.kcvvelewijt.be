import type {ValidationContext} from 'sanity'

interface Reference {
  _type: 'reference'
  _ref: string
}

/**
 * Async validation rule for organigramNode.members[] items.
 * Returns a warning-shaped message when the referenced staffMember is
 * archived — but the MARKER LEVEL is decided entirely by the `Rule`
 * instance this validator is registered on (`Rule.warning().custom(...)`
 * in `organigramNode.ts`), never by a key on this return value. A `level`
 * key here would be silently ignored by `sanity`'s `Rule.validate()`; see
 * `banner.ts`'s image field for the full mechanism.
 */
export async function validateOrganigramMember(
  ref: Reference | undefined,
  context: ValidationContext,
): Promise<true | {message: string}> {
  if (!ref?._ref) return true

  const client = context.getClient({apiVersion: '2024-01-01'})
  const doc = await client.fetch<{archived?: boolean} | null>(
    `*[_id == $id][0]{ archived }`,
    {id: ref._ref},
  )

  if (doc?.archived === true) {
    return {
      message: 'Dit lid is gearchiveerd — controleer of deze positie nog actueel is',
    }
  }

  return true
}
