import { TapedCard } from "@/components/design-system/TapedCard";

// Driesstraat 32, 1982 Elewijt (Zemst) — the club ground. Coordinates from
// OpenStreetMap (osm way 189062234, "KCVV Elewijt"); the legacy pin was ~150m
// off and addressed to the wrong house number (30). See #2123.
const MAP_LAT = 50.9705214;
const MAP_LON = 4.5012206;
const MAP_BBOX = "4.4962,50.9680,4.5062,50.9730";
const MAP_SRC = `https://www.openstreetmap.org/export/embed.html?bbox=${MAP_BBOX}&layer=mapnik&marker=${MAP_LAT}%2C${MAP_LON}`;
const MAP_TITLE = "Locatie KCVV Elewijt - Driesstraat 32, 1982 Elewijt";

export function MapEmbed() {
  return (
    <TapedCard
      shadow="sm"
      padding="none"
      interactive={false}
      className="min-h-[300px] overflow-hidden"
    >
      <iframe
        title={MAP_TITLE}
        src={MAP_SRC}
        width="100%"
        height="100%"
        style={{ minHeight: "300px", border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </TapedCard>
  );
}
