/** A weak reference, as organigramNode.parentNode stores it. */
export function ref(id: string): {
  _type: "reference";
  _ref: string;
  _weak: true;
} {
  return { _type: "reference", _ref: id, _weak: true };
}

/** An organigramNode.members[] entry. The `_key` is the id, made key-safe. */
export function memberRef(id: string): {
  _type: "reference";
  _ref: string;
  _key: string;
} {
  return { _type: "reference", _ref: id, _key: id.replace(/[^a-z0-9-]/gi, "") };
}
