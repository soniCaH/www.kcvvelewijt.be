import { Context, Effect, Layer } from "effect";
import { defineQuery } from "groq";
import type { MembershipRole } from "@kcvv/api-contract";
import { fetchGroq, type SanityReadError } from "../sanity/fetch-groq";
import type { FORM_ROUTING_CONTACTS_QUERY_RESULT } from "../sanity/sanity.types";

// ─── GROQ Query ──────────────────────────────────────────────────────────────

// Same rules as the BFF's `FORM_ROUTING_QUERY` (apps/api/src/sanity/projection.ts),
// which names the holder in the emails: an inactive box is vacant, archived and
// dangling members are skipped, and only the first live member is named. The
// card and the mails must agree.
const FORM_ROUTING_CONTACTS_QUERY =
  defineQuery(`*[_type == "formRoutingConfig"][0]{
  "speler": spelerContact->{
    "functionTitle": title,
    "holder": select(active == true => coalesce(members[defined(@->_id) && @->archived != true], [])[0]->{ firstName, lastName })
  },
  "jeugdspeler": jeugdspelerContact->{
    "functionTitle": title,
    "holder": select(active == true => coalesce(members[defined(@->_id) && @->archived != true], [])[0]->{ firstName, lastName })
  },
  "vrijwilliger": vrijwilligerContact->{
    "functionTitle": title,
    "holder": select(active == true => coalesce(members[defined(@->_id) && @->archived != true], [])[0]->{ firstName, lastName })
  },
  "trainer": trainerContact->{
    "functionTitle": title,
    "holder": select(active == true => coalesce(members[defined(@->_id) && @->archived != true], [])[0]->{ firstName, lastName })
  },
  "scheidsrechter": scheidsrechterContact->{
    "functionTitle": title,
    "holder": select(active == true => coalesce(members[defined(@->_id) && @->archived != true], [])[0]->{ firstName, lastName })
  }
}`);

// ─── Types ───────────────────────────────────────────────────────────────────

/** The box holder a confirmation names; `functionTitle` is null when the box has no title. */
export interface MembershipContact {
  // No `readonly` here: cross-page-consistency rule 10 reads every `readonly x:` as a repository method.
  name: string;
  functionTitle: string | null;
}

/** A role with no entry has no nameable holder: the card keeps today's sentence. */
export type MembershipContacts = Partial<
  Record<MembershipRole, MembershipContact>
>;

// ─── Mapping ─────────────────────────────────────────────────────────────────

const ROLES: readonly MembershipRole[] = [
  "speler",
  "jeugdspeler",
  "vrijwilliger",
  "trainer",
  "scheidsrechter",
];

// Writer Rule: a vacant box or a holder without a name yields no contact,
// never an empty name.
const toMembershipContacts = (
  data: FORM_ROUTING_CONTACTS_QUERY_RESULT,
): MembershipContacts => {
  const contacts: { -readonly [R in MembershipRole]?: MembershipContact } = {};
  for (const role of ROLES) {
    const box = data?.[role];
    const name = [box?.holder?.firstName, box?.holder?.lastName]
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(" ");
    if (name) {
      contacts[role] = {
        name,
        functionTitle: box?.functionTitle?.trim() || null,
      };
    }
  }
  return contacts;
};

// ─── Repository ──────────────────────────────────────────────────────────────

export interface FormRoutingRepositoryInterface {
  readonly getContacts: () => Effect.Effect<
    MembershipContacts,
    SanityReadError
  >;
}

export class FormRoutingRepository extends Context.Tag("FormRoutingRepository")<
  FormRoutingRepository,
  FormRoutingRepositoryInterface
>() {}

export const FormRoutingRepositoryLive = Layer.succeed(FormRoutingRepository, {
  getContacts: () =>
    fetchGroq<FORM_ROUTING_CONTACTS_QUERY_RESULT>(
      FORM_ROUTING_CONTACTS_QUERY,
    ).pipe(Effect.map(toMembershipContacts)),
});
