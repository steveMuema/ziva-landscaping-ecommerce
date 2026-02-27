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

type Point = { date: string; count: number };

const BAR_COLOR = "#059669";

export function OrdersCountChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <div className="min-h-[200px] flex items-center justify-center text-slate-500 text-sm">
        No orders in this period
      </div>
    );
  }

  return (
    <div className="min-h-[200px] w-full" style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(v) => (v ? String(v).slice(5) : "")}
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            width={28}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ""}
            formatter={(value: number) => [value, "Orders"]}
            labelStyle={{ color: "#475569", fontWeight: 600 }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40} name="Orders">
            {data.map((_, i) => (
              <Cell key={i} fill={BAR_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
