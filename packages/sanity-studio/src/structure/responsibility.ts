import type {StructureBuilder} from 'sanity/structure'

const CATEGORIES = [
  {title: 'Administratief', value: 'administratief'},
  {title: 'Medisch', value: 'medisch'},
  {title: 'Sportief', value: 'sportief'},
  {title: 'Gedrag', value: 'gedrag'},
  {title: 'Algemeen', value: 'algemeen'},
  {title: 'Commercieel', value: 'commercieel'},
] as const

/**
 * Responsibility desk structure grouped by category,
 * plus a "without contact person" filter view.
 * All labels in Dutch.
 */
export function responsibilityStructure(S: StructureBuilder) {
  return S.listItem()
    .title('Hulp & Contact')
    .child(
      S.list()
        .title('Hulp & Contact')
        .items([
          S.listItem()
            .title('📋 Alle verantwoordelijkheden')
            .child(
              S.documentTypeList('responsibility')
                .title('Alle verantwoordelijkheden')
                .defaultOrdering([{field: 'title', direction: 'asc'}]),
            ),
          S.divider(),
          ...CATEGORIES.map(({title, value}) =>
            S.listItem()
              .title(title)
              .child(
                S.documentList()
                  .title(title)
                  .filter(`_type == "responsibility" && category == "${value}"`)
                  .defaultOrdering([{field: 'title', direction: 'asc'}]),
              ),
          ),
          S.divider(),
          S.listItem()
            .title('⚠️ Zonder contactpersoon')
            .child(
              S.documentList()
                .title('Zonder contactpersoon')
                .filter(
                  '_type == "responsibility" && !defined(primaryContact.staffMember) && !defined(primaryContact.email) && !defined(primaryContact.phone)',
                )
                .defaultOrdering([{field: 'title', direction: 'asc'}]),
            ),
        ]),
    )
}
