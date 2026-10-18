/**
 * Organigram role codes (`organigramNode.roleCode`) that both apps read
 * (#3420): the website's `/hulp` team card shows these boxes, and the
 * worker's weekly staff-gaps nudge reports them when empty. Plain constants,
 * not schemas — they live here because this is the one package both depend on.
 */

/** The box that coordinates each youth band. */
export const YOUTH_COORDINATOR_ROLE_CODES = {
  Onderbouw: "JC-OB",
  Middenbouw: "JC-MB",
  Bovenbouw: "JC-BB",
} as const;

/** Technisch verantwoordelijke jeugdopleiding — the box for all youth. */
export const TVJO_ROLE_CODE = "TVJO";
