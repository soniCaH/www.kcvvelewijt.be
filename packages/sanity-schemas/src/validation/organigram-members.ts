import type {ValidationContext} from 'sanity'

interface Reference {
  _type: 'reference'
  _ref: string
}

/**
 * Returns a message when the referenced staffMember is archived. The
 * marker level comes from the Rule it is registered on (`Rule.warning()`
 * in organigramNode.ts), not from this return value.
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
