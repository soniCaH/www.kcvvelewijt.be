import type {StructureBuilder} from 'sanity/structure'

const STATUSES = [
  {title: '🆕 Nieuw', value: 'new'},
  {title: '📞 Gecontacteerd', value: 'contacted'},
  {title: '✅ Goedgekeurd', value: 'approved'},
  {title: '❌ Afgewezen', value: 'rejected'},
] as const

const NEWEST_FIRST = [{field: 'submittedAt', direction: 'desc'}] as const

/**
 * Interesse desk structure: all applications plus one filter view per
 * status. Mirrors the feedback section's filter-chip pattern. Labels in Dutch.
 */
export function membershipApplicationStructure(S: StructureBuilder) {
  return S.listItem()
    .title('📨 Interesse')
    .child(
      S.list()
        .title('Interesse')
        .items([
          S.listItem()
            .title('Alle interesseaanvragen')
            .child(
              S.documentList()
                .title('Alle interesseaanvragen')
                .filter('_type == "membershipApplication"')
                .defaultOrdering([...NEWEST_FIRST]),
            ),
          S.divider(),
          ...STATUSES.map(({title, value}) =>
            S.listItem()
              .title(title)
              .child(
                S.documentList()
                  .title(title)
                  .filter('_type == "membershipApplication" && status == $status')
                  .params({status: value})
                  .defaultOrdering([...NEWEST_FIRST]),
              ),
          ),
        ]),
    )
}
