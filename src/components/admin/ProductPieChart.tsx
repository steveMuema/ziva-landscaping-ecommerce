"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = [
  "#059669",
  "#0d9488",
  "#0284c7",
  "#2563eb",
  "#7c3aed",
  "#a855f7",
  "#c026d3",
  "#db2777",
  "#dc2626",
  "#ea580c",
];

type Slice = { productName: string; quantity: number; percent: number };

export function ProductPieChart({ slices }: { slices: Slice[] }) {
  if (slices.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        No order data yet
      </div>
    );
  }

  const data = slices.map((s) => ({
    name: s.productName.length > 20 ? s.productName.slice(0, 18) + "…" : s.productName,
    value: s.quantity,
    fullName: s.productName,
  }));

  return (
    <div className="min-h-[200px] w-full" style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={1.5} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            formatter={(value: number, name, props) => [
              `${value} units`,
              props.payload.fullName || name,
            ]}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{ fontSize: 11 }}
            formatter={(value, entry) => (
              <span
                className="text-slate-700 truncate max-w-[140px] inline-block"
                title={(entry?.payload as { fullName?: string } | undefined)?.fullName ?? value}
              >
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
