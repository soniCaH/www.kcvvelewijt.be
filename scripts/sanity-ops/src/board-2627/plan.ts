/**
 * The 2026-2027 board update (#3184): who holds which organigram position,
 * and the help-topic texts that name a renamed position.
 *
 * Source: the club's "KCVV-Elewijt mgmt - 2627" spreadsheet, with the owner's
 * corrections on the issue. Mark Buelens is still in that sheet but left the
 * club years ago — he is deliberately in no list below. Youth roles with nobody
 * assigned (scheidsrechter, tornooien, evenementen vrijdag) run "via beurtrol",
 * so no position is invented for them.
 *
 * Every member list is the position's complete new list, not a delta, so a
 * re-run writes the same thing again.
 */

/** Every person this plan places, with the name the id must still belong to. */
export const STAFF: Record<string, string> = {
  "staffMember-psd-245": "Kevin Van Ransbeeck",
  "staffMember-psd-823": "Paul Vanhamme",
  "staffMember-psd-824": "Koen Van Loock",
  "staffMember-psd-248": "Stefan Robberechts",
  "staffMember-psd-821": "Ilona Trouwkens",
  "staffMember-psd-3260": "Mark Talbut",
  "staffMember-psd-825": "Werner Sanfrinnon",
  "staffMember-psd-261": "Erik Talboom",
  "staffMember-psd-8946": "Matthias Knevels",
  "staffMember-psd-257": "Stefan De Wael",
  "staffMember-psd-774": "Christian Nobels",
  "staffMember-psd-8576": "Kevin Schutijser",
  "staffMember-psd-4301": "Sam Lesage",
  "staffMember-psd-6530": "Tim Ooghe",
  "staffMember-psd-12849": "Isabelle Sterckx",
  "staffMember-psd-2094": "Bram Van Zegbroeck",
  "staffMember-psd-11278": "Mike Meuwis",
  "staffMember-psd-12848": "Sofie Demeyer",
  "staffMember-psd-10228": "Shauni Hellemans",
  "staffMember-psd-6588": "Tim Moens",
  "staffMember-psd-12830": "Frank Dirix",
  "staffMember-psd-6451": "Joachim Benfeld",
  "staffMember-psd-12985": "Timothy Matyn",
  "staffMember-psd-817": "Louie Verhaegen",
  "staffMember-manual-maarten-laermans": "Maarten Laermans",
};

/** People with no PSD record yet. Same shape as the existing manual records. */
export const STAFF_CREATES = [
  {
    _id: "staffMember-manual-maarten-laermans",
    _type: "staffMember",
    firstName: "Maarten",
    lastName: "Laermans",
    archived: false,
  },
];

export interface NodeUpdate {
  id: string;
  members: string[];
  title?: string;
  active?: boolean;
}

export const NODE_UPDATES: NodeUpdate[] = [
  // Hoofdbestuur. Bestuursorgaan holds the members without a board position
  // of their own.
  { id: "organigramNode-secretaris", members: ["staffMember-psd-823"] },
  { id: "organigramNode-penningmeester", members: ["staffMember-psd-824"] },
  {
    id: "organigramNode-gerechtelijk-correspondent",
    members: ["staffMember-psd-245", "staffMember-psd-823"],
  },
  {
    id: "organigramNode-bestuursorgaan",
    members: [
      "staffMember-psd-248",
      "staffMember-psd-821",
      "staffMember-psd-3260",
      "staffMember-psd-825",
      "staffMember-psd-261",
      "staffMember-psd-8946",
      "staffMember-psd-257",
      "staffMember-psd-774",
      "staffMember-psd-8576",
      "staffMember-psd-4301",
    ],
  },

  // Jeugdbestuur. Three positions are renamed because their second half moved
  // to someone else; the ids stay, so every reference to them keeps working.
  {
    id: "organigramNode-jeugdsecretaris",
    title: "Jeugdsecretaris",
    members: ["staffMember-psd-6530"],
  },
  { id: "organigramNode-interne-scheidsrechters", active: false, members: [] },
  {
    id: "organigramNode-materiaal-kantinedienst-wedstrijden",
    title: "Materiaal",
    members: ["staffMember-psd-12848"],
  },
  {
    id: "organigramNode-kantinedienst-trainingen",
    title: "Kantinedienst",
    members: ["staffMember-psd-10228"],
  },
  {
    id: "organigramNode-gdpr-materiaal",
    title: "GDPR",
    members: ["staffMember-psd-10228"],
  },
  {
    id: "organigramNode-lid-jeugdbestuur",
    members: ["staffMember-psd-8576", "staffMember-psd-6588"],
  },

  // Algemeen
  {
    id: "organigramNode-kledij",
    members: ["staffMember-psd-774", "staffMember-psd-11278"],
  },
  { id: "organigramNode-t1-a-elftal", members: ["staffMember-psd-12830"] },
  {
    id: "organigramNode-keeperstrainer-jeugd",
    members: ["staffMember-psd-817"],
  },
  {
    id: "organigramNode-kinesist",
    members: ["staffMember-manual-maarten-laermans"],
  },
  {
    id: "organigramNode-infrastructuur",
    members: ["staffMember-psd-261", "staffMember-psd-248"],
  },
];

export interface NodeCreate {
  _id: string;
  title: string;
  roleCode: string;
  department: "hoofdbestuur" | "jeugdbestuur" | "algemeen";
  parent: string;
  sortOrder: number;
  members: string[];
}

export const NODE_CREATES: NodeCreate[] = [
  {
    _id: "organigramNode-aanspreekpunt-afgevaardigden",
    title: "Aanspreekpunt Afgevaardigden",
    roleCode: "AFG",
    department: "jeugdbestuur",
    parent: "organigramNode-jeugdvoorzitter",
    sortOrder: 30,
    members: ["staffMember-psd-12849"],
  },
  {
    _id: "organigramNode-stages-tornooien",
    title: "Stages & Tornooien",
    roleCode: "STA",
    department: "jeugdbestuur",
    parent: "organigramNode-jeugdvoorzitter",
    sortOrder: 35,
    members: ["staffMember-psd-2094", "staffMember-psd-11278"],
  },
  {
    _id: "organigramNode-t2-a-elftal",
    title: "T2 A-elftal",
    roleCode: "T2-A",
    department: "algemeen",
    parent: "organigramNode-sportief-verantwoordelijke",
    sortOrder: 65,
    members: ["staffMember-psd-6451"],
  },
  {
    _id: "organigramNode-t2-b-elftal",
    title: "T2 B-elftal",
    roleCode: "T2-B",
    department: "algemeen",
    parent: "organigramNode-sportief-verantwoordelijke",
    sortOrder: 75,
    members: ["staffMember-psd-4301"],
  },
  {
    _id: "organigramNode-doorstroom-b-elftal",
    title: "Doorstroom B-elftal",
    roleCode: "DS-B",
    department: "algemeen",
    parent: "organigramNode-sportief-verantwoordelijke",
    sortOrder: 76,
    members: ["staffMember-psd-12985"],
  },
  {
    _id: "organigramNode-postformatie",
    title: "Postformatie",
    roleCode: "POST",
    department: "algemeen",
    parent: "organigramNode-sportief-verantwoordelijke",
    sortOrder: 77,
    members: ["staffMember-psd-817"],
  },
];

interface Change {
  from: string;
  to: string;
}

export interface TopicUpdate {
  id: string;
  primaryRef?: Change;
  summary?: Change;
  /** Step `_key` → its description. */
  steps?: Record<string, Change>;
}

const STEP = "neem-contact-op-met-";

export const TOPIC_UPDATES: TopicUpdate[] = [
  {
    id: "responsibility-kantinedienst-trainingen",
    summary: {
      from: "Neem contact op met de verantwoordelijke Kantinedienst Trainingen.",
      to: "Neem contact op met de verantwoordelijke Kantinedienst.",
    },
    steps: {
      [STEP]: {
        from: "Neem contact op met de verantwoordelijke Kantinedienst Trainingen",
        to: "Neem contact op met de verantwoordelijke Kantinedienst",
      },
    },
  },
  {
    id: "responsibility-kantinedienst-wedstrijden",
    primaryRef: {
      from: "organigramNode-materiaal-kantinedienst-wedstrijden",
      to: "organigramNode-kantinedienst-trainingen",
    },
    summary: {
      from: "Neem contact op met de verantwoordelijke Materiaal & Kantinedienst Wedstrijden.",
      to: "Neem contact op met de verantwoordelijke Kantinedienst.",
    },
    steps: {
      [STEP]: {
        from: "Neem contact op met de verantwoordelijke Materiaal & Kantinedienst Wedstrijden",
        to: "Neem contact op met de verantwoordelijke Kantinedienst",
      },
    },
  },
  {
    id: "responsibility-vragen-als-afgevaardigde",
    primaryRef: {
      from: "organigramNode-jeugdsecretaris",
      to: "organigramNode-aanspreekpunt-afgevaardigden",
    },
    summary: {
      from: "Neem als afgevaardigde contact op met de Jeugdsecretaris voor al je vragen rond wedstrijdadministratie.",
      to: "Neem als afgevaardigde contact op met het Aanspreekpunt Afgevaardigden voor al je vragen rond wedstrijdadministratie.",
    },
    steps: {
      [STEP]: {
        from: "Neem contact op met de Jeugdsecretaris voor vragen rond wedstrijdbladen, scheidsrechters en afgevaardigdentaken",
        to: "Neem contact op met het Aanspreekpunt Afgevaardigden voor vragen rond wedstrijdbladen, scheidsrechters en afgevaardigdentaken",
      },
    },
  },
];

/** What the dataset holds right now, as far as this plan cares. */
export interface Snapshot {
  staff: Record<string, { name: string; archived?: boolean }>;
  nodes: Record<string, { title: string }>;
  topics: Record<
    string,
    {
      primaryRef?: string;
      summary?: string;
      steps: Record<string, string | undefined>;
    }
  >;
  /** Draft ids of any document this plan writes. */
  drafts: string[];
}

/** Every id this plan writes, for the draft check. */
export const TOUCHED_IDS = [
  ...STAFF_CREATES.map((s) => s._id),
  ...NODE_UPDATES.map((n) => n.id),
  ...NODE_CREATES.map((n) => n._id),
  ...TOPIC_UPDATES.map((t) => t.id),
];

/**
 * Reasons not to write, or an empty list. Accepts both the before and the
 * after state, so a re-run after a successful run passes; anything else — a
 * reused id, an edited text — stops the run instead of being overwritten.
 */
export function preflight(snap: Snapshot): string[] {
  const errors: string[] = [];
  const created = new Set(STAFF_CREATES.map((s) => s._id));

  for (const draft of snap.drafts) {
    errors.push(`${draft} exists — publish or discard it in Studio first`);
  }

  for (const [id, expected] of Object.entries(STAFF)) {
    const found = snap.staff[id];
    if (!found) {
      if (!created.has(id)) errors.push(`${id} (${expected}) does not exist`);
    } else if (found.name !== expected) {
      errors.push(`${id} is "${found.name}", expected "${expected}"`);
    } else if (found.archived) {
      errors.push(`${id} (${expected}) is archived`);
    }
  }

  for (const n of NODE_UPDATES) {
    if (!snap.nodes[n.id]) errors.push(`${n.id} does not exist`);
  }

  for (const t of TOPIC_UPDATES) {
    const current = snap.topics[t.id];
    if (!current) {
      errors.push(`${t.id} does not exist`);
      continue;
    }
    const check = (
      field: string,
      value: string | undefined,
      change: Change,
    ) => {
      if (value !== change.from && value !== change.to) {
        errors.push(
          `${t.id} ${field} is "${value}", expected the old or the new text`,
        );
      }
    };
    if (t.primaryRef) check("primaryContact", current.primaryRef, t.primaryRef);
    if (t.summary) check("summary", current.summary, t.summary);
    for (const [key, change] of Object.entries(t.steps ?? {})) {
      check(`step ${key}`, current.steps[key], change);
    }
  }

  return errors;
}
