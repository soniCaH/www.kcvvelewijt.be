interface AlaCarteItem {
  name: string;
  text: string;
}

// Retyped from the brochure (#3618 slice d): no price, no audience figure.
const ALA_CARTE_GROUPS: { label: string; items: AlaCarteItem[] }[] = [
  {
    label: "Op het complex",
    items: [
      {
        name: "TV Tool",
        text: "Je logo of advertentie op de 3 grote schermen boven de toog. De beelden pas je zelf aan, van thuis uit.",
      },
      {
        name: "Sponsordoek",
        text: "Een winddoorlatend full-colour doek van 2 m bij 5 m langs het A-veld, het B-veld of allebei. Zichtbaar bij elke thuismatch en training.",
      },
    ],
  },
  {
    label: "Op de shirts",
    items: [
      {
        name: "Uitgaanstraining",
        text: "Je logo op de trainings- en uitgaanskledij van onze jeugdspelers en hun trainers en afgevaardigden.",
      },
      {
        name: "Wedstrijduitrusting jeugd",
        text: "Je logo op de wedstrijduitrusting van elke jeugdploeg, van U6 tot U17.",
      },
      {
        name: "Wedstrijduitrusting senior",
        text: "De vaste thuis- en uitshirts van het A-elftal, het B-elftal en de U21.",
      },
    ],
  },
  {
    label: "Online",
    items: [
      {
        name: "Sponsored posts",
        text: "12 maandelijkse posts op de Facebook en Instagram van de club.",
      },
    ],
  },
  {
    label: "Eenmalig",
    items: [
      {
        name: "Matchbal",
        text: "Een aankondiging op de site en op de kantineschermen, plus de aftrap.",
      },
      {
        name: "Onderleggers",
        text: "Je logo op de onderleggers in het steakrestaurant, op het mosselfestijn, de VIP-lunches en dergelijke.",
      },
    ],
  },
];

/**
 * "Of kies apart": the loose packages under their group labels. Each label sits
 * above its rows, and the rows pack tight in two columns on desktop. Its own
 * piece so its story can VR-cover what sits below the first screen.
 */
export const ALaCarteList = () => (
  <>
    <h3 className="font-display text-ink mt-12 mb-6 text-2xl font-bold">
      Of kies apart
    </h3>
    <div className="flex flex-col gap-8">
      {ALA_CARTE_GROUPS.map(({ label, items }) => (
        <section key={label}>
          <h4 className="text-ink-muted border-paper-edge text-label mb-4 border-b pb-1.5 font-mono uppercase">
            {label}
          </h4>
          <dl className="grid gap-x-10 gap-y-5 md:grid-cols-2">
            {items.map(({ name, text }) => (
              <div key={name}>
                <dt className="font-display text-ink text-lg font-bold">
                  {name}
                </dt>
                <dd className="text-ink text-body-sm mt-1">{text}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  </>
);
