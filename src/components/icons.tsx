// Small inline icon set (currentColor, 20x20 grid). Decorative — aria-hidden.
import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({ width: 18, height: 18, viewBox: "0 0 20 20", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, ...p });

export const Icon = {
  overview: (p: P) => (<svg {...base(p)}><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="11" y="3" width="6" height="6" rx="1" /><rect x="3" y="11" width="6" height="6" rx="1" /><rect x="11" y="11" width="6" height="6" rx="1" /></svg>),
  queue: (p: P) => (<svg {...base(p)}><path d="M4 6h12M4 10h12M4 14h7" /></svg>),
  property: (p: P) => (<svg {...base(p)}><path d="M3 9l7-5 7 5v7a1 1 0 0 1-1 1h-3v-5H7v5H4a1 1 0 0 1-1-1z" /></svg>),
  household: (p: P) => (<svg {...base(p)}><circle cx="7" cy="7" r="2.3" /><circle cx="13" cy="7" r="2.3" /><path d="M3.5 16c0-2.2 1.6-3.6 3.5-3.6S10.5 13.8 10.5 16M9.5 16c0-2.2 1.6-3.6 3.5-3.6s3.5 1.4 3.5 3.6" /></svg>),
  case: (p: P) => (<svg {...base(p)}><rect x="3.5" y="5.5" width="13" height="10" rx="1.5" /><path d="M7.5 5.5V4.3A1.3 1.3 0 0 1 8.8 3h2.4a1.3 1.3 0 0 1 1.3 1.3v1.2" /></svg>),
  intervention: (p: P) => (<svg {...base(p)}><path d="M10 3v14M3 10h14" /></svg>),
  analytics: (p: P) => (<svg {...base(p)}><path d="M4 16V9M9 16V4M14 16v-5" /></svg>),
  governance: (p: P) => (<svg {...base(p)}><path d="M10 3l6 2v4c0 4-2.6 6.3-6 8-3.4-1.7-6-4-6-8V5z" /></svg>),
  methodology: (p: P) => (<svg {...base(p)}><path d="M5 3h10v14H5zM8 7h4M8 10h4M8 13h2" /></svg>),
  simulator: (p: P) => (<svg {...base(p)}><circle cx="6" cy="7" r="2" /><circle cx="14" cy="13" r="2" /><path d="M4 7h-.5M8 7h8M16 13h.5M12 13H4" /></svg>),
  demo: (p: P) => (<svg {...base(p)}><path d="M7 5l9 5-9 5z" /></svg>),
  about: (p: P) => (<svg {...base(p)}><circle cx="10" cy="10" r="7" /><path d="M10 9v4M10 6.5h.01" /></svg>),
};

export type IconName = keyof typeof Icon;
