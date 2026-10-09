// Deterministic demo fixtures for connector feeds. Values are anchored to a
// property's stored signals so a connector's "latest reading" matches the
// property record — connected data, never disconnected random noise.

function rand(seed: number) {
  let s = (seed & 0x7fffffff) || 1;
  return () => {
    s = (Math.imul(s, 1103515245) + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const DAY = 86400000;
const BASE = Date.UTC(2026, 8, 18, 9, 0, 0);

export interface SensorReading {
  at: string;
  tempC: number;
  humidityPct: number;
  co2Ppm: number;
  heatingOn: boolean;
}

export interface SensorFeed {
  source: "Switchee" | "Aico HomeLINK";
  deviceId: string;
  deviceHealth: "online" | "degraded" | "offline";
  lastSeen: string;
  series: SensorReading[]; // oldest -> newest, daily points over 14 days
  latest: SensorReading;
  trend: { temp: number; humidity: number; co2: number }; // 14-day delta
}

// 14 days of daily readings converging on the property's current values.
export function sensorFeed(propertyId: number, winterTempC: number | null, humidityPct: number | null, co2Ppm: number | null): SensorFeed | null {
  if (winterTempC == null && humidityPct == null && co2Ppm == null) return null;
  const r = rand(propertyId * 131 + 7);
  const source = propertyId % 2 === 0 ? "Switchee" : "Aico HomeLINK";
  const tEnd = winterTempC ?? 18;
  const hEnd = humidityPct ?? 55;
  const cEnd = co2Ppm ?? 800;
  const n = 14;
  const series: SensorReading[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const k = (n - 1 - i) / (n - 1); // 0 oldest -> 1 newest
    const drift = (1 - k) * (r() * 2.4 - 1.2);
    // Newest reading equals the property's stored value exactly, so the
    // connector's "latest" reconciles with the property record.
    const newest = i === 0;
    const tempC = newest ? tEnd : Math.round((tEnd + drift + (r() * 0.8 - 0.4)) * 10) / 10;
    const humidityPct = newest ? hEnd : Math.round(hEnd + drift * -1.5 + (r() * 4 - 2));
    const co2Ppm = newest ? cEnd : Math.round(cEnd + drift * -30 + (r() * 80 - 40));
    series.push({ at: new Date(BASE - i * DAY).toISOString(), tempC, humidityPct, co2Ppm, heatingOn: tempC < 18 ? r() < 0.4 : r() < 0.7 });
  }
  const latest = series[series.length - 1];
  const first = series[0];
  const health = r() < 0.08 ? "degraded" : "online";
  return {
    source,
    deviceId: `${source === "Switchee" ? "SWCH" : "AICO"}-${String(10000 + propertyId * 7).slice(0, 5)}`,
    deviceHealth: health,
    lastSeen: new Date(BASE - Math.round(r() * 40) * 60000).toISOString(),
    series,
    latest,
    trend: {
      temp: Math.round((latest.tempC - first.tempC) * 10) / 10,
      humidity: latest.humidityPct - first.humidityPct,
      co2: latest.co2Ppm - first.co2Ppm,
    },
  };
}

export interface RepairRecord {
  ref: string;
  source: "Civica Cx" | "Plentific" | "MRI Asset";
  category: string;
  description: string;
  contractor: string;
  raisedAt: string;
  appointmentAt: string | null;
  completedAt: string | null;
  status: "open" | "scheduled" | "in_progress" | "completed" | "no_access";
  costGbp: number | null;
  repeat: boolean;
}

const CATS = [
  { cat: "Damp & mould", desc: "Investigate damp/mould in bedroom", contractor: "Cloch Repairs Service" },
  { cat: "Heating", desc: "Heating system not holding temperature", contractor: "Warmth NE Ltd" },
  { cat: "Roofing", desc: "Water ingress at roofline", contractor: "ClydeRoof Contractors" },
  { cat: "Plumbing", desc: "Leak under kitchen sink", contractor: "Inverclyde Plumbing" },
  { cat: "Ventilation", desc: "Extractor fan replacement", contractor: "AirFlow Services" },
  { cat: "Windows", desc: "Failed double-glazing unit", contractor: "ClearView Glazing" },
];
const SOURCES: RepairRecord["source"][] = ["Civica Cx", "Plentific", "MRI Asset"];

// Repair history consistent with the property's damp/mould/open-repair counts.
export function repairsForProperty(propertyId: number, dampCount: number, mouldCount: number, openRepairs: number): RepairRecord[] {
  const r = rand(propertyId * 977 + 3);
  const total = Math.min(8, dampCount + mouldCount + openRepairs + (r() < 0.6 ? 1 : 0));
  const out: RepairRecord[] = [];
  let open = openRepairs;
  for (let i = 0; i < total; i++) {
    // Bias early records toward damp/mould when the property has that history.
    const dampLed = i < dampCount + mouldCount;
    const c = dampLed ? CATS[0] : CATS[1 + (Math.floor(r() * (CATS.length - 1)))];
    const raised = BASE - Math.round((30 + r() * 600)) * DAY;
    const isOpen = open > 0 && r() < 0.7;
    if (isOpen) open--;
    const status: RepairRecord["status"] = isOpen ? (r() < 0.5 ? "scheduled" : "in_progress") : r() < 0.1 ? "no_access" : "completed";
    const appointment = status === "completed" || status === "scheduled" || status === "in_progress" ? raised + Math.round(2 + r() * 20) * DAY : null;
    const completed = status === "completed" ? (appointment ?? raised) + Math.round(r() * 3) * DAY : null;
    out.push({
      ref: `REP-${String(80000 + propertyId * 13 + i).slice(0, 5)}`,
      source: dampLed ? "Civica Cx" : SOURCES[(propertyId + i) % SOURCES.length],
      category: c.cat,
      description: c.desc,
      contractor: c.contractor,
      raisedAt: new Date(raised).toISOString(),
      appointmentAt: appointment ? new Date(appointment).toISOString() : null,
      completedAt: completed ? new Date(completed).toISOString() : null,
      status,
      costGbp: completed ? Math.round((80 + r() * 640)) : null,
      repeat: dampLed && i > 0,
    });
  }
  // newest first
  return out.sort((a, b) => +new Date(b.raisedAt) - +new Date(a.raisedAt));
}

// A UPRN derived deterministically so properties reconcile across systems.
export function uprnFor(propertyId: number): string {
  return String(906700000000 + propertyId * 37);
}

// SIMD decile (1 = most deprived) derived per locality for place context.
const LOCALITY_SIMD: Record<string, number> = {
  "Greenock Central": 1, "Greenock East": 2, "Greenock West": 3, Gourock: 6,
  "Port Glasgow": 2, Kilmacolm: 10, "Wemyss Bay": 7, Inverkip: 8, Larkfield: 4, Branchton: 3,
};
export function simdDecile(locality: string): number {
  return LOCALITY_SIMD[locality] ?? 5;
}
