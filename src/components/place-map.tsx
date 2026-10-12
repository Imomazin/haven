import { BAND_HEX } from "@/lib/constants";
import { localityGeo, type PlaceAggregate } from "@/lib/places";
import { label } from "@/lib/format";

// Stylised map of Inverclyde along the Firth of Clyde. Illustrative, not
// survey-accurate, and drawn locally with no external mapping service. Towns
// are strung along the south bank; marker size reflects households monitored
// and colour the area's most severe band. Label positions are curated per
// locality (see LOCALITY_GEO) so the ten names never overlap.
export function PlaceMap({ places }: { places: PlaceAggregate[] }) {
  const maxHh = Math.max(1, ...places.map((p) => p.households));
  const r = (hh: number) => 2.0 + (hh / maxHh) * 3.4;

  return (
    <figure className="m-0">
      <div className="overflow-hidden rounded-lg border border-graphite-200/70 bg-[#dde6e8]">
        <svg viewBox="0 0 100 72" className="h-auto w-full" role="img" aria-label="Neighbourhood risk map of Inverclyde along the Firth of Clyde">
          <defs>
            <linearGradient id="firth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#c7d6da" />
              <stop offset="1" stopColor="#dbe6e8" />
            </linearGradient>
          </defs>

          {/* Firth of Clyde */}
          <rect x="0" y="0" width="100" height="72" fill="url(#firth)" />
          {/* faint depth contours in the water */}
          <path d="M0,16 C24,12 46,15 66,13 C80,12 92,14 100,13" fill="none" stroke="#b7cacf" strokeWidth="0.3" opacity="0.7" />
          <path d="M0,9 C26,6 50,8 72,6 C84,5 94,7 100,6" fill="none" stroke="#bfd1d6" strokeWidth="0.3" opacity="0.5" />

          {/* Inverclyde land mass */}
          <path
            d="M100,72 L0,72 L0,60 C6,52 10,47 16,42 C19,38 18,33 23,31 C34,27 44,25 54,25 C66,25 76,28 88,29 L100,30 Z"
            fill="#f1ece1"
          />
          {/* coastline */}
          <path
            d="M0,60 C6,52 10,47 16,42 C19,38 18,33 23,31 C34,27 44,25 54,25 C66,25 76,28 88,29 L100,30"
            fill="none"
            stroke="#9fb7bc"
            strokeWidth="0.5"
          />
          <text x="6" y="11" fill="#5f777d" fontSize="2.8" fontStyle="italic" letterSpacing="0.3">Firth of Clyde</text>

          {places.map((p) => {
            const g = localityGeo(p.locality);
            const c = BAND_HEX[p.topBand];
            const rad = r(p.households);
            return (
              <a key={p.locality} href={`/risk-queue?locality=${encodeURIComponent(p.locality)}`} className="group">
                <title>{`${p.locality} — ${p.households} households, ${p.highCritical} high/critical, ${p.openCases} open cases`}</title>
                {/* soft halo */}
                <circle cx={p.point.x} cy={p.point.y} r={rad + 2} fill={c} opacity={0.16} />
                <circle cx={p.point.x} cy={p.point.y} r={rad} fill={c} opacity={0.92} stroke="#fff" strokeWidth="0.6" className="transition-opacity group-hover:opacity-100" />
                {p.highCritical > 0 && rad >= 2.8 && (
                  <text x={p.point.x} y={p.point.y + 1.1} textAnchor="middle" fontSize={rad * 0.95} fontWeight="700" fill="#fff">{p.highCritical}</text>
                )}
                <text
                  x={p.point.x + g.labelDx}
                  y={p.point.y + g.labelDy}
                  textAnchor={g.anchor}
                  fontSize="2.7"
                  fontWeight="600"
                  fill="#1f2d3d"
                  stroke="#f1ece1"
                  strokeWidth="0.7"
                  paintOrder="stroke"
                  style={{ strokeLinejoin: "round" }}
                >
                  {p.locality}
                </text>
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
