import type {StructureBuilder} from 'sanity/structure'

const NEWEST_FIRST = [{field: 'submittedAt', direction: 'desc'}] as const

const VIEWS = [
  {title: 'Alle inschrijvingen', filter: '_type == "dartsSignup"'},
  {title: 'Nog niet betaald', filter: '_type == "dartsSignup" && paid != true'},
  {title: 'Betaald', filter: '_type == "dartsSignup" && paid == true'},
  {title: 'Wachtlijst', filter: '_type == "dartsSignup" && waitlist == true'},
] as const

/**
 * EK Darts desk structure (#3812): every signup plus a view for the ones still
 * to pay, the paid ones and the wachtlijst. Labels in Dutch.
 */
export function dartsSignupStructure(S: StructureBuilder) {
  return S.listItem()
    .title('EK Darts')
    .child(
      S.list()
        .title('EK Darts')
        .items(
          VIEWS.map(({title, filter}) =>
            S.listItem()
              .title(title)
              .child(
                S.documentList()
                  .title(title)
                  .filter(filter)
                  .defaultOrdering([...NEWEST_FIRST]),
              ),
          ),
        ),
    )
}
