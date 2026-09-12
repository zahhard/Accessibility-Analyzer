"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { AnalysisReport } from "@/lib/analyzer/types";

function resultSummary(result: unknown) {
  if (!result || typeof result !== "object") return "خروجی axe-core در این گزارش موجود نیست";

  const report = result as Record<string, unknown>;
  const count = (name: string) =>
    Array.isArray(report[name]) ? report[name].length : 0;

  return `${count("violations")} violation · ${count("passes")} pass · ${count("incomplete")} incomplete`;
}

export function AxeRawReport({ report }: { report: AnalysisReport }) {
  const [copiedReport, setCopiedReport] = useState<string | null>(null);

  const copyResult = async (
    key: string,
    result: AnalysisReport["axeCoreReports"][number]["result"],
  ) => {
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopiedReport(key);
    window.setTimeout(() => setCopiedReport(null), 2_000);
  };

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
                {resultSummary(item.result)}
              </span>
            </summary>
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  void copyResult(
                    `${item.viewportId}-${item.colorScheme}`,
                    item.result,
                  )
                }
                className="focus-ring inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-teal-300 hover:text-teal-700"
                aria-label="کپی خروجی JSON axe-core"
              >
                {copiedReport === `${item.viewportId}-${item.colorScheme}` ? (
                  <Check size={14} />
                ) : (
                  <Copy size={14} />
                )}
                {copiedReport === `${item.viewportId}-${item.colorScheme}`
                  ? "کپی شد"
                  : "کپی JSON"}
              </button>
            </div>
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
