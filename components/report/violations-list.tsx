"use client";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { viewportDefinitions } from "@/lib/analyzer/types";
import type {
  AnalysisReport,
  Severity,
  ViewportId,
} from "@/lib/analyzer/types";
import { ViolationItem } from "./violation-item";
export function ViolationsList({ report }: { report: AnalysisReport }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [viewport, setViewport] = useState<ViewportId | "all">("all");
  const items = useMemo(
    () =>
      report.violations.filter(
        (item) =>
          (filter === "all" || item.impact === filter) &&
          (viewport === "all" || item.viewportId === viewport) &&
          `${item.id} ${item.title} ${item.description}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [filter, query, report.violations, viewport],
  );
  const selectedViewports = report.viewportReports.map(
    (item) => item.viewport.id,
  );
  const hasFilters = Boolean(query || filter !== "all" || viewport !== "all");
  const resetFilters = () => {
    setQuery("");
    setFilter("all");
    setViewport("all");
  };
  return (
    <section
      id="violations"
      className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="flex flex-col justify-between gap-5 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-slate-100 p-2 text-slate-500">
              <SlidersHorizontal size={17} />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">
                جزئیات فنی
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                فهرست موارد قابل اصلاح
              </h2>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            <span className="font-bold text-slate-700">{items.length}</span>{" "}
            مورد مطابق جستجو و فیلتر فعلی
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:max-w-2xl sm:justify-end">
          <label className="relative w-full sm:w-44">
            <Search
              size={16}
              className="absolute right-3 top-3 text-slate-400"
            />
            <input
              aria-label="جستجوی خطاها"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جستجوی خطاها"
              className="focus-ring h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pr-9 text-sm text-slate-800 shadow-sm placeholder:text-slate-400 transition hover:bg-white focus:bg-white"
            />
          </label>
          <select
            aria-label="فیلتر شدت"
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as Severity | "all")
            }
            className="focus-ring h-10 rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm text-slate-700 shadow-sm transition hover:bg-white"
          >
            <option value="all">همه شدت‌ها</option>
            <option value="critical">بحرانی</option>
            <option value="serious">جدی</option>
            <option value="moderate">متوسط</option>
            <option value="minor">جزئی</option>
          </select>
          {selectedViewports.length > 1 && (
            <select
              aria-label="فیلتر اندازه صفحه"
              value={viewport}
              onChange={(event) =>
                setViewport(event.target.value as ViewportId | "all")
              }
              className="focus-ring h-10 rounded-lg border border-slate-200 bg-slate-50 px-2 text-sm text-slate-700 shadow-sm transition hover:bg-white"
            >
              <option value="all">همه نمایش‌ها</option>
              {selectedViewports.map((id) => (
                <option key={id} value={id}>
                  {viewportDefinitions[id].name}
                </option>
              ))}
            </select>
          )}
          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="focus-ring inline-flex h-10 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              <X size={14} /> پاک‌کردن فیلتر
            </button>
          )}
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {items.length ? (
          items.map((item, index) => (
            <ViolationItem key={`${item.id}-${index}`} violation={item} />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="font-bold text-slate-700">موردی پیدا نشد</p>
            <p className="mt-1 text-sm text-slate-500">
              عبارت جستجو یا فیلترها را تغییر دهید.
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="focus-ring mt-4 rounded-lg bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800"
              >
                نمایش همه موارد
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
