export interface PlayerImageState {
  psdImageUrl: string | null;
  hasPsdImage: boolean;
}

/** Same shape as PlayerImageState, kept as its own name — mirrors SanityStaffDoc
 * vs SanityPlayerDoc staying separate types even though today's fields match. */
export interface StaffImageState {
  psdImageUrl: string | null;
  hasPsdImage: boolean;
}
