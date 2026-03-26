import { defineQuery } from "groq";

export const RESPONSIBILITY_PATHS_QUERY =
  defineQuery(`*[_type == "responsibilityPath" && active == true] | order(title asc) {
  "id": slug.current,
  "role": audience,
  question,
  keywords,
  summary,
  category,
  icon,
  "primaryContact": primaryContact {
    "role": role,
    "email": select(defined(staffMember) => staffMember->email, email),
    "phone": select(defined(staffMember) => staffMember->phone, phone),
    "department": select(defined(staffMember) => staffMember->department, department),
    "name": select(
      defined(staffMember) => staffMember->firstName + " " + staffMember->lastName,
      null
    ),
    "memberId": staffMember->_id
  },
  "steps": steps[] {
    description,
    link,
    "contact": select(defined(contact) => contact {
      "role": role,
      "email": select(defined(staffMember) => staffMember->email, email),
      "phone": select(defined(staffMember) => staffMember->phone, phone),
      "department": select(defined(staffMember) => staffMember->department, department),
      "name": select(
        defined(staffMember) => staffMember->firstName + " " + staffMember->lastName,
        null
      ),
      "memberId": staffMember->_id
    }, null)
  },
  "relatedPaths": coalesce(relatedPaths[]->slug.current, [])
}`);
