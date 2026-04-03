import type {StructureBuilder} from 'sanity/structure'

/**
 * Staff desk structure with 9 views.
 * All labels in Dutch.
 */
export function staffStructure(S: StructureBuilder) {
  return S.listItem()
    .title('Staff')
    .child(
      S.list()
        .title('Staff')
        .items([
          S.listItem()
            .title('📋 Alle leden')
            .child(
              S.documentList()
                .title('Alle leden')
                .filter('_type == "staffMember" && !archived')
                .defaultOrdering([{field: 'lastName', direction: 'asc'}]),
            ),
          S.listItem()
            .title('🏛️ Organigram beheer')
            .child(
              S.list()
                .title('Organigram beheer')
                .items([
                  S.listItem()
                    .title('Hoofdbestuur')
                    .child(
                      S.documentList()
                        .title('Hoofdbestuur')
                        .filter('_type == "organigramNode" && department == "hoofdbestuur"')
                        .defaultOrdering([{field: 'sortOrder', direction: 'asc'}]),
                    ),
                  S.listItem()
                    .title('Jeugdbestuur')
                    .child(
                      S.documentList()
                        .title('Jeugdbestuur')
                        .filter('_type == "organigramNode" && department == "jeugdbestuur"')
                        .defaultOrdering([{field: 'sortOrder', direction: 'asc'}]),
                    ),
                  S.listItem()
                    .title('Algemeen')
                    .child(
                      S.documentList()
                        .title('Algemeen')
                        .filter('_type == "organigramNode" && department == "algemeen"')
                        .defaultOrdering([{field: 'sortOrder', direction: 'asc'}]),
                    ),
                ]),
            ),
          S.listItem()
            .title('⚠️ Vacante posities')
            .child(
              S.documentList()
                .title('Vacante posities')
                .filter('_type == "organigramNode" && active == true && count(members) == 0')
                .defaultOrdering([{field: 'sortOrder', direction: 'asc'}]),
            ),
          S.listItem()
            .title('🔗 Niet gekoppeld aan PSD')
            .child(
              S.documentList()
                .title('Niet gekoppeld aan PSD')
                .filter('_type == "staffMember" && !defined(psdId) && !archived')
                .defaultOrdering([{field: 'lastName', direction: 'asc'}]),
            ),
          S.listItem()
            .title('📷 Geen foto')
            .child(
              S.documentList()
                .title('Geen foto')
                .filter('_type == "staffMember" && !defined(photo) && !archived')
                .defaultOrdering([{field: 'lastName', direction: 'asc'}]),
            ),
          S.listItem()
            .title('📷 In organigram maar geen foto')
            .child(
              S.documentList()
                .title('In organigram maar geen foto')
                .filter(
                  '_type == "staffMember" && !defined(photo) && !archived && _id in *[_type == "organigramNode"].members[]._ref',
                )
                .defaultOrdering([{field: 'lastName', direction: 'asc'}]),
            ),
          S.listItem()
            .title('🔄 PSD gesynchroniseerd')
            .child(
              S.documentList()
                .title('PSD gesynchroniseerd')
                .filter('_type == "staffMember" && defined(psdId) && !archived')
                .defaultOrdering([{field: 'lastName', direction: 'asc'}]),
            ),
        ]),
    )
}
