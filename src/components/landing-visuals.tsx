// Original SVG compositions for the HAVEN landing cover. Architectural
// linework, housing silhouettes, local-area contours, geographic nodes and
// intervention paths — no stock photography.

export function Skyline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 300" className={className} role="img" aria-label="Stylised neighbourhood of homes along a coastline with risk signals">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2b45" />
          <stop offset="1" stopColor="#16233a" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#24384f" />
          <stop offset="1" stopColor="#1d2f46" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#sky)" />

      {/* local-area contour lines */}
      {[60, 90, 120, 150].map((y, i) => (
        <path key={i} d={`M0 ${y} C 90 ${y - 18}, 180 ${y + 14}, 280 ${y - 10} S 400 ${y - 4}, 400 ${y}`} fill="none" stroke="#4a6684" strokeWidth="0.6" opacity="0.18" />
      ))}

      {/* firth / water band */}
      <path d="M0 196 C 80 186, 160 192, 240 186 S 360 192, 400 188 L400 300 L0 300 Z" fill="url(#water)" />
      <path d="M0 196 C 80 186, 160 192, 240 186 S 360 192, 400 188" fill="none" stroke="#6a8fa8" strokeWidth="0.8" opacity="0.5" />

      {/* housing blocks silhouette */}
      <g fill="#2a3e59" stroke="#3d577a" strokeWidth="0.8">
        {[
          [26, 150, 34, 46], [64, 138, 26, 58], [94, 158, 30, 38], [128, 132, 24, 64],
          [156, 150, 36, 46], [198, 128, 28, 68], [230, 150, 32, 46], [266, 140, 26, 56],
          [298, 156, 34, 40], [336, 134, 28, 62], [368, 152, 26, 44],
        ].map(([x, y, w, h], i) => (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} />
            <polygon points={`${x - 2},${y} ${x + w / 2},${y - 10} ${x + w + 2},${y}`} fill="#32486a" />
          </g>
        ))}
        {/* lit windows */}
        {[[34, 162], [72, 152], [102, 168], [136, 148], [166, 162], [206, 142], [238, 162], [274, 154], [306, 168], [344, 150]].map(([x, y], i) => (
          <rect key={`w${i}`} x={x} y={y} width="4" height="5" fill={i % 3 === 0 ? "#cc7249" : "#8aa0b5"} opacity={i % 4 === 0 ? 0.9 : 0.55} stroke="none" />
        ))}
      </g>

      {/* geographic nodes + intervention paths */}
      <g>
        <path className="flow-line" d="M70 120 C 130 96, 210 110, 300 86" fill="none" stroke="#cc7249" strokeWidth="1.1" opacity="0.8" />
        <path className="flow-line" d="M110 150 C 170 128, 250 150, 330 120" fill="none" stroke="#7a9b8f" strokeWidth="1.1" opacity="0.7" />
        {[[70, 120], [300, 86], [110, 150], [330, 120], [200, 108]].map(([cx, cy], i) => (
          <g key={`n${i}`}>
            <circle cx={cx} cy={cy} r="7" fill={i % 2 ? "#7a9b8f" : "#cc7249"} opacity="0.18" />
            <circle cx={cx} cy={cy} r="3.1" fill={i % 2 ? "#8fb3a6" : "#e0895e"} stroke="#16233a" strokeWidth="1" />
          </g>
        ))}
      </g>
    </svg>
  );
}

// Small motif for each SEE / UNDERSTAND / ACT / TRACK stage.
export function PurposeMotif({ kind }: { kind: "see" | "understand" | "act" | "track" }) {
  const common = { width: 40, height: 40, viewBox: "0 0 40 40", fill: "none" as const, stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (kind === "see") return (<svg {...common}><path d="M4 20c4-7 10-11 16-11s12 4 16 11c-4 7-10 11-16 11S8 27 4 20Z" /><circle cx="20" cy="20" r="4.5" /></svg>);
  if (kind === "understand") return (<svg {...common}><path d="M6 30V14M14 30V8M22 30v-9M30 30V17" /><circle cx="30" cy="12" r="2.4" /></svg>);
  if (kind === "act") return (<svg {...common}><path d="M8 20h16M18 12l8 8-8 8" /><circle cx="8" cy="20" r="2.6" /></svg>);
  return (<svg {...common}><path d="M5 26l7-8 6 5 9-13" /><path d="M27 10h5v5" /></svg>);
}
