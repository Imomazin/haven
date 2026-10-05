"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Severity palette (also distinguished by order + labels/legend).
const BAND_COLORS: Record<string, string> = {
  Critical: "#a1332a",
  High: "#bf5a2c",
  Moderate: "#8f6410",
  Low: "#3f6b4e",
};

const AXIS = { fontSize: 12, fill: "#555751" };
const GRID = "#eae3d5";

export function StackedBandBar({ data }: { data: { name: string; Critical: number; High: number; Moderate: number; Low: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ left: 12, right: 12, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={AXIS} />
        <YAxis type="category" dataKey="name" width={110} tick={AXIS} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {(["Critical", "High", "Moderate", "Low"] as const).map((b) => (
          <Bar key={b} dataKey={b} stackId="a" fill={BAND_COLORS[b]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SimpleBar({
  data,
  dataKey = "value",
  color = "#213250",
  height = 260,
  horizontal = false,
}: {
  data: { name: string; value: number }[];
  dataKey?: string;
  color?: string;
  height?: number;
  horizontal?: boolean;
}) {
  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={Math.max(height, data.length * 30)}>
        <BarChart data={data} layout="vertical" margin={{ left: 12, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={AXIS} />
          <YAxis type="category" dataKey="name" width={150} tick={AXIS} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ left: 4, right: 8, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={AXIS} interval={0} angle={-15} textAnchor="end" height={60} />
        <YAxis allowDecimals={false} tick={AXIS} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RiskReductionBar({ data }: { data: { name: string; opening: number; followup: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(240, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 12, right: 16, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={AXIS} />
        <YAxis type="category" dataKey="name" width={90} tick={AXIS} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="opening" name="Risk at opening" fill="#bf5a2c" radius={[0, 4, 4, 0]} />
        <Bar dataKey="followup" name="Risk at follow-up" fill="#3f6b4e" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
