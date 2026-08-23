"use client";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { AnalysisReport, Severity } from "@/lib/analyzer/types";
import { ViolationItem } from "./violation-item";
export function ViolationsList({ report }: { report: AnalysisReport }) {
  const [query, setQuery] = useState(""); const [severity, setSeverity] = useState<Severity | "all">("all");
  const list = useMemo(() => report.violations.filter((item) => (severity === "all" || item.impact === severity) && `${item.id} ${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase())), [report.violations, query, severity]);
  return <section className="mt-8"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center"><div className="relative flex-1"><Search className="absolute right-3 top-3 text-zinc-500" size={17} /><input aria-label="جست‌وجوی خطاها" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جست‌وجو در خطاها…" className="focus-ring h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900 pr-10 text-sm" /></div><select aria-label="فیلتر شدت" value={severity} onChange={(e) => setSeverity(e.target.value as Severity | "all")} className="focus-ring h-11 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm"><option value="all">همه شدت‌ها</option><option value="critical">بحرانی</option><option value="serious">جدی</option><option value="moderate">متوسط</option><option value="minor">جزئی</option></select></div><p className="mb-3 text-xs text-zinc-500">{list.length} نتیجه از {report.violations.length} قانون</p><div className="space-y-3">{list.map((item, index) => <ViolationItem key={`${item.id}-${index}`} violation={item} />)}{!list.length && <div className="rounded-xl border border-dashed border-zinc-700 p-10 text-center text-sm text-zinc-500">موردی مطابق فیلتر پیدا نشد.</div>}</div></section>;
}
