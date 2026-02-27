"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

type Point = { date: string; revenue: number; profit: number };

const SALES_COLOR = "#059669";
const PROFIT_COLOR = "#2563eb";

export function SalesProfitLineChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        No data for this period
      </div>
    );
  }

  return (
    <div className="min-h-[200px] w-full" style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SALES_COLOR} stopOpacity={0.2} />
              <stop offset="100%" stopColor={SALES_COLOR} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PROFIT_COLOR} stopOpacity={0.2} />
              <stop offset="100%" stopColor={PROFIT_COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
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
            formatter={(value: number, name: string) => [
              `KSH ${Number(value).toLocaleString("en-KE")}`,
              name === "revenue" ? "Sales" : "Profit",
            ]}
            labelStyle={{ color: "#475569", fontWeight: 600 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => (value === "revenue" ? "Sales" : "Profit")}
            iconType="circle"
            iconSize={8}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={SALES_COLOR}
            strokeWidth={2}
            fill="url(#salesGradient)"
            name="revenue"
          />
          <Area
            type="monotone"
            dataKey="profit"
            stroke={PROFIT_COLOR}
            strokeWidth={2}
            fill="url(#profitGradient)"
            name="profit"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
