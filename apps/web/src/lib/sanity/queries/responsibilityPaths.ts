/**
 * Projects a contact object from Sanity, merging staffMember reference data
 * with inline fallback fields. staffMember data takes precedence.
 */
const CONTACT_PROJECTION = `{
  "role": role,
  "email": select(defined(staffMember) => staffMember->email, email),
  "phone": select(defined(staffMember) => staffMember->phone, phone),
  "department": department,
  "name": select(
    defined(staffMember),
    staffMember->firstName + " " + staffMember->lastName,
    null
  )
}`;

export const RESPONSIBILITY_PATHS_QUERY = `*[_type == "responsibilityPath" && active == true] | order(title asc) {
  "id": slug.current,
  "role": audience,
  question,
  keywords,
  summary,
  category,
  icon,
  "primaryContact": primaryContact ${CONTACT_PROJECTION},
  "steps": steps[] {
    description,
    link,
    "contact": select(defined(contact), contact ${CONTACT_PROJECTION}, null)
  },
  "relatedPaths": relatedPaths[]->slug.current
}`;
