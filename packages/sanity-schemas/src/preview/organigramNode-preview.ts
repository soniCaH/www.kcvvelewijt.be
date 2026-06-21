/**
 * Sanity preview select + prepare for organigramNode.
 *
 * Subtitle shows the member count, not the member names: Sanity's preview store
 * cannot dereference array elements by numeric index (`members[0]->firstName`),
 * which stalls the whole preview subscription — leaving blank rows in lists and
 * a "New Organigram node" fallback title. Reading the raw `members` array (no
 * deref) resolves cleanly; we count it instead.
 */

export const organigramNodePreviewSelect = {
  title: 'title',
  roleCode: 'roleCode',
  members: 'members',
}

interface OrganigramNodePreviewSelection {
  title?: string
  roleCode?: string
  members?: unknown[]
}

export function prepareOrganigramNodePreview(selection: OrganigramNodePreviewSelection) {
  const {title, roleCode, members} = selection

  const count = Array.isArray(members) ? members.length : 0
  const badge = roleCode ? `[${roleCode}]` : ''

  return {
    title: [badge, title].filter(Boolean).join(' '),
    subtitle: count > 0 ? `${count} ${count === 1 ? 'lid' : 'leden'}` : 'Vacant',
  }
}
