"use client";
import { ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { SeverityChart } from "@/components/report/severity-chart";
import { ScoreCard } from "@/components/report/score-card";
import { SummaryCards } from "@/components/report/summary-cards";
import { ViewportSummary } from "@/components/report/viewport-summary";
import { ViolationsList } from "@/components/report/violations-list";
import type { AnalysisReport } from "@/lib/analyzer/types";
export default function ReportPage() {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  useEffect(() => { try { const value = sessionStorage.getItem("accessibility-report"); if (value) setReport(JSON.parse(value) as AnalysisReport); } catch { setReport(null); } }, []);
  if (!report) return <><AppHeader /><main className="mx-auto max-w-2xl px-5 py-24 text-center"><h1 className="text-2xl font-black text-slate-900">گزارشی برای نمایش وجود ندارد</h1><p className="mt-4 text-slate-500">ابتدا یک صفحه عمومی را تحلیل کنید.</p><Link href="/" className="focus-ring mt-8 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-3 font-bold text-white shadow-sm hover:bg-teal-800"><ArrowRight size={16} /> بازگشت به صفحه اصلی</Link></main></>;
  return <><AppHeader /><main className="relative mx-auto max-w-6xl px-5 py-10"><div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><Link href="/" className="focus-ring mb-5 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-teal-700"><ArrowRight size={16} /> صفحه اصلی</Link><p className="eyebrow text-[10px] font-bold text-teal-700">گزارش تحلیل</p><h1 className="mt-2 text-3xl font-black text-slate-900">وضعیت دسترس‌پذیری</h1><p className="ltr mt-2 break-all text-sm text-slate-500">{report.url}</p><p className="mt-1 text-xs text-slate-500">تحلیل‌شده در {new Date(report.analyzedAt).toLocaleString("fa-IR")}</p></div><Link href="/" className="focus-ring inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-700"><RotateCcw size={16} /> تحلیل مجدد</Link></div><div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]"><ScoreCard report={report} /><SeverityChart report={report} /></div><div className="mt-5"><SummaryCards report={report} /></div><ViewportSummary reports={report.viewportReports} /><ViolationsList report={report} /></main></>;
}
