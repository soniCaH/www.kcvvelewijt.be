import {defineStructure} from 'sanity/structure'

export const structure = defineStructure((S) =>
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
        .child(S.documentTypeList('staffMember').title('Staff')),
      S.divider(),
      S.listItem()
        .title('Articles')
        .child(S.documentTypeList('article').title('Articles')),
      S.listItem()
        .title('Sponsors')
        .child(S.documentTypeList('sponsor').title('Sponsors')),
      S.listItem()
        .title('Events')
        .child(S.documentTypeList('event').title('Events')),
      S.listItem()
        .title('Pages')
        .child(S.documentTypeList('page').title('Pages')),
    ]),
)
