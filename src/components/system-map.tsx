// "HAVEN Connected Housing Ecosystem" — the architecture at a glance.
// Systems of record flow into Haven's canonical layer; connected-home, repairs
// and public data enrich it; the risk engine turns signals into coordinated
// intervention and measured outcomes, with resident communications outbound.

type Node = { x: number; y: number; w: number; label: string };

const ACCENT = { hms: "#2f4866", home: "#4a6a60", repairs: "#b4703f", public: "#8a8577" };

function Pill({ x, y, w, label, tone = "#1f2d3d", fill = "#ffffff", fs = 2.5 }: Node & { tone?: string; fill?: string; fs?: number }) {
  const h = 6.2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={1.3} fill={fill} stroke={tone} strokeWidth={0.4} />
      <rect x={x} y={y} width={1} height={h} rx={0.5} fill={tone} />
      <text x={x + w / 2 + 0.3} y={y + h / 2 + 1} textAnchor="middle" fontSize={fs} fontWeight={600} fill="#213250">{label}</text>
    </g>
  );
}

export function SystemMap() {
  const hms: Node[] = [
    { x: 3, y: 7, w: 17, label: "Civica Cx" },
    { x: 22, y: 7, w: 14, label: "NEC" },
    { x: 38, y: 7, w: 21, label: "MRI Housing" },
    { x: 61, y: 7, w: 17, label: "Salesforce" },
    { x: 80, y: 7, w: 16, label: "Dynamics" },
  ];
  const leftFlank: Node[] = [
    { x: 2, y: 30, w: 19, label: "Switchee" },
    { x: 2, y: 37.5, w: 19, label: "Aico HomeLINK" },
    { x: 2, y: 45, w: 19, label: "SIMD · EPC · OS" },
  ];
  const repairs: Node[] = [
    { x: 79, y: 30, w: 19, label: "Plentific" },
    { x: 79, y: 37.5, w: 19, label: "Totalmobile" },
    { x: 79, y: 45, w: 19, label: "MRI Asset" },
  ];
  const outcomes: Node[] = [
    { x: 7, y: 73, w: 24, label: "Residents" },
    { x: 38, y: 73, w: 24, label: "Officers" },
    { x: 69, y: 73, w: 24, label: "Management" },
  ];

  return (
    <svg viewBox="0 0 100 82" className="h-auto w-full" role="img" aria-label="HAVEN connected housing ecosystem architecture diagram">
      <defs>
        <marker id="arrow" markerWidth="5" markerHeight="5" refX="3.4" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="#9aa7b4" />
        </marker>
      </defs>

      <text x="2" y="4.6" fontSize="2.1" fontWeight={700} fill="#8a97a4" letterSpacing="0.3">SYSTEMS OF RECORD</text>
      <text x="2" y="27" fontSize="2.1" fontWeight={700} fill="#8a97a4" letterSpacing="0.3">ENRICHMENT</text>
      <text x="2" y="70.5" fontSize="2.1" fontWeight={700} fill="#8a97a4" letterSpacing="0.3">OUTCOMES</text>

      {/* HMS -> core */}
      {hms.map((n, i) => (
        <line key={i} x1={n.x + n.w / 2} y1={n.y + 6.2} x2={50} y2={28.5} stroke="#c6cfd8" strokeWidth={0.35} markerEnd="url(#arrow)" />
      ))}
      {hms.map((n, i) => <Pill key={`h${i}`} {...n} tone={ACCENT.hms} />)}

      {/* Left flank -> core */}
      <text x="2" y="29" fontSize="1.8" fontWeight={600} fill={ACCENT.home}>Connected home · public data</text>
      {leftFlank.map((n, i) => (
        <line key={`ll${i}`} x1={n.x + n.w} y1={n.y + 3.1} x2={32} y2={36} stroke="#cdd9d4" strokeWidth={0.35} markerEnd="url(#arrow)" />
      ))}
      {leftFlank.map((n, i) => <Pill key={`lf${i}`} {...n} tone={i === 2 ? ACCENT.public : ACCENT.home} fill={i === 2 ? "#faf8f3" : "#ffffff"} fs={2.3} />)}

      {/* Repairs -> core */}
      <text x="98" y="29" textAnchor="end" fontSize="1.8" fontWeight={600} fill={ACCENT.repairs}>Repairs &amp; assets</text>
      {repairs.map((n, i) => (
        <line key={`rl${i}`} x1={n.x} y1={n.y + 3.1} x2={68} y2={36} stroke="#e4cbb9" strokeWidth={0.35} markerEnd="url(#arrow)" />
      ))}
      {repairs.map((n, i) => <Pill key={`re${i}`} {...n} tone={ACCENT.repairs} />)}

      {/* HAVEN core */}
      <rect x="32" y="30" width="36" height="12" rx="2.2" fill="#16233a" />
      <text x="50" y="35" textAnchor="middle" fontSize="3.3" fontWeight={700} fill="#ffffff" fontFamily="Georgia, serif">HAVEN</text>
      <text x="50" y="38.6" textAnchor="middle" fontSize="1.8" fill="#aebccb">Canonical data · HACT-aligned</text>
      <text x="50" y="41" textAnchor="middle" fontSize="1.8" fill="#aebccb">UPRN property identity</text>

      {/* core -> risk -> intervention */}
      <line x1={50} y1={42} x2={50} y2={49} stroke="#b9c2cc" strokeWidth={0.4} markerEnd="url(#arrow)" />
      <rect x="33" y="49" width="34" height="6.4" rx="1.6" fill="#f1ece1" stroke="#cbb9a6" strokeWidth={0.4} />
      <text x="50" y="53" textAnchor="middle" fontSize="2.5" fontWeight={700} fill="#8a4b24">Risk &amp; intelligence engine</text>

      <line x1={50} y1={55.4} x2={50} y2={59} stroke="#b9c2cc" strokeWidth={0.4} markerEnd="url(#arrow)" />
      <rect x="30" y="59" width="40" height="6" rx="1.5" fill="#eef1ee" stroke="#b7c6bd" strokeWidth={0.4} />
      <text x="50" y="62.8" textAnchor="middle" fontSize="2.4" fontWeight={700} fill="#4a6a60">Intervention &amp; case coordination</text>

      {/* comms outbound from intervention (right) */}
      <line x1={70} y1={62} x2={79} y2={62} stroke="#e4cbb9" strokeWidth={0.35} markerEnd="url(#arrow)" />
      <Pill x={79} y={58.9} w={19} label="Notify · Twilio" tone={ACCENT.repairs} fs={2.2} />

      {/* intervention -> outcomes */}
      {outcomes.map((n, i) => (
        <line key={`ol${i}`} x1={50} y1={65} x2={n.x + n.w / 2} y2={n.y} stroke="#c6cfd8" strokeWidth={0.35} markerEnd="url(#arrow)" />
      ))}
      {outcomes.map((n, i) => <Pill key={`oc${i}`} {...n} tone="#2f4866" />)}
    </svg>
  );
}
