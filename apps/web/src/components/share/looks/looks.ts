import type { ComponentType } from "react";
import { AfficheLook } from "./AfficheLook";
import { KaartLook } from "./KaartLook";
import type { LookId, LookProps } from "./look-parts";
import { PlakboekLook } from "./PlakboekLook";
import { TicketLook } from "./TicketLook";

/** The four new share looks in rotation order A → B → C → E (#3535). */
export const LOOKS: {
  id: LookId;
  name: string;
  Component: ComponentType<LookProps>;
}[] = [
  { id: "kaart", name: "Kaart", Component: KaartLook },
  { id: "plakboek", name: "Plakboek", Component: PlakboekLook },
  { id: "affiche", name: "Affiche", Component: AfficheLook },
  { id: "ticket", name: "Ticket", Component: TicketLook },
];
