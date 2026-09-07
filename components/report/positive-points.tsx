import { CheckCircle2, ExternalLink, Sparkles } from "lucide-react";
import type { AnalysisReport, AnalyzerPass } from "@/lib/analyzer/types";

function uniquePoints(points: AnalyzerPass[]) {
  const seen = new Set<string>();
  return points.filter((point) => {
    if (seen.has(point.id)) return false;
    seen.add(point.id);
    return true;
  });
}

export function PositivePoints({ report }: { report: AnalysisReport }) {
  const points = uniquePoints(report.positivePoints ?? []);

  return (
    <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm sm:p-6">
      <div className="flex flex-col justify-between gap-3 border-b border-emerald-100 pb-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
            <Sparkles size={18} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-emerald-700">
              نقاط قوت صفحه
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              نکات مثبت شناسایی‌شده
            </h2>
          </div>
        </div>
        <span className="text-xs text-emerald-800">
          {points.length} معیار با موفقیت بررسی شد
        </span>
      </div>
      {points.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {points.map((point) => (
            <article key={point.id} className="rounded-xl border border-emerald-100 bg-white p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={19} />
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900">{point.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{point.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-800">{point.id}</span>
                    {point.wcag.length > 0 && <span>WCAG: {point.wcag.join("، ")}</span>}
                    {point.helpUrl && (
                      <a className="inline-flex items-center gap-1 text-teal-700 underline" href={point.helpUrl} target="_blank" rel="noopener noreferrer">
                        راهنما <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-xl bg-white p-4 text-sm leading-7 text-slate-600">
          در این تحلیل، جزئیات معیارهای موفق در دسترس نیست؛ تعداد آزمون‌های موفق: {report.passesCount}.
        </p>
      )}
      <p className="mt-4 text-xs leading-6 text-emerald-900/70">
        این نکات بر اساس آزمون‌های خودکار هستند و به‌تنهایی تأیید کامل دسترس‌پذیری محسوب نمی‌شوند.
      </p>
    </section>
  );
}
