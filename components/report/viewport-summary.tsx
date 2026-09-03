import { Laptop, Smartphone, Tablet } from "lucide-react";
import type { ViewportId, ViewportReport } from "@/lib/analyzer/types";

const viewportIcons: Record<ViewportId, typeof Smartphone> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Laptop,
};

export function ViewportSummary({ reports }: { reports: ViewportReport[] }) {
  if (reports.length === 0) return null;
  return (
    <section className="surface mt-5 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">
            نمایش‌های بررسی‌شده
          </p>
          <h2 className="mt-1 font-bold text-slate-900">
            نتیجه در هر اندازه صفحه
          </h2>
        </div>
        <span className="text-xs text-slate-500">
          {reports.length} viewport
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {reports.map((report) => {
          const Icon = viewportIcons[report.viewport.id];
          return (
            <article
              key={report.viewport.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-white p-2 text-teal-700 shadow-sm">
                  <Icon size={17} />
                </span>
                <span className="text-2xl font-black text-slate-900">
                  {report.score}
                </span>
              </div>
              <p className="mt-3 text-sm font-bold text-slate-800">
                {report.viewport.name}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {report.viewport.width} × {report.viewport.height} ·{" "}
                {report.issueCount} مورد
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
