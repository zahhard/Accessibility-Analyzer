"use client";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { ScoreCard } from "@/components/report/score-card";
import { SeverityChart } from "@/components/report/severity-chart";
import { SummaryCards } from "@/components/report/summary-cards";
import { ViolationsList } from "@/components/report/violations-list";
import type { AnalysisReport } from "@/lib/analyzer/types";
export default function ReportPage() {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  useEffect(() => { const stored = sessionStorage.getItem("accessibility-report"); if (stored) setReport(JSON.parse(stored) as AnalysisReport); }, []);
  if (!report) return <><AppHeader /><main className="mx-auto max-w-2xl px-5 py-24 text-center"><h1 className="text-2xl font-bold">گزارشی برای نمایش وجود ندارد</h1><p className="mt-3 text-zinc-500">ابتدا یک صفحه را تحلیل کنید تا گزارش اینجا نمایش داده شود.</p><Link href="/" className="focus-ring mt-8 inline-flex rounded-lg bg-violet-600 px-5 py-3 text-sm font-bold">بازگشت به صفحه اصلی</Link></main></>;
  return <><AppHeader /><main className="mx-auto max-w-6xl px-5 py-10"><div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><Link href="/" className="focus-ring mb-5 inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300"><ArrowRight size={16} /> صفحه اصلی</Link><h1 className="text-3xl font-black">گزارش دسترس‌پذیری</h1><p className="ltr mt-2 break-all text-sm text-zinc-500">{report.url}</p><p className="mt-1 text-xs text-zinc-600">تحلیل‌شده در {new Date(report.analyzedAt).toLocaleString("fa-IR")}</p></div><Link href="/" className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:border-violet-500"><RotateCcw size={16} /> تحلیل مجدد</Link></div><div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]"><ScoreCard report={report} /><SeverityChart report={report} /></div><div className="mt-5"><SummaryCards report={report} /></div><ViolationsList report={report} /></main></>;
}
