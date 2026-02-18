"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type Point = { date: string; revenue: number; count: number };

const BAR_COLOR = "#059669";

export function RevenueBarChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        No revenue data for this period
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => v.slice(5)}
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            labelFormatter={(_, payload) => payload[0]?.payload?.date ?? ""}
            formatter={(value: number) => [`KSH ${Number(value).toLocaleString("en-KE")}`, "Revenue"]}
            labelStyle={{ color: "#475569", fontWeight: 600 }}
          />
          <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((_, i) => (
              <Cell key={i} fill={BAR_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
