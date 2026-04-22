const MAP_LAT = 50.9719161;
const MAP_LON = 4.5001788;
const MAP_BBOX = "4.4952,50.9694,4.5052,50.9744";
const MAP_SRC = `https://www.openstreetmap.org/export/embed.html?bbox=${MAP_BBOX}&layer=mapnik&marker=${MAP_LAT}%2C${MAP_LON}`;
const MAP_TITLE = "Locatie KCVV Elewijt - Driesstraat 30, 1982 Elewijt";

export function MapEmbed() {
  return (
    <div className="min-h-[300px] overflow-hidden rounded-xl border border-gray-200 shadow-sm">
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
    </div>
  );
}
