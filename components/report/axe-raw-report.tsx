import type { AnalysisReport } from "@/lib/analyzer/types";

export function AxeRawReport({ report }: { report: AnalysisReport }) {
  return (
    <section className="surface mt-5 rounded-2xl p-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">
          خروجی موتور تحلیل
        </p>
        <h2 className="mt-1 font-bold text-slate-900">گزارش خام axe-core</h2>
        <p className="mt-2 text-xs leading-6 text-slate-500">
          این همان ساختار JSON بازگشتی از <code dir="ltr">axe.run()</code> است؛
          گزارش خلاصه‌ی برنامه از همین داده ساخته می‌شود.
        </p>
      </div>
      <div className="mt-4 space-y-3">
        {report.axeCoreReports.map((item) => (
          <details
            key={`${item.viewportId}-${item.colorScheme}`}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <summary className="cursor-pointer list-none font-bold text-slate-800">
              {item.viewportId} · {item.colorScheme === "dark" ? "تاریک" : "روشن"}
              <span className="mr-3 text-xs font-normal text-slate-500">
                {item.result.violations.length} violation · {item.result.passes.length} pass · {item.result.incomplete.length} incomplete
              </span>
            </summary>
            <pre
              dir="ltr"
              className="mt-3 max-h-[32rem] overflow-auto rounded-lg bg-slate-950 p-4 text-left text-xs leading-6 text-slate-100"
            >
              {JSON.stringify(item.result, null, 2)}
            </pre>
          </details>
        ))}
      </div>
    </section>
  );
}
