/**
 * Fetches all staffMember documents marked for the organigram, ordered by last name.
 * Only documents with inOrganigram == true are returned.
 */
export const STAFF_MEMBERS_QUERY = `*[_type == "staffMember" && inOrganigram == true] | order(lastName asc) {
  _id,
  firstName,
  lastName,
  positionTitle,
  positionShort,
  department,
  email,
  phone,
  "photoUrl": photo.asset->url,
  responsibilities,
  "parentId": parentMember->_id
}`;
