import Image from "next/image";
import { PageViewTracker } from "@/components/analytics";
import { StripedSeam } from "@/components/design-system/StripedSeam";
import {
  HeritageHero,
  TimelineImage,
  TimelineItem,
  TimelineSection,
} from "./HistoryTimeline";
import { TimelineReveal } from "./TimelineReveal";
import {
  HISTORY_52_53,
  HISTORY_58_59,
  HISTORY_63_64,
  HISTORY_FUSIE,
  HISTORY_BVB,
  HISTORY_2018,
  HISTORY_2022,
  HISTORY_24_25,
} from "@/lib/sanity/images";

const PHOTO_SIZES = "(min-width: 768px) 640px, 100vw";

function TimelineContent() {
  return (
    <div className="mx-auto max-w-5xl px-4 md:px-10">
      {/* 1909 - 1941 */}
      <TimelineSection>
        <TimelineItem date="1909 - 1935" side="left">
          <p>
            De Elewijtse voetbalgeschiedenis gaat volgens de overleveringen
            terug tot de jaren 1909-1910. Een vaste clubnaam was er voorlopig
            niet, doch de jongens speelden in witte truien, waarin over de
            schouder een rode band was gewerkt, dus &quot;Wit en Rood&quot; met
            zwarte broek. Vanuit deze periode dateert ook de eerste vermelding
            in de krant ter ere van de inhuldiging van burgemeester Nauwelaerts
            op 04/07/1911: &quot;Van Campenhout hield de toespraak namens de
            Jonge Footbalclub&quot; (Nieuwsblad 5/7/1911). In die tijd waren er
            nog geen kampioenschappen zoals we ze heden kennen. Het waren enkel
            vrienden- en bekerwedstrijden die betwist werden. Om hun
            verplaatsingskosten (verre afstanden) te dekken, speelden ze zelf
            toneel &quot;In den Prins&quot; onder leiding van E.H. Langendries;
            destijds onderpastoor in de Elewijtse parochie. De wereldoorlog
            &apos;14-&apos;18 brak uit en haast alle spelers moesten soldaat
            worden en meteen werd ook de voetbalsport tijdelijk opgedoekt.
          </p>
        </TimelineItem>

        <TimelineItem date="Eerste wereldoorlog" side="right">
          <p>
            Na de oorlog van &apos;14-&apos;18 werd er opnieuw een club
            opgericht die de naam meekreeg van FC Leopold Elewijt. Het waren
            niet allen meer dezelfde spelers van voor de oorlog, maar wel een
            groot deel van de jongere generatie. Ook speelden ze niet meer in de
            &quot;Wit-Rood&quot; kleuren (omdat er niets meer van overbleef) en
            moesten ze uitzien naar een ander speelveld. Nu speelden ze met de
            kleuren &quot;Geel en Rood&quot; en verhuisden ze richting
            &quot;Koffer&quot;, tussen de Kastanjedreef en de Steenbergstraat.
            Voor niet lang echter, want ze kregen last en moeilijkheden met
            sommige eigenaars om en rond het plein. Opnieuw dienden ze uit te
            zien naar een ander speelveld en zo belandden ze achter
            &quot;Koffer&quot;, waar ze meteen hun lokaal vestigden. Na zekere
            tijd moest het speelveld opnieuw verlaten worden; voor de derde maal
            werd er verhuisd en de ploeg kwam dichter bij het dorp spelen. Zij
            namen het terrein in bezit dat jaren door SK Elewijt (Groen-Wit)
            gebruikt werd aan de Voetbalstraat (huidige Sweynbeerstraat).
          </p>
        </TimelineItem>

        <TimelineItem date='De "Leopold"' side="left">
          <p>
            De &quot;Leopold&quot; heeft vele mooie dagen gekend als ploeg
            aangesloten in de Vlaamse Voetbalbond. Er werd vooral gespeeld tegen
            clubs als &quot;Albert&quot; Hofstade en Superior Bonheiden. De
            ploeg was ook één seizoen aangesloten bij de Belgische voetbalbond
            in het seizoen 1927-1928; de club kreeg stamnummer 1037 en sloot
            zich aan onder de naam Voetbal Club Léopold Elewyt. In dat seizoen
            belandde Léopold Elewijt op een verdienstelijke derde plaats na een
            seizoen met 4 overwinningen; 4 gelijke spelen; en 4 verloren
            wedstrijden.
          </p>
        </TimelineItem>

        <TimelineItem date="Onenigheid" side="right">
          <p>
            Na zekere tijd liep het echter niet meer zo gesmeerd in de rangen
            van de Leopold. Er begon onenigheid te heersen, de
            kameraadschapsbanden waren niet meer zo hecht en het onvermijdelijke
            werd vrij vlug werkelijkheid: de &quot;Leopold&quot; werd ontbonden.
            Al het materiaal, de bekers en de trofeeën werden onderling verdeeld
            of verloot onder hen die tot het bittere einde aan dek waren
            gebleven. Het terrein werd omgeploegd, de doelen in stukken gezaagd,
            en het was amen en uit met de Elewijtse voetbalsport.
          </p>
        </TimelineItem>

        <TimelineItem date="1935" side="left">
          <p>
            Na een aantal jaren zonder voetbalclub ontstonden er in 1935 twee
            nieuwe clubs, volledig onafhankelijk van mekaar. Het steeds groter
            wordend aantal spelers – teveel voor één ploeg – lag aan de basis
            van een onenigheid in de ploeg en leidde in een minimum van tijd tot
            een onafwendbare scheuring.
          </p>
        </TimelineItem>

        <TimelineItem date="Sportkring Elewijt" side="right">
          <p>
            Zo kregen we enerzijds Sportkring Elewijt (stamnummer 2415), met
            groen-witte truien en witte broek. Het lokaal werd gevestigd bij
            Flor Van der Meulen en hun speelveld werd dat waar voorheen de
            &quot;Leopold&quot; had gespeeld, in de Voetbalstraat (nu
            Sweynbeerstraat). Vanaf seizoen 1962-1963 verhuisde SK Elewijt naar
            de locatie aan de Driesstraat; destijds
            &quot;Terwilgen-stadion&quot; genoemd.
          </p>
        </TimelineItem>

        <TimelineItem date="FC Elewijt" side="left">
          <p>
            De andere club kreeg de naam FC Elewijt (stamnummer 2416) met als
            kleuren rood en geel, met zwarte broek (de kleuren dus van de
            &quot;Leopold&quot;). Hun lokaal werd de &quot;Vuurmolen&quot; bij
            Bertrand Van Poeyer terwijl een speelveld werd aangelegd op het
            Zwijnbeer, waar nu de scoutslokalen staan. Na de tweede wereldoorlog
            zou FC Elewijt verhuizen naar het terrein aan de Kastanjedreef
            (tussendoor werd ook nog een tijdje aan de Vekestraat gespeeld).
          </p>
        </TimelineItem>

        <TimelineItem date="Eerste fusiegeruchten" side="right">
          <p>
            Twee clubs in zo&apos;n klein dorp, dat is moeilijk te houden, en zo
            deden reeds zeer snel de geruchten de ronde over een mogelijke fusie
            van beide ploegen. Eén punt werd fel betwist en kon niet worden
            bijgelegd, namelijk de vestiging van het clublokaal. Hiervoor kwam
            geen oplossing en beide Elewijtse clubs bleven bijgevolg
            afzonderlijk hun verdere gang gaan.
          </p>
        </TimelineItem>

        <TimelineItem date="Rivaliteit" side="left">
          <p>
            De rivaliteit tussen de twee Elewijtse clubs was zo groot dat de ene
            voor de andere niet wou onderdoen. Geen van beide ploegen slaagde er
            echter in de titel te behalen. Financiële en andere zorgen kwamen
            hier stokken in de wielen steken. Wel werden nog flinke resultaten
            geboekt, doch verder dan de derde afdeling kwam geen van beide. Tot
            de sport eens temeer werd lamgelegd door de mobilisatie in 1939. Er
            werd nog wel gevoetbald, maar de meeste spelers waren onder de
            wapens geroepen en konden niet elke week verlof of vergunning
            krijgen om in eigen ploeg of gemeente aan voetbal te komen doen. De
            tweede wereldoorlog brak los en dan was &apos;t weer uit met de
            voetbalsport in ons dorp, en ook elders.
          </p>
        </TimelineItem>

        <TimelineItem date="Tweede wereldoorlog" side="right">
          <p>
            Na de oorlog duurde het wel enige tijd eer alle jongens terug waren.
            SK zag de meeste van zijn spelers terug thuiskomen en zij konden
            vrij vlug hun activiteiten hernemen. Bij FC was dit niet het geval
            en dat seizoen was het niet meer mogelijk nog aan te treden. Zo
            zagen we dat enkele spelers van rood-geel een seizoen de groen-witte
            kleuren hielpen verdedigen in een noodcompetitie die door de KBVB
            werd ingericht in het voorjaar 1941. En wat ze tot hiertoe nog nooit
            vermochten gebeurde toen: dit Elewijts noodelftal wist op prachtige
            wijze de titel in de wacht te slepen!
          </p>
        </TimelineItem>

        <TimelineItem date="1941" side="left">
          <p>
            In de daaropvolgende jaren speelden SK Elewijt en FC Elewijt in
            tweede en derde provinciale; regelmatig in dezelfde reeks.
            Hoogtepunten voor SK Elewijt waren verschillende titels in derde
            provinciale: 1941-1942; 1952-1953; 1958-1959 (waardoor er in
            1959-1960 voor het eerst een derby SK-FC Elewijt was in tweede
            provinciale); en een vierde plaats in tweede provinciale in
            1962-1963.
          </p>
        </TimelineItem>
      </TimelineSection>

      {/* Image: SK Elewijt kampioen 52-53 */}
      <TimelineImage
        caption={
          <>
            <span className="font-semibold not-italic">
              Figuur 1: SK Elewijt kampioen 52-53
            </span>
            <br />
            Boven: Labiau - Maurits Janssens - Maurits De Laet - Wannes Lepage -
            Julien Patry - Djois (Jean Peeters) - Felix Vandervorst (bijnaam
            Feke Van Den Asse) - Pierre Geerens
            <br />
            Onder: Coosemans - David Vandermeulen - Lucien Coppens - Gust
            Coppens - Warre Van Herck - Omer Lesage Felix De Koninck
          </>
        }
      >
        <Image
          src={HISTORY_52_53}
          alt="SK Elewijt kampioen 52-53"
          fill
          sizes={PHOTO_SIZES}
          className="object-contain"
        />
      </TimelineImage>

      {/* Image: SK Elewijt kampioen 58-59 */}
      <TimelineImage
        caption={
          <>
            <span className="font-semibold not-italic">
              Figuur 2: SK Elewijt kampioen 58-59
            </span>
            <br />
            Staand: Jan De Ron; Maurits Janssens; Raymond Jaspers; Emiel Knaepen
            &quot;Mieleke van Beezel&quot;; Jean Lauwers; Jaak Janssens
            <br />
            Zittend: David Vander Meulen ; Ket Raeymaekers ; Jacky Van Mol;
            Mathieu Van Helden; René Van Gysel; Julien Coppens; Jozef Janssens;
            Maurits De Laet
          </>
        }
      >
        <Image
          src={HISTORY_58_59}
          alt="SK Elewijt kampioen 58-59"
          fill
          sizes={PHOTO_SIZES}
          className="object-contain"
        />
      </TimelineImage>

      {/* FC Elewijt section */}
      <TimelineSection>
        <TimelineItem date="FC Elewijt" side="right">
          <p>
            Hoogtepunten voor FC Elewijt waren titels in derde provinciale in
            1954-1955 (met 164 gemaakte doelpunten); 1957-1958 (SK Elewijt
            eindigde dat seizoen tweede); 1963-1964 (zonder verlieswedstrijd);
            en een tweede plaats in tweede provinciale in 1960-1961.
          </p>
        </TimelineItem>
      </TimelineSection>

      {/* Image: FC Elewijt kampioen 63-64 */}
      <TimelineImage
        caption={
          <>
            <span className="font-semibold not-italic">
              Figuur 3: FC Elewijt kampioen 63-64
            </span>
            <br />
            Rij bovenaan : François De Win (burger), Gust Boxtaens, Chris
            Bessendorffer, Guy Van den Wijngaerd, Guy Busschots , Alfons
            Beullens (de Kras), Warre Bosmans, Jaak Vandergucht (burger)
            <br />
            Rij onderaan : Hugo Vanderbeken, Jaak Demesmaecker , Jan Ervens ,
            Rik Claes , Roger Wijns
          </>
        }
      >
        <Image
          src={HISTORY_63_64}
          alt="FC Elewijt kampioen 63-64"
          fill
          sizes={PHOTO_SIZES}
          className="object-contain"
        />
      </TimelineImage>

      {/* Image: Fusieclub VV Elewijt */}
      <TimelineImage
        caption={
          <>
            Figuur 4: De fusieclub VV Elewijt (rood-wit - op de foto Luc Buedts
            als kind) sinds 1971-1972 in competitie speelde; ontstaan uit FC
            Elewijt (rood-geel - op de foto Etienne Cnops als moeder) en SK
            Elewijt (groen-wit - op de foto Walter Van As als vader).
          </>
        }
      >
        <Image
          src={HISTORY_FUSIE}
          alt="De fusieclub VV Elewijt"
          fill
          sizes={PHOTO_SIZES}
          className="object-contain"
        />
      </TimelineImage>

      {/* 1971 - 1991 */}
      <TimelineSection>
        <TimelineItem date="1971 - 1983" side="left">
          <p>
            In 1971 kwam het uiteindelijk tot een fusie tussen SK en FC; en werd
            er gestart in derde provinciale met VV Elewijt. In het seizoen
            1973-1974 wist deze fusieclub de promotie naar tweede provinciale te
            bewerkstelligen door de titel te behalen. Ook in tweede provinciale
            werden goede resultaten gehaald met een tweede plaats in 1977-1978.
          </p>
        </TimelineItem>

        <TimelineItem date="1983 - 1991" side="right">
          <p>
            Echter; de ambities van toenmalig voorzitter Maurice De Laet lagen
            hoger; daarom werd in 1983 het stamnummer 55 van Crossing Schaarbeek
            overgenomen; waardoor men kon aantreden in eerste provinciale.
            Crossing Schaarbeek was zelf het resultaat van eerdere samensmelting
            tussen Royal Crossing Club Molenbeek en Royal Cercle Sportif de
            Schaerbeek; en speelde 4 seizoenen in eerste klasse in de periode
            1969-1973; in de daaropvolgende jaren was deze club verder weggezakt
            tot de degradatie vanuit vierde klasse in 1983. De benaming van deze
            club werd Crossing Elewijt. Het eerste seizoen werd geen succes want
            Crossing Elewijt eindigde op een veertiende plaats in eerste
            provinciale waardoor het degradeerde naar tweede provinciale. In het
            seizoen 1985-1986 wist Crossing Elewijt de titel te behalen in
            tweede provinciale waardoor men opnieuw naar eerste promoveerde. In
            de daaropvolgende seizoenen &apos;86-&apos;87 en &apos;87-&apos;88
            behaalde Crossing tweemaal een vierde plaats in eerste provinciale;
            het hoogst bereikte resultaat ooit voor een Elewijtse ploeg.
            Bovendien wist Crossing Elewijt in 1988 de beker van Brabant te
            winnen.
          </p>
        </TimelineItem>
      </TimelineSection>

      {/* Image: Beker van Brabant */}
      <TimelineImage
        caption={
          <>
            Figuur 5: Crossing Elewijt won de beker van Brabant in 1988 na een
            4-1 overwinning in de finale tegen Peutie.
          </>
        }
      >
        <Image
          src={HISTORY_BVB}
          alt="Crossing Elewijt won de beker van Brabant in 1988"
          fill
          sizes={PHOTO_SIZES}
          className="object-contain"
        />
      </TimelineImage>

      {/* 1991 - 2018 */}
      <TimelineSection>
        <TimelineItem side="right">
          <p>
            In het seizoen 1990-1991 werd Crossing Elewijt veertiende in eerste
            provinciale waardoor het degradeerde naar tweede provinciale.
          </p>
          <p className="mt-3">
            VV Elewijt bleef bestaan en speelde verder in derde provinciale
            vanaf 1983-1984; bijgevolg waren er dus opnieuw 2 actieve ploegen in
            Elewijt. VV Elewijt bestond voornamelijk uit spelers uit Elewijt en
            fungeerde als een soort satellietploeg voor Crossing Elewijt; de
            beste spelers werden jaarlijks doorgesluisd naar Crossing. In het
            seizoen 1989-1990 zakte VV Elewijt naar vierde provinciale.
          </p>
        </TimelineItem>

        <TimelineItem date="1991 - 2018" side="left">
          <p>
            Vanaf 1991-1992 werd besloten om beide Elewijtse ploegen te fuseren
            tot KCVV Elewijt; de ploeg ging verder in tweede provinciale. Na
            twee degradaties in enkele jaren tijd moest KCVV vanaf 1994-1995
            aantreden in vierde provinciale.
          </p>
          <p className="mt-3">
            KCVV Elewijt werd in 2001 tweede in de laagste provinciale reeks en
            dwong zo de promotie naar derde provinciale af. Het daaropvolgende
            seizoen werden ze laatste en degradeerden ze opnieuw naar 4e
            provinciale. Na zeven seizoenen als subtopper slaagden ze er in 2009
            opnieuw in om de promotie af te dwingen. Ditmaal hielden ze twee
            seizoenen stand, waarna ze in het seizoen 2011-2012 opnieuw
            uitkwamen in vierde provinciale.
          </p>
          <p className="mt-3">
            KCVV speelde meteen kampioen, waarna ze erin slaagden een stabiele
            derdeprovincialer te worden.
          </p>
        </TimelineItem>
      </TimelineSection>

      {/* Image: Kampioen 2018-2019 */}
      <TimelineImage
        caption={
          <span className="font-semibold not-italic">
            Figuur 6: KCVV Elewijt speelt kampioen in 2018-2019 met 79 punten op
            90.
          </span>
        }
      >
        <Image
          src={HISTORY_2018}
          alt="KCVV Elewijt speelt kampioen in 2018-2019 met 79 punten op 90"
          fill
          sizes={PHOTO_SIZES}
          className="object-contain"
        />
      </TimelineImage>

      {/* 2018 - present */}
      <TimelineSection>
        <TimelineItem date="2018 - 2021" side="right">
          <p>
            In het seizoen 2018/2019 werd KCVV Elewijt kampioen met maar liefst
            79 punten, na een nek-aan-nek race tot de allerlaatste speeldag
            (slechts één punt voorsprong op de tweede in de stand
            Mazenzele-Opwijk). In dat seizoen wint het o.a. 14 keer op een rij
            en verliest het in totaal meer dan 300 dagen aaneengesloten niet.
          </p>
          <p className="mt-3">
            De ploeg is in het seizoen 2019/2020 ingedeeld in tweede provinciale
            A (Brabant).
          </p>
        </TimelineItem>
      </TimelineSection>

      {/* Image: Promotie eerste provinciale */}
      <TimelineImage
        caption={
          <span className="font-semibold not-italic">
            Figuur 7: KCVV Elewijt promoveert via eindronde naar eerste
            provinciale.
          </span>
        }
      >
        <Image
          src={HISTORY_2022}
          alt="KCVV Elewijt promoveert via eindronde naar eerste provinciale"
          fill
          sizes={PHOTO_SIZES}
          className="object-contain"
        />
      </TimelineImage>

      {/* Final section */}
      <TimelineSection>
        <TimelineItem date="2021 - 2025" side="right">
          <p>
            Na een onnodig spannend seizoen verzekert KCVV zich pas op de
            allerlaatste speeldag van een tweede plaats — achter ongenaakbaar
            kampioen KFC Herent dat 87 op 90 haalde (enkel verloor thuis van,
            jawel, KCVV Elewijt) — en bijhorende deelname aan de eindronde voor
            promotie.
          </p>
          <p className="mt-3">
            In de eindronde krijgt het K Eur. Kraainem — tweede in de B-reeks —
            als tegenstander. Vooral in de eerste helft van de heenwedstrijd
            wordt KCVV weggeblazen en mag het al-bij-al nog blij zijn dat het de
            eindscore nog kan milderen tot 4-2.
          </p>
          <p className="mt-3">
            Twee cruciale tegendoelpunten blijkt achteraf. Een week later
            verschijnt een volledig ander ingesteld Elewijt aan de aftrap. Onder
            een warme lentezon grijpt het Kraainem vanaf de eerste seconde bij
            de keel. Bij de rust staat het oververdiend 1-0 voor – getekend
            Glenn Breugelmans – en de hoop op een straffe terugkeer groeide.
          </p>
          <p className="mt-3">
            En dat bleek meer dan terecht, 20 minuten ver in de tweede helft
            volgde een tweede apotheose. Jorn Reszczynski prikte de 2-0 binnen
            en alles was terug in evenwicht.
          </p>
          <p className="mt-3">
            Het was zweten en puffen op het veld, en de ploeg had meer zin in
            een feestje dan nog eens verlengingen te moeten spelen in de warmte.
            De oplossing kwam van de voet van Denis Ghys, hij maakte er knap 3-0
            van! Kraainem kwam nog opzetten, maar met enkele knappe reddingen en
            secuur verdedigend ingrijpen op het einde van de wedstrijd konden
            Ken en zijn verdedigers toch de 0 houden, en dus ook de promotie
            naar 1e provinciale verzekeren!
          </p>
          <p className="mt-3">
            De ploeg is in het seizoen 2022/2023 ingedeeld in eerste provinciale
            Vlaams - Brabant.
          </p>
        </TimelineItem>
      </TimelineSection>

      {/* Image: Kampioen 2024-2025 */}
      <TimelineImage
        caption={
          <>
            <span className="font-semibold not-italic">
              Figuur 8: KCVV Elewijt kampioen 2024-2025
            </span>
            <br />
            Titel in eerste provinciale met 58 punten — 8 punten voorsprong op
            eerste achtervolger OHR Huldenberg.
          </>
        }
      >
        <Image
          src={HISTORY_24_25}
          alt="KCVV Elewijt kampioen 2024-2025 in eerste provinciale"
          fill
          sizes={PHOTO_SIZES}
          className="object-contain"
        />
      </TimelineImage>

      {/* 2025 - nationaal voetbal */}
      <TimelineSection>
        <TimelineItem date="2024 - 2025" side="left">
          <p>
            Na drie seizoenen in eerste provinciale groeit KCVV Elewijt gestaag
            uit tot een vaste waarde in de hoogste provinciale reeks. In het
            seizoen 2024-2025 pakt de ploeg uit met een ijzersterke campagne: 17
            zeges, 7 gelijke spelen en slechts 4 nederlagen leveren 58 punten op
            — goed voor de titel met maar liefst 8 punten voorsprong op eerste
            achtervolger OHR Huldenberg.
          </p>
          <p className="mt-3">
            Voor het eerst sinds de gloriedagen van Crossing Schaarbeek in de
            jaren &apos;70 mag stamnummer 55 aantreden op nationaal niveau. Het
            is het absolute hoogtepunt in de geschiedenis van KCVV Elewijt: van
            vierde provinciale in 2012 naar de derde afdeling Voetbal Vlaanderen
            in 2025 — vier promoties in amper dertien seizoenen.
          </p>
        </TimelineItem>

        <TimelineItem date="2025 - ..." side="right">
          <p>
            De ploeg wordt in het seizoen 2025/2026 ingedeeld in derde afdeling
            VV reeks B, een nationaal niveau met ambitieuze clubs als KVC
            Wilrijk, City Pirates Antwerpen, FC Wezel Sport en KFC De Kempen.
            Voor het eerst in de moderne clubgeschiedenis speelt KCVV Elewijt op
            het nationale toneel — een historische mijlpaal voor het kleine dorp
            aan de Zenne.
          </p>
        </TimelineItem>
      </TimelineSection>

      {/* Credits */}
      <div className="mt-16 px-1">
        <h2 className="text-ink-muted text-mono-sm border-ink/30 mb-4 border-l-2 pl-4 font-mono tracking-[0.08em] uppercase">
          Credits
        </h2>
        <p className="text-body-md text-ink-soft">
          Met dank aan Martijn van den Berg voor de foto&apos;s en teksten over
          de geschiedenis van KCVV Elewijt!
        </p>
      </div>
    </div>
  );
}

export function HistoryContent() {
  return (
    <>
      <PageViewTracker eventName="geschiedenis_view" />

      <HeritageHero />

      <div className="mt-8">
        <StripedSeam />
      </div>

      <TimelineReveal>
        <TimelineContent />
      </TimelineReveal>
    </>
  );
}
