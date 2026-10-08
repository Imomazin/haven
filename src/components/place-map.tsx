import { BAND_HEX } from "@/lib/constants";
import type { PlaceAggregate } from "@/lib/places";
import { label } from "@/lib/format";

// Stylised local map of Inverclyde along the Firth of Clyde. Not survey-accurate;
// a calm, architectural orientation device. Markers are sized by household count
// and coloured by the area's most severe band. Each links into the risk queue.
export function PlaceMap({ places }: { places: PlaceAggregate[] }) {
  const maxHh = Math.max(1, ...places.map((p) => p.households));
  const r = (hh: number) => 2.4 + (hh / maxHh) * 4.2;

  // LOCALITY_GEO uses normalised 0–100 coordinates while this deliberately wide
  // map uses a 100×62 viewBox. Scale Y into the rendered coordinate system so
  // southern localities remain visible instead of falling below the SVG bounds.
  const mapY = (y: number) => y * 0.62;

  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-lg border border-graphite-200/70 bg-[#eef2f1]">
        <svg viewBox="0 0 100 62" className="h-auto w-full" role="img" aria-label="Neighbourhood risk map of Inverclyde">
          {/* Firth of Clyde */}
          <rect x="0" y="0" width="100" height="62" fill="#e7edec" />
          <path d="M0,0 H100 V17 C82,23 60,19 44,24 C28,29 14,26 0,31 Z" fill="#cdd9de" />
          <path d="M0,31 C14,26 28,29 44,24 C60,19 82,23 100,17" fill="none" stroke="#9fb3b8" strokeWidth="0.4" />
          {/* Land */}
          <path d="M0,31 C14,26 28,29 44,24 C60,19 82,23 100,17 V62 H0 Z" fill="#f4f0e7" />
          <text x="7" y="12" fill="#6b7d82" fontSize="2.6" fontStyle="italic">Firth of Clyde</text>

          {places.map((p) => {
            const c = BAND_HEX[p.topBand];
            const rad = r(p.households);
            const cy = mapY(p.point.y);
            return (
              <a key={p.locality} href={`/risk-queue?locality=${encodeURIComponent(p.locality)}`}>
                <title>{`${p.locality} — ${p.households} households, ${p.highCritical} high/critical, ${p.openCases} open cases`}</title>
                <circle cx={p.point.x} cy={cy} r={rad + 2.2} fill={c} opacity={0.14} />
                <circle cx={p.point.x} cy={cy} r={rad} fill={c} opacity={0.9} stroke="#fff" strokeWidth="0.5" />
                {p.highCritical > 0 && (
                  <text x={p.point.x} y={cy + 1.1} textAnchor="middle" fontSize={rad * 0.9} fontWeight="700" fill="#fff">{p.highCritical}</text>
                )}
                <text x={p.point.x} y={Math.min(59, cy + rad + 3.1)} textAnchor="middle" fontSize="2.5" fontWeight="600" fill="#213250">{p.locality}</text>
              </a>
            );
          })}
        </svg>
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-graphite-500">
        <span>Marker size = households monitored · number = high/critical</span>
        <span className="ml-auto flex items-center gap-3">
          {(["Critical", "High", "Moderate", "Low"] as const).map((b) => (
            <span key={b} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: BAND_HEX[b] }} aria-hidden />{label(b)}</span>
          ))}
        </span>
      </figcaption>
    </figure>
  );
}
