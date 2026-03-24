/** Core player fields present in both standalone and team-embedded GROQ projections */
export interface SanityPlayerBase {
  _id: string;
  psdId: string | null;
  firstName: string | null;
  lastName: string | null;
  jerseyNumber: number | null;
  keeper: boolean | null;
  positionPsd: string | null;
  position: string | null;
  psdImageUrl: string | null;
  transparentImageUrl: string | null;
}
