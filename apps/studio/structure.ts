import type {StructureResolver} from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Players')
        .child(
          S.list()
            .title('Players')
            .items([
              S.listItem()
                .title('All players')
                .child(S.documentTypeList('player').title('All players')),
              S.listItem()
                .title('Needs enrichment')
                .child(
                  S.documentList()
                    .title('Missing transparent image')
                    .filter('_type == "player" && !defined(transparentImage)')
                    .defaultOrdering([{field: 'lastName', direction: 'asc'}]),
                ),
            ]),
        ),
      S.listItem()
        .title('Teams')
        .child(S.documentTypeList('team').title('Teams')),
      S.listItem()
        .title('Staff')
        .child(
          S.list()
            .title('Staff')
            .items([
              S.listItem()
                .title('Alle leden')
                .child(
                  S.documentTypeList('staffMember')
                    .title('Alle leden')
                    .defaultOrdering([{field: 'lastName', direction: 'asc'}]),
                ),
              S.listItem()
                .title('📋 Organigram beheer')
                .child(
                  S.documentList()
                    .title('In organigram')
                    .filter('_type == "staffMember" && inOrganigram == true')
                    .defaultOrdering([{field: 'lastName', direction: 'asc'}]),
                ),
              S.listItem()
                .title('⚠️ Aanvullen vereist')
                .child(
                  S.documentList()
                    .title('Ontbrekende velden')
                    .filter(
                      '_type == "staffMember" && inOrganigram == true && (!defined(roleLabel) || !defined(photo))',
                    )
                    .defaultOrdering([{field: 'lastName', direction: 'asc'}]),
                ),
              S.listItem()
                .title('🔄 PSD gesynchroniseerd')
                .child(
                  S.documentList()
                    .title('PSD gesynchroniseerd')
                    .filter('_type == "staffMember" && defined(psdId)')
                    .defaultOrdering([{field: 'lastName', direction: 'asc'}]),
                ),
            ]),
        ),
      S.divider(),
      S.listItem()
        .title('Articles')
        .child(
          S.documentTypeList('article')
            .title('Articles')
            .defaultOrdering([{field: 'publishAt', direction: 'desc'}]),
        ),
      S.listItem()
        .title('Sponsors')
        .child(S.documentTypeList('sponsor').title('Sponsors')),
      S.listItem()
        .title('Events')
        .child(S.documentTypeList('event').title('Events')),
      S.listItem()
        .title('Pages')
        .child(S.documentTypeList('page').title('Pages')),
      S.divider(),
      S.listItem()
        .title('Banners')
        .child(S.documentTypeList('banner').title('Banners')),
      S.listItem()
        .title('Homepage')
        .child(
          S.document()
            .schemaType('homePage')
            .documentId('homePage')
            .title('Homepage configuratie'),
        ),
      S.listItem()
        .title('Jeugd landing page')
        .child(
          S.document()
            .schemaType('jeugdLandingPage')
            .documentId('jeugdLandingPage')
            .title('Jeugd landing page configuratie'),
        ),
      S.divider(),
      S.listItem()
        .title('Hulp & Contact')
        .child(
          S.documentTypeList('responsibility')
            .title('Hulp & Contact')
            .defaultOrdering([{field: 'title', direction: 'asc'}]),
        ),
      S.divider(),
      S.listItem()
        .title('📊 Feedback')
        .child(
          S.list()
            .title('Feedback')
            .items([
              S.listItem()
                .title('Alle feedback')
                .child(
                  S.documentList()
                    .title('Alle feedback')
                    .filter('_type == "searchFeedback"')
                    .defaultOrdering([{field: '_createdAt', direction: 'desc'}]),
                ),
              S.listItem()
                .title('👍 Positief')
                .child(
                  S.documentList()
                    .title('Positief')
                    .filter('_type == "searchFeedback" && vote == "up"')
                    .defaultOrdering([{field: '_createdAt', direction: 'desc'}]),
                ),
              S.listItem()
                .title('👎 Negatief')
                .child(
                  S.documentList()
                    .title('Negatief')
                    .filter('_type == "searchFeedback" && vote == "down"')
                    .defaultOrdering([{field: '_createdAt', direction: 'desc'}]),
                ),
            ]),
        ),
    ])
