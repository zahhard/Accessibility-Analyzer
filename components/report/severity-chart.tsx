"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { AnalysisReport } from "@/lib/analyzer/types";
export function SeverityChart({ report }: { report: AnalysisReport }) {
  const data = [{ name: "بحرانی", value: report.summary.critical, color: "#ef4444" }, { name: "جدی", value: report.summary.serious, color: "#f97316" }, { name: "متوسط", value: report.summary.moderate, color: "#eab308" }, { name: "جزئی", value: report.summary.minor, color: "#3b82f6" }].filter((item) => item.value > 0);
  return <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"><h2 className="font-bold">توزیع شدت خطاها</h2><div className="mt-3 h-56">{data.length ? <ResponsiveContainer><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>{data.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", direction: "rtl" }} /></PieChart></ResponsiveContainer> : <p className="pt-20 text-center text-sm text-zinc-500">خطایی برای نمایش وجود ندارد.</p>}</div></section>;
}
