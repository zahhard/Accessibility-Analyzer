import { Gauge } from "lucide-react";
import type { AnalysisReport } from "@/lib/analyzer/types";
export function ScoreCard({ report }: { report: AnalysisReport }) {
  return (
    <section className="surface rounded-2xl p-6 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
            <Gauge size={20} />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">امتیاز پیشنهادی</p>
            <p className="mt-0.5 text-xs text-slate-500">
              برآورد خودکار با WCAG 2.2
            </p>
          </div>
        </div>
        <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
          WCAG 2.2
        </span>
      </div>
      <div className="mt-6 flex items-end gap-3">
        <span className="text-7xl font-black leading-none text-teal-700">
          {report.score}
        </span>
        <span className="mb-1 text-sm text-slate-500">از ۱۰۰</span>
      </div>
      <p className="mt-4 text-lg font-bold text-slate-900">
        {report.scoreLabel}
      </p>
      <div
        className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label="امتیاز دسترس‌پذیری"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={report.score}
      >
        <div
          className="h-full rounded-full bg-teal-600 transition-all"
          style={{ width: `${report.score}%` }}
        />
      </div>
      <div className="mt-3 flex justify-between text-[11px] text-slate-400">
        <span>نیازمند اصلاح</span>
        <span>وضعیت بهتر</span>
      </div>
      <p className="mt-5 rounded-xl bg-slate-50 p-3 text-sm leading-7 text-slate-500">
        این امتیاز برای اولویت‌بندی اصلاحات است و جایگزین ارزیابی انسانی کامل
        WCAG نمی‌شود.
      </p>
    </section>
  );
}
