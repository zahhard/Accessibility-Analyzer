"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { AnalysisReport } from "@/lib/analyzer/types";
export function SeverityChart({ report }: { report: AnalysisReport }) {
  const data = [
    { name: "بحرانی", value: report.summary.critical, color: "#dc2626" },
    { name: "جدی", value: report.summary.serious, color: "#ea580c" },
    { name: "متوسط", value: report.summary.moderate, color: "#ca8a04" },
    { name: "جزئی", value: report.summary.minor, color: "#2563eb" },
  ];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">
            اولویت‌بندی
          </p>
          <h2 className="mt-1 font-bold text-slate-900">توزیع شدت خطاها</h2>
          <p className="mt-1 text-xs text-slate-500">
            برای دیدن جزئیات، نشانگر را روی نمودار ببرید.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
          {total} مورد
        </span>
      </div>
      <div className="mt-2 grid items-center gap-2 sm:grid-cols-[1fr_.8fr]">
        <div className="h-48">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={80}
                paddingAngle={4}
                cornerRadius={6}
                stroke="#fff"
                strokeWidth={3}
              >
                {data.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
              <text
                x="50%"
                y="47%"
                textAnchor="middle"
                className="fill-slate-900 text-2xl font-black"
              >
                {total}
              </text>
              <text
                x="50%"
                y="61%"
                textAnchor="middle"
                className="fill-slate-500 text-[11px]"
              >
                کل خطاها
              </text>
              <Tooltip
                cursor={false}
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  boxShadow: "0 10px 24px rgba(15, 23, 42, .12)",
                  direction: "rtl",
                  color: "#0f172a",
                  fontSize: "12px",
                  padding: "10px 12px",
                }}
                itemStyle={{ color: "#0f172a", fontWeight: 600 }}
                labelStyle={{ color: "#475569", marginBottom: "4px" }}
                formatter={(value: number) => [`${value} مورد`, "تعداد"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-3 text-xs sm:grid-cols-1">
          {data.map((item) => (
            <li
              key={item.name}
              className="flex items-center justify-between gap-2 text-slate-600"
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}
              </span>
              <strong className="text-slate-800">{item.value}</strong>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
