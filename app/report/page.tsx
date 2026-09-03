"use client";
import { ArrowRight, Check, Copy, ExternalLink, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { SeverityChart } from "@/components/report/severity-chart";
import { ScoreCard } from "@/components/report/score-card";
import { SummaryCards } from "@/components/report/summary-cards";
import { ViewportSummary } from "@/components/report/viewport-summary";
import { ExportDialog } from "@/components/report/export-dialog";
import { ViolationsList } from "@/components/report/violations-list";
import type { AnalysisReport } from "@/lib/analyzer/types";
export default function ReportPage() {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    try {
      const value = sessionStorage.getItem("accessibility-report");
      if (value) setReport(JSON.parse(value) as AnalysisReport);
    } catch {
      setReport(null);
    }
  }, []);
  const copyUrl = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report.url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  if (!report) return;
  <>
    <AppHeader />
    <main className="mx-auto max-w-2xl px-5 py-24 text-center">
      <h1 className="text-2xl font-black text-slate-900">
        گزارشی برای نمایش وجود ندارد
      </h1>
      <p className="mt-4 text-slate-500">ابتدا یک صفحه عمومی را تحلیل کنید.</p>
      <Link
        href="/"
        className="focus-ring mt-8 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-3 font-bold text-white shadow-sm hover:bg-teal-800"
      >
        <ArrowRight size={16} /> بازگشت به صفحه اصلی
      </Link>
    </main>
  </>;
  return (
    <>
      <AppHeader />
      <main className="relative mx-auto max-w-6xl px-5 py-8 sm:py-10">
        <section className="mb-10">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="focus-ring inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-teal-700"
            >
              <ArrowRight size={16} /> صفحه اصلی
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-800">
              <span className="h-2 w-2 rounded-full bg-teal-500" /> گزارش آماده
              است
            </span>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_minmax(24rem,1.15fr)] lg:items-end">
            <div className="min-w-0">
              <p className="eyebrow text-[10px] font-bold text-teal-700">
                گزارش تحلیل
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                وضعیت دسترس‌پذیری
              </h1>
              <p className="mt-3 text-xs text-slate-500">
                تحلیل‌شده در{" "}
                {new Date(report.analyzedAt).toLocaleString("fa-IR")}
              </p>
            </div>
            <div className="flex min-w-0 flex-col items-end gap-3">
              <div className="flex w-fit max-w-full min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 transition hover:border-teal-200 hover:bg-white">
                <span
                  dir="ltr"
                  title={report.url}
                  className="min-w-0 max-w-[calc(100vw-8rem)] truncate text-sm text-slate-600 sm:max-w-[calc(100vw-24rem)] lg:max-w-[34rem]"
                >
                  {report.url}
                </span>
                <a
                  href={report.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="باز کردن سایت در زبانه جدید"
                  title="باز کردن سایت"
                  className="focus-ring shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-white hover:text-teal-700"
                >
                  <ExternalLink size={16} />
                </a>
                <button
                  type="button"
                  onClick={copyUrl}
                  aria-label="کپی آدرس سایت"
                  title={copied ? "کپی شد" : "کپی آدرس سایت"}
                  className="focus-ring shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-teal-50 hover:text-teal-700"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <ExportDialog report={report} />
                <Link
                  href="/"
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-teal-300 hover:text-teal-700"
                >
                  <RotateCcw size={16} /> تحلیل مجدد
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 h-px bg-slate-200/80" />
        </section>
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <ScoreCard report={report} />
          <SeverityChart report={report} />
        </div>
        <section className="mt-8">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow text-[10px] font-bold text-slate-400">
                خلاصه نتایج
              </p>
              <h2 className="mt-1 text-xl font-black text-slate-900">
                موارد نیازمند توجه
              </h2>
            </div>
            <p className="text-xs text-slate-500">بر اساس شدت خطا</p>
          </div>
          <SummaryCards report={report} />
        </section>
        <ViewportSummary reports={report.viewportReports} />
        <ViolationsList report={report} />
      </main>
    </>
  );
}
