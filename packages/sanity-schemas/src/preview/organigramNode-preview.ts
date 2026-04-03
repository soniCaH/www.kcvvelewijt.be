/**
 * Sanity preview select + prepare for organigramNode.
 * Selects up to 3 members' names via `members[N]->firstName/lastName`.
 */

const MAX_MEMBERS = 3

export const organigramNodePreviewSelect: Record<string, string> = {
  title: 'title',
  roleCode: 'roleCode',
  member0FirstName: 'members[0]->firstName',
  member0LastName: 'members[0]->lastName',
  member1FirstName: 'members[1]->firstName',
  member1LastName: 'members[1]->lastName',
  member2FirstName: 'members[2]->firstName',
  member2LastName: 'members[2]->lastName',
}

interface OrganigramNodePreviewSelection {
  title?: string
  roleCode?: string
  [key: string]: string | undefined
}

export function prepareOrganigramNodePreview(selection: OrganigramNodePreviewSelection) {
  const {title, roleCode} = selection

  const names: string[] = []
  for (let i = 0; i < MAX_MEMBERS; i++) {
    const first = selection[`member${i}FirstName`]
    const last = selection[`member${i}LastName`]
    const name = [first, last].filter(Boolean).join(' ')
    if (name) names.push(name)
  }

  const badge = roleCode ? `[${roleCode}]` : ''
  return {
    title: [badge, title].filter(Boolean).join(' '),
    subtitle: names.length > 0 ? names.join(', ') : 'Vacant',
  }
}
