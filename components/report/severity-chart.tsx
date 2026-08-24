"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { AnalysisReport } from "@/lib/analyzer/types";
export function SeverityChart({ report }: { report: AnalysisReport }) {
  const data = [{ name: "بحرانی", value: report.summary.critical, color: "#EF4444" }, { name: "جدی", value: report.summary.serious, color: "#F97316" }, { name: "متوسط", value: report.summary.moderate, color: "#EAB308" }, { name: "جزئی", value: report.summary.minor, color: "#3B82F6" }];
  return <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"><h2 className="font-bold">توزیع شدت خطاها</h2><div className="mt-3 h-48"><ResponsiveContainer><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3}>{data.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={{ background: "#18181B", border: "1px solid #3F3F46", direction: "rtl" }} /></PieChart></ResponsiveContainer></div></section>;
}
