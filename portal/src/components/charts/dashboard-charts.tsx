"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#4B3A9B", "#6C58B6", "#10B981", "#F59E0B", "#EF4444"];

export function StatusPieChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
            {data.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SimpleBarChart({
  data,
  xKey,
  bars,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  xKey: string;
  bars: { key: string; label: string; color: string }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {bars.map((b) => (
            <Bar key={b.key} dataKey={b.key} name={b.label} fill={b.color} radius={[6, 6, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
