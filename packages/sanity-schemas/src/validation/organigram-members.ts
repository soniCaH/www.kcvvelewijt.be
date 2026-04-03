import type {ValidationContext} from 'sanity'

interface Reference {
  _type: 'reference'
  _ref: string
}

/**
 * Async validation rule for organigramNode.members[] items.
 * Returns a warning when the referenced staffMember is archived.
 */
export async function validateOrganigramMember(
  ref: Reference | undefined,
  context: ValidationContext,
): Promise<true | {level: 'warning'; message: string}> {
  if (!ref?._ref) return true

  const client = context.getClient({apiVersion: '2024-01-01'})
  const doc = await client.fetch<{archived?: boolean} | null>(
    `*[_id == $id][0]{ archived }`,
    {id: ref._ref},
  )

  if (doc?.archived === true) {
    return {
      level: 'warning',
      message: 'Dit lid is gearchiveerd — controleer of deze positie nog actueel is',
    }
  }

  return true
}
