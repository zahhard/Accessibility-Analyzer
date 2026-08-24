"use client";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { AnalysisReport, Severity } from "@/lib/analyzer/types";
import { ViolationItem } from "./violation-item";
export function ViolationsList({ report }: { report: AnalysisReport }) {
  const [query, setQuery] = useState(""); const [filter, setFilter] = useState<Severity | "all">("all");
  const items = useMemo(() => report.violations.filter((item) => (filter === "all" || item.impact === filter) && `${item.id} ${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase())), [filter, query, report.violations]);
  return <section className="mt-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><h2 className="text-xl font-bold">فهرست موارد قابل اصلاح ({items.length})</h2><div className="flex gap-2"><label className="relative"><Search size={16} className="absolute right-3 top-3 text-zinc-500" /><input aria-label="جستجوی خطاها" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جستجو" className="focus-ring h-10 w-40 rounded-lg border border-zinc-800 bg-zinc-900 pr-9 text-sm" /></label><select aria-label="فیلتر شدت" value={filter} onChange={(event) => setFilter(event.target.value as Severity | "all")} className="focus-ring rounded-lg border border-zinc-800 bg-zinc-900 px-2 text-sm"><option value="all">همه</option><option value="critical">بحرانی</option><option value="serious">جدی</option><option value="moderate">متوسط</option><option value="minor">جزئی</option></select></div></div><div className="mt-5 space-y-3">{items.length ? items.map((item, index) => <ViolationItem key={`${item.id}-${index}`} violation={item} />) : <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-500">موردی با این فیلتر پیدا نشد.</div>}</div></section>;
}
